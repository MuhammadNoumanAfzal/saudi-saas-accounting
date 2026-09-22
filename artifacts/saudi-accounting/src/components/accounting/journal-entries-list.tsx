import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListJournalEntries,
  getListJournalEntriesQueryKey
} from '@workspace/api-client-react';
import type { JournalEntry } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { FileSpreadsheet, Plus, Search, Filter, CheckCircle2, Eye, ArrowRight, ArrowLeft } from 'lucide-react';
import { JournalEntryCreateSheet } from './journal-entry-create-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';

interface JournalEntriesListProps {
  onSelectEntry?: (id: string) => void;
}

export function JournalEntriesList({ onSelectEntry }: JournalEntriesListProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    sourceDocumentType: sourceFilter || undefined,
  };

  const { data, isLoading, refetch } = useListJournalEntries(orgId, queryParams as any, {
    query: { 
      enabled: !!orgId, 
      queryKey: getListJournalEntriesQueryKey(orgId, queryParams as any) 
    }
  });

  const entries: JournalEntry[] = data?.items || [];
  const totalItems = data?.total || 0;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // KPI totals
  const totalDebits = entries.reduce((acc, e) => acc + (parseFloat(e.totalDebit) || 0), 0);
  const totalCredits = entries.reduce((acc, e) => acc + (parseFloat(e.totalCredit) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {isRtl ? 'القيود اليومية (Journal Entries)' : 'Journal Entries'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl 
              ? 'سجل سندات القيود المحاسبية اليدوية مع توازن الجانب المدين والجانب الدائن' 
              : 'Record double-entry manual journal vouchers (JV-00001) with balanced debits and credits'}
          </p>
        </div>

        <Button 
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {isRtl ? 'إعداد قيد محاسبي جديد' : 'New Journal Entry'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            {isRtl ? 'إجمالي عدد القيود' : 'Total Journal Entries'}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalItems}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block mb-1">
            {isRtl ? 'إجمالي الجانب المدين (ر.س)' : 'Total Debits (SAR)'}
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
            {isRtl ? 'إجمالي الجانب الدائن (ر.س)' : 'Total Credits (SAR)'}
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'البحث بالرقم أو المرجع أو البيان...' : 'Search by entry #, reference, description...'}
            className="w-full pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">{isRtl ? 'جميع المستندات' : 'All Source Documents'}</option>
              <option value="MANUAL_JOURNAL">{isRtl ? 'قيد يدوي' : 'Manual Journal'}</option>
              <option value="INVOICE">{isRtl ? 'فاتورة مبيعات' : 'Sales Invoice'}</option>
              <option value="PURCHASE_BILL">{isRtl ? 'فاتورة مشتريات' : 'Purchase Bill'}</option>
              <option value="EXPENSE">{isRtl ? 'مصروفات' : 'Expense'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Journal Entries Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{isRtl ? 'جاري مزامنة دفتر الأستاذ العام والقيود اليدوية...' : 'Syncing General Ledger & Manual Journal Vouchers...'}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {isRtl ? 'لا توجد قيود محاسبية' : 'No journal entries found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              {isRtl ? 'أنشئ أول قيد محاسبي يدوي للتسويات والتعديلات المباشرة.' : 'Create your first manual journal entry for direct accounting adjustments.'}
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isRtl ? 'إعداد قيد جديد' : 'Create Journal Entry'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-slate-600 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'رقم القيد' : 'Entry #'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'البيان الرئيسي' : 'Description'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'الرقم المرجعي' : 'Ref #'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'إجمالي المدين' : 'Debit'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'إجمالي الدائن' : 'Credit'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'معاينة' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {entries.map((entry) => (
                  <tr 
                    key={entry.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => {
                      if (onSelectEntry) onSelectEntry(entry.id);
                      else setLocation(`/accounting/journal-entries/${entry.id}`);
                    }}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {entry.entryNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{entry.description}</div>
                      {entry.descriptionAr && <div className="text-xs text-slate-400">{entry.descriptionAr}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(entry.entryDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {entry.referenceNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {parseFloat(entry.totalDebit).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {parseFloat(entry.totalCredit).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectEntry) onSelectEntry(entry.id);
                          else setLocation(`/accounting/journal-entries/${entry.id}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <Eye className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {isRtl ? 'عرض' : 'View'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl 
                ? `عرض الصفحة ${currentPage} من ${totalPages}` 
                : `Showing page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </Button>
              <Button
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Journal Entry Create Modal */}
      <JournalEntryCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          refetch();
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
