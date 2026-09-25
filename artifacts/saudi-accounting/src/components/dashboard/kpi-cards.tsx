import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, ShieldCheck, ArrowUpRight, ChevronRight } from 'lucide-react';
import type { DashboardAnalytics } from '@workspace/api-client-react';

interface KpiCardsProps {
  analytics?: DashboardAnalytics;
  isRtl: boolean;
}

export function KpiCards({ analytics, isRtl }: KpiCardsProps) {
  const { t } = useTranslation();

  const revenueYtd = Number(analytics?.totalRevenueYtd || 0);
  const expensesYtd = Number(analytics?.totalExpensesYtd || 0);
  const netProfitYtd = Number(analytics?.netProfitYtd || 0);
  const netVatLiability = Number(analytics?.netVatLiability || 0);
  const marginPct = analytics?.netMarginPercentage ?? (revenueYtd > 0 ? Math.round((netProfitYtd / revenueYtd) * 100) : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Revenue YTD */}
      <Card className="p-5 bg-card border-border shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 relative overflow-hidden rounded-2xl group cursor-pointer">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {t('Revenue YTD', 'إجمالي الإيرادات (السنة)')}
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black mt-3 text-foreground font-mono tracking-tight relative z-10">
          {formatCurrency(revenueYtd, analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center justify-between relative z-10">
          <span className="flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {t('Posted Sales & Invoices', 'المبيعات الفعالة')}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">SOCPA Validated</span>
        </div>
      </Card>

      {/* Card 2: Expenses YTD */}
      <Card className="p-5 bg-card border-border shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 relative overflow-hidden rounded-2xl group cursor-pointer">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {t('Expenses YTD', 'إجمالي المصروفات (السنة)')}
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black mt-3 text-foreground font-mono tracking-tight relative z-10">
          {formatCurrency(expensesYtd, analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between relative z-10">
          <span>{t('Bills & Direct Operational Costs', 'التكاليف والمشتريات')}</span>
          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
            {expensesYtd > 0 ? Math.round((expensesYtd / (revenueYtd || 1)) * 100) : 0}% of Rev
          </span>
        </div>
      </Card>

      {/* Card 3: Net Profit YTD */}
      <Card className="p-5 bg-card border-border shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 relative overflow-hidden rounded-2xl group cursor-pointer">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {t('Net Profit YTD', 'صافي الأرباح (السنة)')}
          </span>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20 shadow-xs">
            {marginPct}% {t('Margin', 'هامش')}
          </span>
        </div>
        <div className={`text-2xl font-black mt-3 font-mono tracking-tight relative z-10 ${netProfitYtd >= 0 ? 'text-primary' : 'text-destructive'}`}>
          {formatCurrency(netProfitYtd, analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between relative z-10">
          <span>{t('Net Income After Deductions', 'صافي الأرباح المحققة')}</span>
          <span className="text-[10px] text-primary font-bold">{netProfitYtd >= 0 ? '✓ Profitable' : '⚠ Deficit'}</span>
        </div>
      </Card>

      {/* Card 4: ZATCA Net VAT Liability */}
      <Card className="p-5 bg-card border border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden rounded-2xl group cursor-pointer bg-gradient-to-br from-card via-card to-primary/5">
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-xs">🇸🇦</span>
            <span>{t('Net VAT Liability', 'الالتزام الضريبي (ZATCA)')}</span>
          </span>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-black mt-3 text-foreground font-mono tracking-tight relative z-10">
          {formatCurrency(netVatLiability, analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between relative z-10">
          <span>{t('Output VAT - Input VAT', 'ضريبة المخرجات - المدخلات')}</span>
          <Link href="/reports/zatca-vat-return" className="text-primary hover:underline text-[11px] font-bold flex items-center gap-0.5 cursor-pointer">
            <span>{t('View Return', 'عرض الإقرار')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
