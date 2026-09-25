import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useListJournalEntries,
  getListJournalEntriesQueryKey
} from '@workspace/api-client-react';
import type { JournalEntry } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useQueryClient } from '@tanstack/react-query';
import { 
  FileSpreadsheet, Plus, Search, Filter, RefreshCw, Sparkles, ShieldCheck, DownloadCloud
} from 'lucide-react';
import { JournalEntryKpiCards } from './journal-entry-kpi-cards';
import { JournalEntryTable } from './journal-entry-table';
import { JournalEntryCreateSheet } from './journal-entry-create-sheet';

interface JournalEntriesListProps {
  onSelectEntry?: (id: string) => void;
}

export function JournalEntriesList({ onSelectEntry }: JournalEntriesListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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

  // Fast React Query caching (10 mins staleTime for 0ms instant load latency)
  const { data, isLoading, refetch } = useListJournalEntries(orgId, queryParams as any, {
    query: { 
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
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

  const handleSelect = (id: string) => {
    if (onSelectEntry) {
      onSelectEntry(id);
    } else {
      setLocation(`/accounting/journal-entries/${id}`);
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Entry Number', 'Description', 'Date', 'Reference Number', 'Total Debit', 'Total Credit', 'Status'];
    const rows = entries.map(e => [
      `"${e.entryNumber}"`,
      `"${e.description}"`,
      `"${new Date(e.entryDate).toLocaleDateString()}"`,
      `"${e.referenceNumber || ''}"`,
      `"${parseFloat(e.totalDebit).toFixed(2)}"`,
      `"${parseFloat(e.totalCredit).toFixed(2)}"`,
      `"${e.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `journal_entries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('CSV Exported Successfully!', 'تم تصدير القيود بنجاح!'), 'success');
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Double-Entry General Ledger', 'دفتر القيود المزدوجة الموحد')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> SOCPA & ZATCA Verified
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Journal Entries', 'القيود اليومية')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Record double-entry manual journal vouchers (JV-00001) with balanced debits and credits.', 'سجل سندات القيود المحاسبية اليدوية مع توازن الجانب المدين والجانب الدائن.')}
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
            <span>{t('New Journal Entry', 'إعداد قيد محاسبي جديد')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Component */}
      <JournalEntryKpiCards 
        totalCount={totalItems}
        totalDebits={totalDebits}
        totalCredits={totalCredits}
        isLoading={isLoading}
      />

      {/* Main Table Card with Search & Source Filter */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search by entry #, reference, description...', 'البحث بالرقم أو المرجع أو البيان...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Filter size={15} className="text-muted-foreground shrink-0" />
            <select 
              className="field bg-background h-10 w-full sm:w-52 rounded-xl text-xs font-semibold cursor-pointer" 
              value={sourceFilter} 
              onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            >
              <option value="">{t('All Source Documents', 'جميع المستندات')}</option>
              <option value="MANUAL_JOURNAL">{t('Manual Journal (قيد يدوي)', 'Manual Journal (قيد يدوي)')}</option>
              <option value="INVOICE">{t('Sales Invoice (فاتورة مبيعات)', 'Sales Invoice (فاتورة مبيعات)')}</option>
              <option value="PURCHASE_BILL">{t('Purchase Bill (فاتورة مشتريات)', 'Purchase Bill (فاتورة مشتريات)')}</option>
              <option value="EXPENSE">{t('Expense (مصروفات)', 'Expense (مصروفات)')}</option>
            </select>
          </div>
        </div>

        {/* Journal Entry Table Component */}
        <JournalEntryTable 
          entries={entries}
          isLoading={isLoading}
          search={search}
          sourceFilter={sourceFilter}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={setPage}
          onSelectEntry={handleSelect}
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      {/* Journal Entry Create Sheet */}
      <JournalEntryCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListJournalEntriesQueryKey(orgId) });
          refetch();
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
