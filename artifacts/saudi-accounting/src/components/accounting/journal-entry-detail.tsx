import { useLocation, useParams } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useGetJournalEntry,
  getGetJournalEntryQueryKey
} from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Printer, FileSpreadsheet, CheckCircle2, ShieldCheck } from 'lucide-react';

interface JournalEntryDetailProps {
  entryId?: string;
}

export function JournalEntryDetail({ entryId }: JournalEntryDetailProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const params = useParams();
  const effectiveId = entryId || params.entryId || params.id || '';

  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: entry, isLoading } = useGetJournalEntry(orgId, effectiveId, {
    query: {
      enabled: !!orgId && !!effectiveId,
      queryKey: getGetJournalEntryQueryKey(orgId, effectiveId)
    }
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">{isRtl ? 'جاري تحميل تفاصيل سند القيد المحاسبي...' : 'Loading journal voucher details...'}</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'لم يتم العثور على القيد' : 'Voucher not found'}</p>
        <Button onClick={() => setLocation('/accounting/journal-entries')} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
          {isRtl ? 'العودة لقائمة القيود' : 'Back to Entries'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Printable Document Header - Visible when printing */}
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
              سند قيد متوازن 100% (Balanced JV)
            </div>
            <h2 className="text-xl font-bold text-slate-900">سند قيد محاسبي مزدوج</h2>
            <p className="text-xs font-mono font-bold text-indigo-700">{entry.entryNumber}</p>
          </div>
        </div>
      </div>

      {/* Screen Top Bar */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLocation('/accounting/journal-entries')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">{entry.entryNumber}</h1>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 inline-block mr-1 rtl:ml-1 rtl:mr-0" />
                {entry.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'تاريخ الترحيل:' : 'Posting Date:'} {new Date(entry.postingDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
            </p>
          </div>
        </div>

        <Button
          onClick={() => window.print()}
          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
        >
          <Printer className="w-4 h-4" />
          {isRtl ? 'طباعة سند القيد (Print)' : 'Print Voucher'}
        </Button>
      </div>

      {/* Main Voucher Display Layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Header Title */}
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6 print:border-slate-300">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
            {isRtl ? 'سند قيد محاسبي مزدوج (Double-Entry Journal Voucher)' : 'Double-Entry Journal Voucher'}
          </h2>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1 print:text-slate-800">
            {entry.description}
          </p>
          {entry.descriptionAr && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 print:text-slate-600">{entry.descriptionAr}</p>
          )}
        </div>

        {/* Voucher Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 print:bg-slate-100 print:border-slate-300">
          <div>
            <span className="text-slate-500 block mb-1 font-medium">{isRtl ? 'رقم القيد' : 'Voucher #'}</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm print:text-slate-900">{entry.entryNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 font-medium">{isRtl ? 'تاريخ القيد' : 'Entry Date'}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm print:text-slate-900">
              {new Date(entry.entryDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 font-medium">{isRtl ? 'نوع المستند المصدر' : 'Source Document'}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm print:text-slate-900">{entry.sourceDocumentType || 'MANUAL_JOURNAL'}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 font-medium">{isRtl ? 'الرقم المرجعي' : 'Reference #'}</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-sm print:text-slate-900">{entry.referenceNumber || '—'}</span>
          </div>
        </div>

        {/* Lines Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
          <table className="w-full text-sm text-left rtl:text-right border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-slate-800 print:bg-slate-200 print:text-slate-900">
              <tr>
                <th className="px-4 py-3 print:py-2">#</th>
                <th className="px-4 py-3 print:py-2">{isRtl ? 'رمز الحساب' : 'Account Code'}</th>
                <th className="px-4 py-3 print:py-2">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                <th className="px-4 py-3 print:py-2">{isRtl ? 'البيان التفصيلي' : 'Line Description'}</th>
                <th className="px-4 py-3 print:py-2 text-right rtl:text-left">{isRtl ? 'مدين (Debit)' : 'Debit'}</th>
                <th className="px-4 py-3 print:py-2 text-right rtl:text-left">{isRtl ? 'دائن (Credit)' : 'Credit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
              {entry.lines?.map((line, idx) => (
                <tr key={line.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 print:py-2 text-xs text-slate-400 font-bold">{idx + 1}</td>
                  <td className="px-4 py-3 print:py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-slate-900">
                    {line.accountCode || '—'}
                  </td>
                  <td className="px-4 py-3 print:py-2 font-semibold text-slate-900 dark:text-slate-100 print:text-slate-900">
                    {line.accountName || '—'}
                  </td>
                  <td className="px-4 py-3 print:py-2 text-slate-500 dark:text-slate-400 print:text-slate-700 text-xs">
                    {line.description || entry.description}
                  </td>
                  <td className="px-4 py-3 print:py-2 text-right rtl:text-left font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-slate-900">
                    {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                  </td>
                  <td className="px-4 py-3 print:py-2 text-right rtl:text-left font-mono font-bold text-indigo-600 dark:text-indigo-400 print:text-slate-900">
                    {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 print:bg-slate-200 print:text-slate-900">
              <tr>
                <td colSpan={4} className="px-4 py-3.5 print:py-2 text-base">
                  {isRtl ? 'المجموع الإجمالي لسند القيد' : 'Total Voucher Amount'}
                </td>
                <td className="px-4 py-3.5 print:py-2 text-right rtl:text-left font-mono text-emerald-700 dark:text-emerald-400 print:text-slate-900 text-base">
                  {parseFloat(entry.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </td>
                <td className="px-4 py-3.5 print:py-2 text-right rtl:text-left font-mono text-indigo-700 dark:text-indigo-400 print:text-slate-900 text-base">
                  {parseFloat(entry.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Printable Official Certification & Signature Block */}
        <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-300">
          <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
            <div>
              <p className="font-bold text-slate-900">إعداد وتدقيق / المحاسب المسؤول</p>
              <p className="text-slate-500 mt-1">Nouman Trading & Technology Co.</p>
              <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
                <span>التوقيع والختم / Signature</span>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-900">اعتماد / المدير المالي (Chief Financial Officer)</p>
              <p className="text-slate-500 mt-1">المحاسبة والمالية - SOCPA</p>
              <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
                <span>التوقيع والختم / Signature</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-3">
            تم استخراج هذا السند آلياً عبر نظام NEXUS SaaS المحاسبي المتوافق مع الهيئة العامة للزكاة والدخل (ZATCA) والمعايير السعودية (SOCPA).
          </div>
        </div>
      </div>
    </div>
  );
}
