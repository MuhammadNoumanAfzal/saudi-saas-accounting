import { useTranslation, formatCurrency } from '@/lib/utils';
import { BookOpen, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface AccountLedgerKpiCardsProps {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  currency?: string;
  isLoading?: boolean;
}

export function AccountLedgerKpiCards({
  openingBalance,
  totalDebit,
  totalCredit,
  closingBalance,
  currency = 'SAR',
  isLoading,
}: AccountLedgerKpiCardsProps) {
  const { t, isRtl } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
      {/* Card 1: Opening Balance */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Opening Balance', 'الرصيد الافتتاحي')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground font-mono mt-2 truncate">
          {formatCurrency(openingBalance, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Initial period ledger balance', 'رصيد بداية الفترة')}</div>
      </div>

      {/* Card 2: Total Debit */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Total Debit (+)', 'إجمالي حركة المدين (+)')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          {formatCurrency(totalDebit, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Cumulative debit postings', 'مجموع الإضافات والمدين')}</div>
      </div>

      {/* Card 3: Total Credit */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Total Credit (-)', 'إجمالي حركة الدائن (-)')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          {formatCurrency(totalCredit, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Cumulative credit postings', 'مجموع السحوبات والدائن')}</div>
      </div>

      {/* Card 4: Closing Balance */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Closing Balance', 'الرصيد الختامي')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-2 truncate">
          {formatCurrency(closingBalance, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Current net running balance', 'الرصيد الجاري المتراكم')}</div>
      </div>
    </div>
  );
}
