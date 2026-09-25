import { useTranslation, Button } from '@/lib/utils';
import type { JournalEntry } from '@workspace/api-client-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { RowActions } from '@/components/ui/row-actions';
import { FileSpreadsheet, Plus, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface JournalEntryTableProps {
  entries: JournalEntry[];
  isLoading: boolean;
  search: string;
  sourceFilter: string;
  page: number;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  onSelectEntry: (id: string) => void;
  onCreateClick: () => void;
}

export function JournalEntryTable({
  entries,
  isLoading,
  search,
  sourceFilter,
  page,
  totalPages,
  totalItems,
  currentPage,
  onPageChange,
  onSelectEntry,
  onCreateClick,
}: JournalEntryTableProps) {
  const { t, isRtl } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{t('Syncing General Ledger & Manual Journal Vouchers...', 'جاري تحميل سجلات القيود اليومية والمستندات المحاسبية...')}</span>
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
          <FileSpreadsheet size={28} />
        </div>
        <h3 className="text-lg font-black mb-1">{t('No journal entries found', 'لا توجد قيود محاسبية')}</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {search || sourceFilter 
            ? t('Try adjusting your search query or source document filter.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
            : t('Create double-entry manual journal vouchers for direct general ledger adjustments and settlements.', 'سجل قيود يومية يدويًا لتسوية الحسابات والتعديلات المحاسبية المباشرة.')}
        </p>
        {!search && !sourceFilter && (
          <Button className="btn-primary rounded-xl text-xs font-bold gap-2 cursor-pointer" onClick={onCreateClick}>
            <Plus size={16} /> {t('New Journal Entry', 'إعداد قيد محاسبي جديد')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left rtl:text-right">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Entry #', 'رقم القيد')}</th>
              <th className="px-5 py-3.5">{t('Description', 'البيان الرئيسي')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Date', 'التاريخ')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Ref #', 'الرقم المرجعي')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Debit', 'إجمالي المدين')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Credit', 'إجمالي الدائن')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Status', 'الحالة')}</th>
              <th className="px-5 py-3.5 w-20 text-center whitespace-nowrap">{t('Action', 'إجراء')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {entries.map((entry) => (
              <tr 
                key={entry.id} 
                className="hover:bg-primary/5 transition-colors group cursor-pointer"
                onClick={() => onSelectEntry(entry.id)}
              >
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-primary text-xs font-mono font-extrabold border border-border group-hover:border-primary/40 whitespace-nowrap">
                    {entry.entryNumber}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-extrabold text-foreground text-sm group-hover:text-primary transition-colors">{entry.description}</div>
                  {entry.descriptionAr && (
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">{entry.descriptionAr}</div>
                  )}
                </td>
                <td className="px-5 py-4 text-muted-foreground font-semibold text-xs whitespace-nowrap">
                  {new Date(entry.entryDate).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {entry.referenceNumber || '—'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                  SAR {parseFloat(entry.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs whitespace-nowrap">
                  SAR {parseFloat(entry.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <span>{entry.status || 'POSTED'}</span>
                  </span>
                </td>
                <td className="px-5 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <RowActions
                    onView={() => onSelectEntry(entry.id)}
                    viewLabel={t('View Voucher', 'معاينة السند')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="md:hidden divide-y divide-border">
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20 cursor-pointer"
            onClick={() => onSelectEntry(entry.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-foreground text-sm truncate">{entry.description}</div>
                <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center flex-wrap">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary whitespace-nowrap">
                    {entry.entryNumber}
                  </span>
                  {entry.referenceNumber && (
                    <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border">
                      {entry.referenceNumber}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    <span>{entry.status || 'POSTED'}</span>
                  </span>
                </div>
              </div>
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <RowActions
                  onView={() => onSelectEntry(entry.id)}
                  viewLabel={t('View', 'عرض')}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2.5 border-t border-border/60">
              <div className="font-semibold text-muted-foreground">
                {t('Date:', 'التاريخ:')} <span className="text-foreground">{new Date(entry.entryDate).toLocaleDateString()}</span>
              </div>
              <div className="font-mono font-black text-foreground text-xs text-right">
                SAR {parseFloat(entry.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {t('Page', 'صفحة')} {currentPage} {t('of', 'من')} {totalPages} ({totalItems} {t('items', 'عنصر')})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              {t('Previous', 'السابق')}
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              {t('Next', 'التالي')}
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
