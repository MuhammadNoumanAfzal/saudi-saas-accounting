import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import { 
  useGetCurrentSession, 
  useListAccounts,
  getListAccountsQueryKey,
  customFetch
} from '@workspace/api-client-react';
import type { Account } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Landmark, Plus, Search, Filter, RefreshCw, Sparkles, ShieldCheck, DownloadCloud, Tag, Calendar, Pencil
} from 'lucide-react';
import { AccountKpiCards } from './account-kpi-cards';
import { AccountTable } from './account-table';
import { AccountCreateSheet } from './account-create-sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AccountsList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [viewAccount, setViewAccount] = useState<Account | null>(null);

  const queryParams = {
    search: debouncedSearch || undefined,
    type: (typeFilter as any) || undefined,
  };

  // Fast React Query caching (10 mins staleTime for 0ms instant load latency)
  const { data, isLoading, refetch } = useListAccounts(orgId, queryParams as any, {
    query: {
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getListAccountsQueryKey(orgId, queryParams as any),
    },
  });

  const accounts: Account[] = data?.items || [];

  const handleDeleteAccount = async (account: Account) => {
    if (account.isSystemAccount) {
      showAlert.error(
        t('System Account', 'حساب نظامي'),
        t('System accounts cannot be deleted as they are bound to ZATCA & SOCPA standard ledgers.', 'لا يمكن حذف الحسابات النظامية المرتبطة بالسجلات المحاسبية والضريبية المعتمدة.')
      );
      return;
    }

    const confirmed = await showAlert.confirm(
      t(`Delete Account ${account.code}?`, `حذف الحساب ${account.code}؟`),
      t(`Are you sure you want to delete ${account.nameArabic} (${account.nameEnglish})? This action cannot be undone.`, `هل أنت تأكد من رغبتك في حذف ${account.nameArabic}؟ لا يمكن التراجع عن هذا الإجراء.`),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    // Optimistically remove from React Query cache for 0ms instant UI response
    const queryKey = getListAccountsQueryKey(orgId, queryParams as any);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.filter((item: any) => item.id !== account.id),
        total: Math.max(0, (oldData.total || 1) - 1),
      };
    });

    showAlert.toast(
      t('Account Deleted Successfully!', 'تم حذف الحساب بنجاح!'),
      'success'
    );

    try {
      await customFetch(`/api/organizations/${orgId}/accounting/accounts/${account.id}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey(orgId) });
    } catch (err: any) {
      console.error(err);
      queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey(orgId) });
      showAlert.error(t('Delete Failed', 'فشل الحذف'), getErrorMessage(err, t('Failed to delete account.', 'تعذر حذف الحساب.')));
    }
  };

  const handleExportCSV = () => {
    if (accounts.length === 0) return;
    const headers = ['Code', 'Arabic Name', 'English Name', 'Type', 'Subtype', 'System Account'];
    const rows = accounts.map(a => [
      `"${a.code}"`,
      `"${a.nameArabic}"`,
      `"${a.nameEnglish}"`,
      `"${a.type}"`,
      `"${a.subtype}"`,
      a.isSystemAccount ? 'System' : 'Custom'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('CSV Exported Successfully!', 'تم تصدير الدليل بنجاح!'), 'success');
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('SOCPA General Ledger', 'دليل الحسابات الموحد SOCPA')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA Compliant Structure
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Chart of Accounts', 'شجرة الحسابات')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Standardized Saudi SOCPA Chart of Accounts for Assets, Liabilities, Revenue & Expenses.', 'دليل الحسابات الموحد المعترف به حسب معايير الهيئة السعودية للمحاسبين القانونيين (SOCPA).')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Data', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Export', 'تصدير')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('New Account', 'إضافة حساب جديد')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Component */}
      <AccountKpiCards accounts={accounts} isLoading={isLoading} />

      {/* Main Table Card with Search & Category Filter */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder={t('Search by account code or name...', 'البحث بالرمز أو اسم الحساب...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Filter size={15} className="text-muted-foreground shrink-0" />
            <select 
              className="field bg-background h-10 w-full sm:w-52 rounded-xl text-xs font-semibold cursor-pointer" 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">{t('All Account Types', 'جميع أنواع الحسابات')}</option>
              <option value="ASSET">{t('Assets (أصول)', 'Assets (أصول)')}</option>
              <option value="LIABILITY">{t('Liabilities (التزامات)', 'Liabilities (التزامات)')}</option>
              <option value="EQUITY">{t('Equity (حقوق ملكية)', 'Equity (حقوق ملكية)')}</option>
              <option value="REVENUE">{t('Revenue (إيرادات)', 'Revenue (إيرادات)')}</option>
              <option value="EXPENSE">{t('Expenses (مصروفات)', 'Expenses (مصروفات)')}</option>
            </select>
          </div>
        </div>

        {/* Account Table Component */}
        <AccountTable 
          accounts={accounts}
          isLoading={isLoading}
          search={search}
          typeFilter={typeFilter}
          onViewAccount={setViewAccount}
          onEditAccount={setEditAccount}
          onDeleteAccount={handleDeleteAccount}
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      {/* Account Create Sheet */}
      <AccountCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
        onSuccess={() => {
          setCreateOpen(false);
          refetch();
        }}
      />

      {/* Account Edit Sheet */}
      <AccountCreateSheet
        open={Boolean(editAccount)}
        onOpenChange={(nextOpen) => { if (!nextOpen) setEditAccount(null); }}
        orgId={orgId}
        initialAccount={editAccount}
        onSuccess={() => {
          setEditAccount(null);
          refetch();
        }}
      />

      {/* Account Details View Modal */}
      <Dialog open={Boolean(viewAccount)} onOpenChange={(open) => { if (!open) setViewAccount(null); }}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-card border border-border shadow-xl">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/10 text-primary font-mono font-extrabold text-xs border border-primary/20">
                {viewAccount?.code}
              </span>
              {viewAccount?.isSystemAccount ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck size={12} /> SOCPA System Account
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-bold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full border border-border">
                  Custom Account
                </span>
              )}
            </div>
            <DialogTitle className="text-xl font-black tracking-tight text-foreground mt-3">
              {viewAccount?.nameArabic}
            </DialogTitle>
            <div className="text-xs font-medium text-muted-foreground">
              {viewAccount?.nameEnglish}
            </div>
          </DialogHeader>

          {viewAccount && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mb-1">
                    <Tag size={12} className="text-primary" />
                    <span>{t('Account Type', 'نوع الحساب')}</span>
                  </div>
                  <div className="text-xs font-extrabold text-foreground">
                    {viewAccount.type}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mb-1">
                    <Calendar size={12} className="text-primary" />
                    <span>{t('Subtype', 'التصنيف الفرعي')}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-foreground truncate">
                    {viewAccount.subtype}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>{t('System Account', 'حساب نظامي')}</span>
                  <span className="font-bold text-foreground">{viewAccount.isSystemAccount ? t('Yes', 'نعم') : t('No', 'لا')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{t('Status', 'الحالة')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('Active', 'نشط')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewAccount(null)}
                  className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
                >
                  {t('Close', 'إغلاق')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const acc = viewAccount;
                    setViewAccount(null);
                    setEditAccount(acc);
                  }}
                  className="btn-primary rounded-xl text-xs font-bold px-4 py-2 gap-1.5 cursor-pointer"
                >
                  <Pencil size={14} />
                  <span>{t('Edit Account', 'تعديل الحساب')}</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
