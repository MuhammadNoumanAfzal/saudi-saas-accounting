import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useGetJournalEntry,
  getGetJournalEntryQueryKey
} from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Printer, FileSpreadsheet, CheckCircle2, Building2 } from 'lucide-react';

interface JournalEntryDetailProps {
  entryId: string;
}

export function JournalEntryDetail({ entryId }: JournalEntryDetailProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: entry, isLoading } = useGetJournalEntry(orgId, entryId, {
    query: {
      enabled: !!orgId && !!entryId,
      queryKey: getGetJournalEntryQueryKey(orgId, entryId)
    }
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
        <p className="text-sm">{isRtl ? 'جاري تحميل تفاصيل القيد...' : 'Loading voucher details...'}</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <p>{isRtl ? 'لم يتم العثور على القيد' : 'Voucher not found'}</p>
        <Button onClick={() => setLocation('/accounting/journal-entries')} className="mt-4">
          {isRtl ? 'العودة لقائمة القيود' : 'Back to Entries'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLocation('/accounting/journal-entries')}
            className="p-2"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{entry.entryNumber}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                {entry.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'تاريخ التليق والقيد:' : 'Posting Date:'} {new Date(entry.postingDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => window.print()}
          className="text-xs"
        >
          <Printer className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
          {isRtl ? 'طباعة سند القيد' : 'Print Voucher'}
        </Button>
      </div>

      {/* Main Printed Voucher Layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-8">
        {/* Header Title */}
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isRtl ? 'سند قيد محاسبي مزدوج' : 'Double-Entry Journal Voucher'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {entry.description}
          </p>
        </div>

        {/* Voucher Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">{isRtl ? 'رقم القيد' : 'Voucher #'}</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{entry.entryNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">{isRtl ? 'تاريخ القيد' : 'Entry Date'}</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
              {new Date(entry.entryDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">{isRtl ? 'نوع المستند المصدر' : 'Source Document'}</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{entry.sourceDocumentType}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">{isRtl ? 'الرقم المرجعي' : 'Reference #'}</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-sm">{entry.referenceNumber || '—'}</span>
          </div>
        </div>

        {/* Lines Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{isRtl ? 'رمز الحساب' : 'Account Code'}</th>
                <th className="px-4 py-3">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                <th className="px-4 py-3">{isRtl ? 'البيان التفصيلي' : 'Line Description'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'مدين (Debit)' : 'Debit'}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'دائن (Credit)' : 'Credit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {entry.lines?.map((line, idx) => (
                <tr key={line.id || idx}>
                  <td className="px-4 py-3 text-xs text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {line.accountCode || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {line.accountName || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {line.description || entry.description}
                  </td>
                  <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-blue-600 dark:text-blue-400">
                    {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {isRtl ? 'المجموع الإجمالي للسند' : 'Total Voucher Amount'}
                </td>
                <td className="px-4 py-3 text-right rtl:text-left font-mono text-emerald-600 dark:text-emerald-400">
                  {parseFloat(entry.totalDebit).toFixed(2)} SAR
                </td>
                <td className="px-4 py-3 text-right rtl:text-left font-mono text-blue-600 dark:text-blue-400">
                  {parseFloat(entry.totalCredit).toFixed(2)} SAR
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
