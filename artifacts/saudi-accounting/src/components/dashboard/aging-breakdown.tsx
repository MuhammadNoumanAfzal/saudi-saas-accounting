import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Clock, ChevronRight, ArrowRight, Users, ShoppingBag } from 'lucide-react';
import type { DashboardAnalytics } from '@workspace/api-client-react';

interface AgingBreakdownProps {
  analytics?: DashboardAnalytics;
  isRtl: boolean;
}

export function AgingBreakdown({ analytics, isRtl }: AgingBreakdownProps) {
  const { t } = useTranslation();

  const receivables = Number(analytics?.totalReceivables || 0);
  const payables = Number(analytics?.totalPayables || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Receivables (AR) Aging Breakdown */}
      <Card className="border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{t('Accounts Receivable (AR) Aging Breakdown', 'أعمار ديون العملاء (الذمم المدينة)')}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t('Categorized by invoice payment due timeline', 'تصنيف الفواتير حسب فترات الاستحقاق')}
              </p>
            </div>

            <Link
              href="/finance/customers"
              className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-black flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('View Customers', 'عرض العملاء')}</span>
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {analytics?.arAging?.map((bucket, idx) => {
              const label = (isRtl ? bucket.labelAr : bucket.labelEn) || bucket.bucket || '0-30 Days';
              const count = bucket.count ?? 0;
              const amount = Number(bucket.amount || 0);
              const pct = bucket.percentage ?? (receivables > 0 ? Math.round((amount / receivables) * 100) : 0);

              const colorStyles = [
                { bg: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
                { bg: 'bg-sky-500', badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
                { bg: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
                { bg: 'bg-rose-600', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
              ][idx % 4];

              return (
                <Link key={idx} href="/finance/customers">
                  <div className="p-3 rounded-xl border border-border/60 hover:border-emerald-500/50 bg-card hover:bg-emerald-500/5 transition-all space-y-2 cursor-pointer group shadow-xs hover:shadow-sm">
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${colorStyles.badge}`}>
                          {label}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">{count} {t('invoices', 'فواتير')}</span>
                      </div>

                      <div className="font-mono font-black text-foreground text-xs sm:text-sm group-hover:text-emerald-600 transition-colors shrink-0 whitespace-nowrap ml-auto sm:ml-0">
                        {formatCurrency(amount, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>

                    {/* Progress Meter Bar */}
                    <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`${colorStyles.bg} h-full rounded-full transition-all duration-700 shadow-xs`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vendor Payables (AP) Aging Breakdown */}
      <Card className="border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-4 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">{t('Accounts Payable (AP) Aging Breakdown', 'أعمار التزامات الموردين (الذمم الدائنة)')}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t('Categorized by purchase bill payment due timeline', 'تصنيف فواتير المشتريات حسب الاستحقاق')}
              </p>
            </div>

            <Link
              href="/finance/suppliers"
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('View Suppliers', 'عرض الموردين')}</span>
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {analytics?.apAging?.map((bucket, idx) => {
              const label = (isRtl ? bucket.labelAr : bucket.labelEn) || bucket.bucket || '0-30 Days';
              const count = bucket.count ?? 0;
              const amount = Number(bucket.amount || 0);
              const pct = bucket.percentage ?? (payables > 0 ? Math.round((amount / payables) * 100) : 0);

              const colorStyles = [
                { bg: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
                { bg: 'bg-sky-500', badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
                { bg: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
                { bg: 'bg-rose-600', badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
              ][idx % 4];

              return (
                <Link key={idx} href="/finance/suppliers">
                  <div className="p-3 rounded-xl border border-border/60 hover:border-amber-500/50 bg-card hover:bg-amber-500/5 transition-all space-y-2 cursor-pointer group shadow-xs hover:shadow-sm">
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${colorStyles.badge}`}>
                          {label}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">{count} {t('bills', 'فواتير')}</span>
                      </div>

                      <div className="font-mono font-extrabold text-foreground text-xs sm:text-sm group-hover:text-amber-600 transition-colors shrink-0 whitespace-nowrap ml-auto sm:ml-0">
                        {formatCurrency(amount, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>

                    {/* Progress Meter Bar */}
                    <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`${colorStyles.bg} h-full rounded-full transition-all duration-700 shadow-xs`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
