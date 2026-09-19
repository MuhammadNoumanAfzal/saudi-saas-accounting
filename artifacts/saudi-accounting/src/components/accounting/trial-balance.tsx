import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useGetTrialBalance,
  getGetTrialBalanceQueryKey
} from '@workspace/api-client-react';
import { Scale, Printer, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function TrialBalance() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data, isLoading, refetch } = useGetTrialBalance(orgId, {}, {
    query: {
      enabled: !!orgId,
      queryKey: getGetTrialBalanceQueryKey(orgId, {}),
    }
  });

  const items = data?.items || [];
  const totalDebit = data?.totalDebit || '0.00';
  const totalCredit = data?.totalCredit || '0.00';
  const isBalanced = data?.isBalanced ?? true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {isRtl ? 'ميزان المراجعة (Trial Balance)' : 'Trial Balance Report'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl 
              ? 'تقرير تفصيلي برصيد جميع الحسابات المحاسبية للتأكد من موازنة الدفاتر' 
              : 'Summary report of all debit and credit account balances for general ledger verification'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            className="text-xs"
          >
            <RefreshCw className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isRtl ? 'تحديث' : 'Refresh'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isRtl ? 'طباعة التقرير' : 'Print Report'}
          </Button>
        </div>
      </div>

      {/* Status Balance Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
        isBalanced 
          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
          : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isBalanced 
                ? (isRtl ? 'ميزان المراجعة متوازن 100%' : 'Trial Balance is 100% Balanced')
                : (isRtl ? 'ميزان المراجعة غير متوازن!' : 'Trial Balance Discrepancy Detected')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'إجمالي المدين يطابق إجمالي الدائن تماماً' : 'Total Debits match Total Credits across all general ledger accounts'}
            </p>
          </div>
        </div>

        <div className="text-right rtl:text-left font-mono">
          <div className="text-xs text-slate-500">{isRtl ? 'تاريخ الاستخراج:' : 'As of:'}</div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {data?.asOfDate ? new Date(data.asOfDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">{isRtl ? 'جاري استخراج ميزان المراجعة...' : 'Generating Trial Balance...'}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Scale className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {isRtl ? 'لا توجد بيانات حسابات' : 'No account data'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-slate-600 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'رمز الحساب' : 'Code'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'النوع' : 'Type'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'حركة المدين' : 'Total Debit'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'حركة الدائن' : 'Total Credit'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'الرصيد الصافي' : 'Net Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.accountId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{item.nameArabic}</div>
                      <div className="text-xs text-slate-400">{item.nameEnglish}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {parseFloat(item.debit) > 0 ? parseFloat(item.debit).toFixed(2) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {parseFloat(item.credit) > 0 ? parseFloat(item.credit).toFixed(2) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                      {parseFloat(item.netBalance).toFixed(2)} SAR
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-base">
                    {isRtl ? 'المجموع الإجمالي لميزان المراجعة' : 'Grand Total Trial Balance'}
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left font-mono text-emerald-600 dark:text-emerald-400 text-base">
                    {parseFloat(totalDebit).toFixed(2)} SAR
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left font-mono text-blue-600 dark:text-blue-400 text-base">
                    {parseFloat(totalCredit).toFixed(2)} SAR
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left font-mono text-indigo-600 dark:text-indigo-400 text-base">
                    0.00 SAR
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
