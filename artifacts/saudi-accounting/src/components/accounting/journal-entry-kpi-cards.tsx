import { useTranslation } from '@/lib/utils';
import { FileSpreadsheet, ArrowUpRight, ArrowDownLeft, Scale } from 'lucide-react';

interface JournalEntryKpiCardsProps {
  totalCount: number;
  totalDebits: number;
  totalCredits: number;
  isLoading?: boolean;
}

export function JournalEntryKpiCards({
  totalCount,
  totalDebits,
  totalCredits,
  isLoading,
}: JournalEntryKpiCardsProps) {
  const { t } = useTranslation();

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Vouchers */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Vouchers', 'إجمالي السندات')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-foreground font-mono mt-2">{totalCount}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Posted double-entry vouchers', 'قيود محاسبية مرحلة')}</div>
      </div>

      {/* Card 2: Total Debits */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Total Debits', 'إجمالي الجانب المدين')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          SAR {totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('General ledger debit postings', 'مجموع القيد المدين')}</div>
      </div>

      {/* Card 3: Total Credits */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Total Credits', 'إجمالي الجانب الدائن')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          SAR {totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('General ledger credit postings', 'مجموع القيد الدائن')}</div>
      </div>

      {/* Card 4: Ledger Balance Status */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Ledger Balance Status', 'حالة التوازن المحاسبي')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-2">
          {isBalanced ? t('100% Balanced', 'متوازن 100%') : t('Unbalanced', 'غير متوازن')}
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">
          {isBalanced ? t('Debits equal credits', 'المدين يساهم الدائن تماماً') : t('Variance detected', 'يوجد فرق في القيود')}
        </div>
      </div>
    </div>
  );
}
