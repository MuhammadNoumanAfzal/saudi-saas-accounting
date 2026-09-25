import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetCustomers, 
  useGetSuppliers,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey,
  customFetch
} from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { 
  Search, Plus, User, Building2, UploadCloud, DownloadCloud, ChevronRight, ChevronLeft,
  Users, UserCheck, Wallet, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { PartyCreateSheet } from './party-create-sheet';
import { PartyImportSheet } from './party-import-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { queryClient } from '@/lib/queryClient';
import { getErrorMessage } from '@/lib/form-errors';
import { RowActions } from '@/components/ui/row-actions';

export function PartyList({ role }: { role: 'customer' | 'supplier' }) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  
  const [createOpen, setCreateOpen] = useState(() => {
    return new URLSearchParams(window.location.search).has('new');
  });

  const [importOpen, setImportOpen] = useState(false);

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    status: status || undefined,
  };

  const isCustomer = role === 'customer';
  
  // Optimized React Query config (10 mins staleTime for 0ms navigation latency)
  const { data: customerData, isLoading: custLoading, refetch: refetchCust } = useGetCustomers(orgId, queryParams as any, {
    query: {
      enabled: Boolean(orgId) && isCustomer,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getGetCustomersQueryKey(orgId, queryParams as any)
    }
  });
  
  const { data: supplierData, isLoading: suppLoading, refetch: refetchSupp } = useGetSuppliers(orgId, queryParams as any, {
    query: {
      enabled: Boolean(orgId) && !isCustomer,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getGetSuppliersQueryKey(orgId, queryParams as any)
    }
  });

  const data = isCustomer ? customerData : supplierData;
  const isLoading = isCustomer ? custLoading : suppLoading;

  const rawItems: any[] = data?.items ?? [];
  const filteredItems = rawItems.filter((i: any) => {
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = i.displayName?.toLowerCase().includes(q) || i.businessNameEnglish?.toLowerCase().includes(q) || i.businessNameArabic?.includes(q);
      const vatMatch = i.vatNumber?.includes(q);
      const crMatch = i.commercialRegistrationNumber?.includes(q);
      const emailMatch = i.primaryEmail?.toLowerCase().includes(q);
      if (!nameMatch && !vatMatch && !crMatch && !emailMatch) return false;
    }
    if (status && i.status !== status) return false;
    return true;
  });

  const headerTitle = isCustomer ? t('Customers', 'العملاء') : t('Suppliers', 'الموردون');
  const headerDesc = isCustomer 
    ? t('Manage customer profiles, ZATCA VAT IDs, and sales ledgers.', 'إدارة ملفات العملاء، الأرقام الضريبية وسجلات المبيعات.')
    : t('Manage supplier profiles, commercial registries, and purchase bills.', 'إدارة ملفات الموردين والسجلات التجارية وفواتير المشتريات.');

  const totalCount = data?.summary?.total || rawItems.length;
  const activeCount = data?.summary?.active || rawItems.filter((i: any) => i.status !== 'inactive').length;
  const withBalanceCount = data?.summary?.withBalance || 0;

  const handleDeleteParty = async (partyId: string, partyName: string) => {
    if (!orgId) return;
    const confirmed = await showAlert.confirm(
      t(`Delete ${isCustomer ? 'Customer' : 'Supplier'}?`, `حذف ${isCustomer ? 'العميل' : 'المورد'}؟`),
      t(`Are you sure you want to delete ${partyName}? This action cannot be undone.`, `هل أنت تأكد من رغبتك في حذف ${partyName}؟ لا يمكن التراجع عن هذا الإجراء.`),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    // Optimistically update local React Query cache for 0ms instant UI removal
    const queryKey = isCustomer ? getGetCustomersQueryKey(orgId, queryParams as any) : getGetSuppliersQueryKey(orgId, queryParams as any);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.filter((item: any) => item.id !== partyId),
        summary: {
          ...oldData.summary,
          total: Math.max(0, (oldData.summary?.total || 1) - 1),
          active: Math.max(0, (oldData.summary?.active || 1) - 1),
        }
      };
    });

    showAlert.toast(
      t('Deleted Successfully!', 'تم الحذف بنجاح!'),
      'success'
    );

    try {
      const rolePlural = isCustomer ? 'customers' : 'suppliers';
      await customFetch(`/api/organizations/${orgId}/${rolePlural}/${partyId}`, {
        method: 'DELETE'
      });
      queryClient.invalidateQueries({ queryKey: isCustomer ? getGetCustomersQueryKey(orgId) : getGetSuppliersQueryKey(orgId) });
    } catch {
      queryClient.invalidateQueries({ queryKey: isCustomer ? getGetCustomersQueryKey(orgId) : getGetSuppliersQueryKey(orgId) });
    }
  };

  const handleExport = async () => {
    if (!orgId) return;
    try {
      setExporting(true);
      const rolePlural = isCustomer ? 'customers' : 'suppliers';
      const csvText = await customFetch<string>(`/api/organizations/${orgId}/${rolePlural}/export`, {
        method: 'GET',
        responseType: 'text'
      });
      
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rolePlural}_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      showAlert.success(
        t('Export Completed!', 'تم التصدير بنجاح!'),
        t(`Exported ${rolePlural} CSV data file successfully.`, `تم تحميل ملف CSV الخاص بـ ${rolePlural} بنجاح.`)
      );
    } catch (err: any) {
      showAlert.error(
        t('Export Failed', 'فشل التصدير'),
        getErrorMessage(err, t('Could not export CSV data file.', 'تعذر تصدير ملف بيانات CSV.'))
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isCustomer ? t('Client Management', 'إدارة العملاء') : t('Vendor Management', 'إدارة الموردين')}</span>
            </span>
            <span className="text-xs text-muted-foreground font-mono">SOCPA & ZATCA Verified</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{headerTitle}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{headerDesc}</p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 max-w-full">
          <Button
            type="button"
            onClick={() => (isCustomer ? refetchCust() : refetchSupp())}
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
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-primary" />
            <span>{t('Import', 'استيراد')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-primary" />
            <span>{exporting ? t('Exporting...', 'جاري التصدير...') : t('Export', 'تصدير')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-3.5 rounded-xl btn-primary shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isCustomer ? t('New Customer', 'عميل جديد') : t('New Supplier', 'مورد جديد')}</span>
          </Button>
        </div>
      </div>

      {/* Luxury KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Card 1: Total Records */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Records', 'إجمالي السجلات')}</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono mt-2">{totalCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-semibold">
            <span>{isCustomer ? t('Registered client accounts', 'حسابات العملاء المسجلة') : t('Registered vendor accounts', 'حسابات الموردين المسجلة')}</span>
          </div>
        </div>

        {/* Card 2: Active Status */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Active Status', 'الحالة النشطة')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{activeCount}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t('Ready for transactions', 'جاهز للتعاملات المالية')}</span>
          </div>
        </div>

        {/* Card 3: With Balance */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden group sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('With Open Balance', 'أصحاب الأرصدة')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono mt-2">{withBalanceCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-semibold">
            <span>{t('Accounts with pending balances', 'الحسابات ذات الأرصدة القائمة')}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card with Search & Status Filter */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={isCustomer ? t('Search customers by name, CR, VAT or email...', 'البحث في العملاء بالاسم، السجل، الرقم الضريبي...') : t('Search suppliers by name, CR, VAT or email...', 'البحث في الموردين بالاسم، السجل، الرقم الضريبي...')} 
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex gap-2">
            <select className="field bg-background h-10 w-full sm:w-44 rounded-xl text-xs font-semibold cursor-pointer" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="active">{t('Active', 'نشط')}</option>
              <option value="inactive">{t('Inactive', 'غير نشط')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{isCustomer ? t('Syncing Customer Profiles & ZATCA Tax IDs...', 'جاري تحميل ملفات العملاء والأرقام الضريبية...') : t('Syncing Supplier Profiles & CR Numbers...', 'جاري تحميل ملفات الموردين والسجلات التجارية...')}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : !filteredItems.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
              {isCustomer ? <User size={28} /> : <Building2 size={28} />}
            </div>
            <h3 className="text-lg font-black mb-1">
              {isCustomer ? t('No customers found.', 'لم يتم العثور على عملاء.') : t('No suppliers found.', 'لم يتم العثور على موردين.')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
              {isCustomer 
                ? t('Add your first customer profile or import CSV data to start issuing ZATCA invoices.', 'أضف أول ملف عميل أو استورد بيانات CSV للبدء في إصدار فواتير الزكاة.')
                : t('Add supplier profiles to track business purchase bills and expenses.', 'أضف ملفات الموردين لمتابعة فواتير ومصروفات الشراء.')}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setImportOpen(true)} className="rounded-xl text-xs font-bold gap-2 cursor-pointer">
                <UploadCloud size={16} /> {t('Import CSV', 'استيراد CSV')}
              </Button>
              <Button className="btn-primary rounded-xl text-xs font-bold gap-2 cursor-pointer" onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> {isCustomer ? t('Add Customer', 'إضافة عميل') : t('Add Supplier', 'إضافة مورد')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">{t('Name', 'الاسم')}</th>
                    <th className="px-5 py-3.5">{t('Number', 'الرقم')}</th>
                    <th className="px-5 py-3.5">{t('Status', 'الحالة')}</th>
                    <th className="px-5 py-3.5">{t('Contact', 'جهة الاتصال')}</th>
                    <th className="px-5 py-3.5">{t('City', 'المدينة')}</th>
                    <th className="px-5 py-3.5 text-right rtl:text-left">{t('Balance', 'الرصيد')}</th>
                    <th className="px-5 py-3.5 w-24 text-center">{t('Action', 'إجراء')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {filteredItems.map((item: any) => {
                    const partyNum = item.roles?.[0]?.partyNumber || (item as any).partyNumber || '-';
                    const isAct = item.status === 'active';
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-primary/5 transition-colors group cursor-pointer" 
                        onClick={() => setLocation(`/finance/${role}s/${item.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{item.displayName}</div>
                          {(item as any).businessNameArabic && (
                            <div className="text-xs text-muted-foreground arabic font-medium mt-0.5" dir="rtl">{(item as any).businessNameArabic}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-mono font-bold border border-border">
                            {partyNum}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isAct 
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            {isAct ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-foreground font-semibold text-xs">{item.primaryEmail || item.primaryPhone || '-'}</div>
                          {item.primaryEmail && item.primaryPhone && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{item.primaryPhone}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground font-semibold text-xs">
                          {item.city || (item as any).city || '-'}
                        </td>
                        <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-foreground text-sm">
                          SAR 0.00
                        </td>
                        <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <RowActions
                            onView={() => setLocation(`/finance/${role}s/${item.id}`)}
                            onEdit={() => setLocation(`/finance/${role}s/${item.id}`)}
                            onDelete={() => handleDeleteParty(item.id, item.displayName)}
                            viewLabel={t('View Details', 'عرض التفاصيل')}
                            editLabel={t('Edit Profile', 'تعديل الملف')}
                            deleteLabel={t('Delete Record', 'حذف السجل')}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-border">
              {filteredItems.map((item: any) => {
                const partyNum = item.roles?.[0]?.partyNumber || (item as any).partyNumber || '-';
                const isAct = item.status === 'active';
                return (
                  <div 
                    key={item.id} 
                    className="p-4 active:bg-primary/5 transition-colors cursor-pointer space-y-3 hover:bg-muted/20" 
                    onClick={() => setLocation(`/finance/${role}s/${item.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-foreground text-sm truncate">{item.displayName}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center flex-wrap">
                          <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-foreground">{partyNum}</span>
                          <span className="text-[11px] font-semibold">{item.partyType === 'organization' ? t('Organization', 'منشأة') : t('Individual', 'فرد')}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isAct ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            {isAct ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                          </span>
                        </div>
                      </div>
                      <div onClick={e => e.stopPropagation()} className="shrink-0">
                        <RowActions
                          onView={() => setLocation(`/finance/${role}s/${item.id}`)}
                          onEdit={() => setLocation(`/finance/${role}s/${item.id}`)}
                          onDelete={() => handleDeleteParty(item.id, item.displayName)}
                          viewLabel={t('View', 'عرض')}
                          editLabel={t('Edit', 'تعديل')}
                          deleteLabel={t('Delete', 'حذف')}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2.5 border-t border-border/60">
                      <div className="font-semibold text-foreground truncate max-w-[65%]">
                        {item.primaryPhone || item.primaryEmail || '-'}
                      </div>
                      <div className="font-mono font-black text-foreground text-sm tracking-tight text-right">
                        SAR 0.00
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PartyCreateSheet 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        role={role}
        orgId={orgId}
        onSuccess={() => {
          setCreateOpen(false);
          if (isCustomer) {
            queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey(orgId) });
          } else {
            queryClient.invalidateQueries({ queryKey: getGetSuppliersQueryKey(orgId) });
          }
        }}
      />
      <PartyImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        role={role}
        orgId={orgId}
      />
    </div>
  );
}

