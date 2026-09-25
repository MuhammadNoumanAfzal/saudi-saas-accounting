import { useState } from 'react';
import { 
  useGetCurrentSession, 
  useGetAccountLedger, 
  useListAccounts,
  getGetAccountLedgerQueryKey,
  getListAccountsQueryKey
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Printer, BookOpen, RefreshCw, Sparkles, ShieldCheck, DownloadCloud } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { AccountLedgerKpiCards } from './account-ledger-kpi-cards';

export function AccountLedgerReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const currentOrg = session?.organizations?.find(o => o.organization.id === orgId)?.organization;

  // Fast React Query caching for accounts list (10 mins staleTime)
  const { data: accountsData } = useListAccounts(orgId, {}, {
    query: {
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      queryKey: getListAccountsQueryKey(orgId)
    }
  });

  const accounts = accountsData?.items || [];
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const activeAccountId = selectedAccountId || accounts[0]?.id || '';

  // Fast React Query caching for ledger (10 mins staleTime for 0ms instant load latency)
  const queryParams = { accountId: activeAccountId };
  const { data: ledger, isLoading, refetch } = useGetAccountLedger(orgId, queryParams, {
    query: {
      enabled: Boolean(orgId) && Boolean(activeAccountId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getGetAccountLedgerQueryKey(orgId, queryParams)
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const companyNameEn = currentOrg?.legalNameEnglish || currentOrg?.tradingNameEnglish || 'Nouman Trading & Technology Co.';
  const companyNameAr = currentOrg?.legalNameArabic || currentOrg?.tradingNameArabic || 'شركة نعمان للتجارة والتقنية';
  const vatNumber = currentOrg?.vatNumber || '310998877600003';
  const crNumber = currentOrg?.commercialRegistrationNumber || '1010889922';

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'MANUAL_JOURNAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">{isRtl ? 'قيد يدوي' : 'Manual Journal'}</span>;
      case 'INVOICE':
      case 'INVOICE_PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">{isRtl ? 'مبيعات / تحصيل' : 'Sales Invoice'}</span>;
      case 'PURCHASE_BILL':
      case 'BILL_PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">{isRtl ? 'مشتريات / سداد' : 'Purchase Bill'}</span>;
      case 'EXPENSE':
      case 'EXPENSE_PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">{isRtl ? 'مصروفات' : 'Expense'}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap">{source}</span>;
    }
  };

  const handleExportCSV = () => {
    if (!ledger || !ledger.entries) return;
    const headers = ['Date', 'Reference #', 'Source', 'Description', 'Debit (SAR)', 'Credit (SAR)', 'Running Balance (SAR)'];
    const rows = ledger.entries.map(entry => [
      `"${new Date(entry.date).toLocaleDateString()}"`,
      `"${entry.reference}"`,
      `"${entry.source}"`,
      `"${entry.description}"`,
      `"${Number(entry.debit).toFixed(2)}"`,
      `"${Number(entry.credit).toFixed(2)}"`,
      `"${Number(entry.runningBalance).toFixed(2)}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `account_ledger_${ledger.accountCode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('Account Ledger Exported Successfully!', 'تم تصدير كشف الحساب بنجاح!'), 'success');
  };

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Official Print Header - Visible when printing */}
      <div className="hidden print:block mb-8 pb-6 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{companyNameAr}</h1>
            <p className="text-sm font-semibold text-slate-700">{companyNameEn}</p>
            <p className="text-xs text-slate-600 mt-1">الرياض، المملكة العربية السعودية</p>
            <div className="text-xs text-slate-600 mt-0.5 flex gap-4">
              <span><strong>سجل تجاري:</strong> {crNumber}</span>
              <span><strong>الرقم الضريبي:</strong> {vatNumber}</span>
            </div>
          </div>
          <div className="text-right rtl:text-left">
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-bold rounded text-xs mb-1">
              كشف حساب معتمد SOCPA
            </div>
            <h2 className="text-xl font-bold text-slate-900">كشف حساب تفصيلي (Statement of Account)</h2>
            <p className="text-xs font-mono font-bold text-slate-700">
              {ledger?.accountCode} — {ledger?.accountNameAr} ({ledger?.accountNameEn})
            </p>
          </div>
        </div>
      </div>

      {/* Luxury Screen Header & Action Toolbar Bar (Hidden on Print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('General Ledger Audit', 'تدقيق دفتر الأستاذ العام')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> SOCPA Statement
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('Statement of Account / Account Ledger', 'كشف حساب تفصيلي (Statement of Account)')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Detailed transaction audit history for selected SOCPA account with running balance.', 'سجل حركات كشف الحساب الفردي والرصيد التراكمي في دفتر الأستاذ العام.')}
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
            onClick={handlePrint} 
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Statement', 'طباعة كشف الحساب')}</span>
          </Button>
        </div>
      </div>

      {/* Account Selector Filter Bar (Screen only) */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-foreground shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>{t('Select Account:', 'اختر الحساب المحاسبي:')}</span>
          </div>
          <select
            value={activeAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                [{acc.code}] — {acc.nameArabic} ({acc.nameEnglish}) - {acc.type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Component */}
      <AccountLedgerKpiCards
        openingBalance={Number(ledger?.openingBalance || 0)}
        totalDebit={Number(ledger?.totalDebit || 0)}
        totalCredit={Number(ledger?.totalCredit || 0)}
        closingBalance={Number(ledger?.closingBalance || 0)}
        currency="SAR"
        isLoading={isLoading}
      />

      {/* Ledger Entries Table */}
      {isLoading ? (
        <div className="p-4 space-y-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('Compiling General Ledger Statement & Running Balances...', 'جاري تجميع حركات كشف الحساب والأرصدة التراكمية...')}</span>
          </div>
          <SkeletonTable rows={6} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs print:border-none print:shadow-none">
          <div className="p-4 bg-muted/40 border-b border-border font-extrabold text-sm flex items-center gap-2 text-foreground print:bg-slate-100">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>[{ledger?.accountCode}] — {isRtl ? ledger?.accountNameAr : ledger?.accountNameEn}</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Date', 'التاريخ')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Reference #', 'رقم مرجعي')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Source', 'المصدر')}</th>
                  <th className="px-5 py-3.5">{t('Description / Particulars', 'البيان المحاسبي التفصيلي')}</th>
                  <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Debit (+)', 'مدين (+)')}</th>
                  <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Credit (-)', 'دائن (-)')}</th>
                  <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Running Balance', 'الرصيد الجاري')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {ledger?.entries?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      {t('No journal voucher entries found for this account in the selected period.', 'لا توجد قيود أو حركات لهذا الحساب في الفترة المحددة.')}
                    </td>
                  </tr>
                ) : (
                  ledger?.entries?.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-muted-foreground text-xs">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-extrabold text-primary text-xs">
                        {entry.reference}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getSourceBadge(entry.source)}
                      </td>
                      <td className="px-5 py-4 font-extrabold text-foreground text-sm">
                        {entry.description}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                        {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit), 'SAR', isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs whitespace-nowrap">
                        {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit), 'SAR', isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left font-mono font-black text-foreground text-xs whitespace-nowrap">
                        {formatCurrency(Number(entry.runningBalance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden divide-y divide-border">
            {ledger?.entries?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                {t('No journal voucher entries found for this account.', 'لا توجد قيود أو حركات لهذا الحساب.')}
              </div>
            ) : (
              ledger?.entries?.map((entry, idx) => (
                <div key={idx} className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-foreground text-sm truncate">{entry.description}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center flex-wrap">
                        <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary whitespace-nowrap">
                          {entry.reference}
                        </span>
                        {getSourceBadge(entry.source)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Debit (+)', 'مدين (+)')}</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] mt-0.5">
                        {Number(entry.debit) > 0 ? `SAR ${Number(entry.debit).toFixed(2)}` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Credit (-)', 'دائن (-)')}</div>
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] mt-0.5">
                        {Number(entry.credit) > 0 ? `SAR ${Number(entry.credit).toFixed(2)}` : '—'}
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Balance', 'الرصيد')}</div>
                      <div className="font-mono font-black text-foreground text-xs mt-0.5">
                        SAR {Number(entry.runningBalance).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Printable Official Certification & Signature Block */}
      <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
          <div>
            <p className="font-bold text-slate-900">إعداد / المحاسب المسؤول (Accountant)</p>
            <p className="text-slate-500 mt-1">Nouman Trading & Technology Co.</p>
            <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
              <span>التوقيع والختم / Signature</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-900">اعتماد / مدير الإدارة المالية (CFO)</p>
            <p className="text-slate-500 mt-1">المحاسبة والمالية - SOCPA</p>
            <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
              <span>التوقيع والختم / Signature</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-3">
          تم استخراج كشف الحساب آلياً عبر نظام NEXUS SaaS المحاسبي المتوافق مع الهيئة العامة للزكاة والدخل (ZATCA) والمعايير السعودية (SOCPA).
        </div>
      </div>
    </div>
  );
}
