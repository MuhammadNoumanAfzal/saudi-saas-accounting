import { useTranslation, formatCurrency } from '@/lib/utils';
import { Landmark, ShieldAlert, PieChart, ShieldCheck, AlertTriangle } from 'lucide-react';

interface BalanceSheetKpiCardsProps {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
  currency?: string;
  isLoading?: boolean;
}

export function BalanceSheetKpiCards({
  totalAssets,
  totalLiabilities,
  totalEquity,
  isBalanced,
  currency = 'SAR',
  isLoading,
}: BalanceSheetKpiCardsProps) {
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
      {/* Card 1: Total Assets */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Total Assets', 'إجمالي الأصول')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          {formatCurrency(totalAssets, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Cash, bank & enterprise assets', 'الأصول المتداولة والعملاء')}</div>
      </div>

      {/* Card 2: Total Liabilities */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('Total Liabilities', 'إجمالي الالتزامات')}</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-2 truncate">
          {formatCurrency(totalLiabilities, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">{t('Payables, VAT & obligations', 'الموردون والضريبة والالتزامات')}</div>
      </div>

      {/* Card 3: Owner\'s Equity */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Owner\'s Equity', 'حقوق الملكية')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          {formatCurrency(totalEquity, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Capital & retained earnings', 'رأس المال والأرباح المبقاة')}</div>
      </div>

      {/* Card 4: Statement Status */}
      <div className={`p-4 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group ${
        isBalanced ? 'hover:border-emerald-500/40' : 'hover:border-rose-500/40'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {t('Balance Status', 'التوازن المحاسبي')}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isBalanced ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            {isBalanced ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
        </div>
        <div className={`text-xl font-black font-mono mt-2 ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isBalanced ? t('100% Balanced', 'متوازنة 100%') : t('Unbalanced', 'غير متوازنة')}
        </div>
        <div className={`text-[11px] font-semibold mt-1 ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isBalanced ? t('Assets = Liabilities + Equity', 'الأصول = الالتزامات + الملكية') : t('Variance detected in ledger', 'يوجد فارق في القوائم')}
        </div>
      </div>
    </div>
  );
}
