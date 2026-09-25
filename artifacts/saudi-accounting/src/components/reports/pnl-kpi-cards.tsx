import { useTranslation, formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Wallet, Award } from 'lucide-react';

interface PnlKpiCardsProps {
  totalRevenue: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  currency?: string;
  isLoading?: boolean;
}

export function PnlKpiCards({
  totalRevenue,
  grossProfit,
  totalExpenses,
  netProfit,
  currency = 'SAR',
  isLoading,
}: PnlKpiCardsProps) {
  const { t, isRtl } = useTranslation();

  const isPositiveNet = netProfit >= 0;

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
      {/* Card 1: Total Revenue */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Total Revenue', 'إجمالي الإيرادات')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          {formatCurrency(totalRevenue, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Combined sales & operating income', 'إجمالي المبيعات والدخل التشغيلي')}</div>
      </div>

      {/* Card 2: Gross Profit */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Gross Profit', 'مجمل الربح')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          {formatCurrency(grossProfit, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Revenue minus Cost of Goods Sold', 'الإيرادات مطروح منها تكلفة المبيعات')}</div>
      </div>

      {/* Card 3: Operating Expenses */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('Operating Expenses', 'المصروفات التشغيلية')}</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-2 truncate">
          {formatCurrency(totalExpenses, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">{t('General & administrative expenses', 'مصروفات التشغيل والإدارة')}</div>
      </div>

      {/* Card 4: Net Profit / Loss */}
      <div className={`p-4 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group ${
        isPositiveNet ? 'hover:border-emerald-500/40' : 'hover:border-rose-500/40'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isPositiveNet ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPositiveNet ? t('Net Profit', 'صافي الربح') : t('Net Loss', 'صافي الخسارة')}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isPositiveNet ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-black font-mono mt-2 truncate ${isPositiveNet ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {formatCurrency(netProfit, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className={`text-[11px] font-semibold mt-1 ${isPositiveNet ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isPositiveNet ? t('Final net earnings for the period', 'صافي الأرباح المحققة للفترة') : t('Net loss incurred for the period', 'صافي الخسائر للفترة')}
        </div>
      </div>
    </div>
  );
}
