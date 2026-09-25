import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Landmark, ArrowUpRight, ArrowDownRight, ChevronRight, Wallet } from 'lucide-react';
import type { DashboardAnalytics } from '@workspace/api-client-react';

interface CashFlowHighlightsProps {
  analytics?: DashboardAnalytics;
  isRtl: boolean;
}

export function CashFlowHighlights({ analytics, isRtl }: CashFlowHighlightsProps) {
  const { t } = useTranslation();

  const receivables = Number(analytics?.totalReceivables || 0);
  const payables = Number(analytics?.totalPayables || 0);
  const workingCapital = receivables - payables;

  return (
    <Card className="border-border bg-card rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4 border-b border-border bg-muted/20">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <Landmark className="w-5 h-5 text-primary" />
          <span>{t('Cash Flow & Balance Highlights', 'الموقف المالي النقدي')}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('Working capital & liquid positions', 'رأس المال العامل والسيولة')}
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        {/* Working Capital Gauge */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 space-y-1.5 shadow-xs cursor-pointer hover:border-primary/40 transition-colors">
          <div className="flex justify-between items-center text-xs font-bold text-primary uppercase tracking-wider">
            <span>{t('Working Capital Position', 'رأس المال العامل')}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold border border-primary/20">
              {workingCapital >= 0 ? '✓ Positive' : '⚠ Attention'}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-foreground">
            {formatCurrency(workingCapital, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>{t('Receivables minus payables balance', 'مستحقات العملاء minus التزامات الموردين')}</span>
            <span className="text-[10px] font-mono text-primary font-bold">100% Calculated</span>
          </div>
        </div>

        {/* Customer Receivables Card */}
        <Link href="/finance/customers">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer group">
            <div className="flex justify-between items-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:scale-125 transition-transform" />
                <span>{t('Total Customer Receivables (AR)', 'مستحقات العملاء (الديون)')}</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-bold flex items-center gap-0.5">
                <span>{t('View All', 'عرض الكل')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-foreground mt-2">
              {formatCurrency(receivables, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>{t('Uncollected customer invoices', 'الفواتير غير المحصلة')}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
            </div>
          </div>
        </Link>

        {/* Supplier Payables Card */}
        <Link href="/finance/suppliers">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all cursor-pointer group">
            <div className="flex justify-between items-center text-xs font-bold text-amber-700 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-amber-500 group-hover:scale-125 transition-transform" />
                <span>{t('Total Supplier Payables (AP)', 'مستحقات الموردين (الالتزامات)')}</span>
              </span>
              <span className="text-amber-600 dark:text-amber-400 hover:underline text-[11px] font-bold flex items-center gap-0.5">
                <span>{t('View All', 'عرض الكل')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-foreground mt-2">
              {formatCurrency(payables, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>{t('Unpaid purchase bills', 'فواتير المشتريات غير المدفوعة')}</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">Pending</span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
