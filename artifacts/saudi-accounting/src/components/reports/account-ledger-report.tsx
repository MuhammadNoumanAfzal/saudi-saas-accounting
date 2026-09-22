import { useState } from 'react';
import { useGetCurrentSession, useGetAccountLedger, useListAccounts } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Printer, BookOpen, Filter, TrendingUp, TrendingDown, Layers, ShieldCheck } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/platform-loader';

export function AccountLedgerReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: accountsData } = useListAccounts(orgId, {}, {
    query: { enabled: !!orgId }
  });

  const accounts = accountsData?.items || [];
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const activeAccountId = selectedAccountId || accounts[0]?.id || '';

  const { data: ledger, isLoading } = useGetAccountLedger(orgId, {
    accountId: activeAccountId,
  }, {
    query: { enabled: !!orgId && !!activeAccountId }
  });

  const handlePrint = () => {
    window.print();
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'MANUAL_JOURNAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">{isRtl ? 'قيد يدوي' : 'Manual Journal'}</span>;
      case 'INVOICE':
      case 'INVOICE_PAYMENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">{isRtl ? 'مبيعات / تحصيل' : 'Sales Invoice'}</span>;
      case 'PURCHASE_BILL':
      case 'BILL_PAYMENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{isRtl ? 'مشتريات / سداد' : 'Purchase Bill'}</span>;
      case 'EXPENSE':
      case 'EXPENSE_PAYMENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">{isRtl ? 'مصروفات' : 'Expense'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">{source}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Official Print Header - Visible when printing */}
      <div className="hidden print:block mb-8 pb-6 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">شركة نعمان للتجارة والتقنية</h1>
            <p className="text-sm font-semibold text-slate-700">Nouman Trading & Technology Co.</p>
            <p className="text-xs text-slate-600 mt-1">الرياض، المملكة العربية السعودية | King Fahd Road, Riyadh</p>
            <div className="text-xs text-slate-600 mt-0.5 flex gap-4">
              <span><strong>سجل تجاري:</strong> 1010889922</span>
              <span><strong>الرقم الضريبي:</strong> 310998877600003</span>
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

      {/* Screen Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t('Statement of Account / Account Ledger', 'كشف حساب تفصيلي (Statement of Account)')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('Detailed transaction audit history for selected SOCPA account with running balance.', 'سجل حركات كشف الحساب الفردي والرصيد التراكمي في دفتر الأستاذ العام.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
            <Printer className="w-4 h-4" />
            <span>{t('Print Statement', 'طباعة كشف الحساب')}</span>
          </Button>
        </div>
      </div>

      {/* Account Selector Filter Bar (Screen only) */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 shrink-0">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('Select Account:', 'اختر الحساب المحاسبي:')}</span>
          </div>
          <select
            value={activeAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex-1 h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                [{acc.code}] — {acc.nameArabic} ({acc.nameEnglish}) - {acc.type}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      {ledger && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-medium text-slate-500">{t('Opening Balance', 'الرصيد الافتتاحي')}</div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(Number(ledger.openingBalance || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>

          <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span>{t('Total Debit (+)', 'إجمالي حركة المدين (+)')}</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(Number(ledger.totalDebit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>

          <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 shadow-xs">
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
              <span>{t('Total Credit (-)', 'إجمالي حركة الدائن (-)')}</span>
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(Number(ledger.totalCredit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>

          <Card className="p-4 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-xs">
            <div className="text-xs font-bold text-purple-800 dark:text-purple-300">{t('Closing Cumulative Balance', 'الرصيد الختامي المتراكم')}</div>
            <div className="text-2xl font-extrabold font-mono text-purple-700 dark:text-purple-300 mt-1">
              {formatCurrency(Number(ledger.closingBalance || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>
        </div>
      )}

      {/* Ledger Entries Table */}
      {isLoading ? (
        <div className="p-4 space-y-4 soft-card">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('Compiling General Ledger Statement & Running Balances...', 'جاري تجميع حركات كشف الحساب والأرصدة التراكمية...')}</span>
          </div>
          <SkeletonTable rows={6} />
        </div>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs print:border-none print:shadow-none">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/70 pb-3 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>[{ledger?.accountCode}] — {isRtl ? ledger?.accountNameAr : ledger?.accountNameEn}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-slate-800 print:bg-slate-200 print:text-slate-900">
                  <tr>
                    <th className="px-4 py-3 print:py-2">{t('Date', 'التاريخ')}</th>
                    <th className="px-4 py-3 print:py-2">{t('Reference #', 'رقم مرجعي')}</th>
                    <th className="px-4 py-3 print:py-2">{t('Source', 'المصدر')}</th>
                    <th className="px-4 py-3 print:py-2">{t('Description / Particulars', 'البيان المحاسبي التفصيلي')}</th>
                    <th className="px-4 py-3 print:py-2 text-right rtl:text-left">{t('Debit (مدين)', 'مدين (+)')}</th>
                    <th className="px-4 py-3 print:py-2 text-right rtl:text-left">{t('Credit (دائن)', 'دائن (-)')}</th>
                    <th className="px-4 py-3 print:py-2 text-right rtl:text-left">{t('Running Balance', 'الرصيد الجاري')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
                  {ledger?.entries?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-500">
                        {t('No journal voucher entries found for this account in the selected period.', 'لا توجد قيود أو حركات لهذا الحساب في الفترة المحددة.')}
                      </td>
                    </tr>
                  ) : (
                    ledger?.entries?.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 print:py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {new Date(entry.date).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                        </td>
                        <td className="px-4 py-3 print:py-2 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 print:text-slate-900">
                          {entry.reference}
                        </td>
                        <td className="px-4 py-3 print:py-2">
                          {getSourceBadge(entry.source)}
                        </td>
                        <td className="px-4 py-3 print:py-2 font-semibold text-slate-900 dark:text-slate-100 print:text-slate-900">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 print:py-2 text-right rtl:text-left font-mono text-emerald-600 dark:text-emerald-400 font-bold print:text-slate-900">
                          {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit), 'SAR', isRtl ? 'ar-SA' : 'en-US') : '—'}
                        </td>
                        <td className="px-4 py-3 print:py-2 text-right rtl:text-left font-mono text-indigo-600 dark:text-indigo-400 font-bold print:text-slate-900">
                          {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit), 'SAR', isRtl ? 'ar-SA' : 'en-US') : '—'}
                        </td>
                        <td className="px-4 py-3 print:py-2 text-right rtl:text-left font-mono font-extrabold text-slate-900 dark:text-slate-100 print:text-slate-900">
                          {formatCurrency(Number(entry.runningBalance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
