import { useTranslation } from '@/lib/utils';
import { TrendingUp, TrendingDown, ShieldCheck, AlertCircle, Layers } from 'lucide-react';

interface TrialBalanceKpiCardsProps {
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
  activeCount: number;
  isLoading?: boolean;
}

export function TrialBalanceKpiCards({
  totalDebit,
  totalCredit,
  isBalanced,
  activeCount,
  isLoading,
}: TrialBalanceKpiCardsProps) {
  const { t } = useTranslation();

  const debitNum = parseFloat(totalDebit) || 0;
  const creditNum = parseFloat(totalCredit) || 0;
  const variance = Math.abs(debitNum - creditNum);

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
      {/* Card 1: Total Debits */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Total Debits', 'إجمالي الحركة المدينة')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          SAR {debitNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Total debit general ledger balance', 'مجموع أرصدة المدين')}</div>
      </div>

      {/* Card 2: Total Credits */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Total Credits', 'إجمالي الحركة الدائنة')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          SAR {creditNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Total credit general ledger balance', 'مجموع أرصدة الدائن')}</div>
      </div>

      {/* Card 3: Balance Status */}
      <div className={`p-4 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group ${
        isBalanced ? 'hover:border-emerald-500/40' : 'hover:border-amber-500/40'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {t('Balance Status', 'حالة التوازن المحاسبي')}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isBalanced ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            {isBalanced ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
        </div>
        <div className={`text-xl font-black font-mono mt-2 ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {isBalanced ? t('100% Balanced', 'متوازن 100%') : t('Discrepancy', 'غير متوازن')}
        </div>
        <div className={`text-[11px] font-semibold mt-1 ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {isBalanced 
            ? t('Difference = 0.00 SAR (Perfect Match)', 'الفارق = 0.00 ريال (مطابق)')
            : `${t('Variance', 'الفارق')} = SAR ${variance.toFixed(2)}`}
        </div>
      </div>

      {/* Card 4: Active Accounts */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Active Accounts', 'الحسابات المفعلة')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-foreground font-mono mt-2">{activeCount}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('SOCPA standard chart of accounts', 'دليل الحسابات المعتمد SOCPA')}</div>
      </div>
    </div>
  );
}
