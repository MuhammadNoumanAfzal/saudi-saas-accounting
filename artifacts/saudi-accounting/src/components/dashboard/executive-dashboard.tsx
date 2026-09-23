import { useState } from 'react';
import { Link } from 'wouter';
import { useGetCurrentSession, useGetDashboardAnalytics } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingBag, Landmark,
  Plus, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, FileText, ChevronRight, ArrowRight,
  Wallet, Scale
} from 'lucide-react';
import { SkeletonKpiGrid, SkeletonTable } from '@/components/ui/platform-loader';

export function ExecutiveDashboard() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: analytics, isLoading } = useGetDashboardAnalytics(orgId, {
    query: {
      enabled: !!orgId,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    }
  });

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('Executive Finance Overview', 'لوحة التحليلات والمركز المالي')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Real-time consolidated analytics, cash flow trends, and ZATCA tax liabilities.', 'تحليلات مباشرة مجمعة، اتجاهات التدفق النقدي والالتزامات الضريبية.')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/finance/invoices">
            <Button className="gap-2 text-xs font-semibold btn-primary shadow-sm">
              <Plus className="w-4 h-4" />
              <span>{t('New Invoice', 'فاتورة جديدة')}</span>
            </Button>
          </Link>
          <Link href="/finance/bills">
            <Button variant="outline" className="gap-2 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>{t('Record Bill', 'فاتورة مشتريات')}</span>
            </Button>
          </Link>
          <Link href="/finance/expenses">
            <Button variant="outline" className="gap-2 text-xs font-semibold border-border bg-card hover:bg-muted text-foreground">
              <Receipt className="w-4 h-4 text-primary" />
              <span>{t('Log Expense', 'تسجيل مصروف')}</span>
            </Button>
          </Link>
          <Link href="/accounting/journal-entries">
            <Button variant="ghost" className="gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <Landmark className="w-4 h-4 text-primary" />
              <span>{t('Journal Entry', 'قيد محاسبي')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('Syncing Real-Time Financial Intelligence, Revenue Trends & ZATCA Tax Returns...', 'جاري مزامنة الذكاء المالي المباشر، اتجاهات الإيرادات والإقرارات الضريبية...')}</span>
          </div>
          <SkeletonKpiGrid />
          <SkeletonTable rows={4} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive KPI Header Cards (Unified Saudi Emerald Theme) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Revenue YTD */}
            <Card className="p-5 bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Revenue YTD', 'إجمالي الإيرادات (السنة)')}</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold mt-3 text-foreground font-mono">
                {formatCurrency(Number(analytics?.totalRevenueYtd || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>{t('Posted invoices & sales', 'الفواتير والمبيعات المرحّلة')}</span>
              </div>
            </Card>

            {/* Card 2: Expenses YTD */}
            <Card className="p-5 bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Expenses YTD', 'إجمالي المصروفات (السنة)')}</span>
                <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold mt-3 text-foreground font-mono">
                {formatCurrency(Number(analytics?.totalExpensesYtd || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>{t('Bills, COGS & direct expenses', 'المشتريات والمصروفات المباشرة')}</span>
              </div>
            </Card>

            {/* Card 3: Net Profit YTD */}
            <Card className="p-5 bg-card border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Net Profit YTD', 'صافي الأرباح (السنة)')}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {analytics?.netMarginPercentage}% {t('Margin', 'هامش')}
                </span>
              </div>
              <div className={`text-2xl font-extrabold mt-3 font-mono ${Number(analytics?.netProfitYtd || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(Number(analytics?.netProfitYtd || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                <span>{t('Net income after expenditure', 'صافي الدخل بعد استقطاع التكاليف')}</span>
              </div>
            </Card>

            {/* Card 4: ZATCA Net VAT Liability */}
            <Card className="p-5 bg-card border border-primary/30 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  <span>🇸🇦</span> {t('Net VAT Liability', 'الالتزام الضريبي (ZATCA)')}
                </span>
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold mt-3 text-foreground font-mono">
                {formatCurrency(Number(analytics?.netVatLiability || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>{t('Output VAT - Input VAT', 'ضريبة المخرجات - المدخلات')}</span>
                <Link href="/reports/zatca-vat-return" className="text-primary hover:underline text-[11px] font-bold">
                  {t('View Return', 'عرض الإقرار')}
                </Link>
              </div>
            </Card>
          </div>

          {/* Monthly Trend Visualizer & Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Past 6 Months Revenue vs Expense Chart Visualizer */}
            <Card className="lg:col-span-2 border-border bg-card rounded-2xl">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>{t('Revenue vs Expense 6-Month Trend', 'مقارنة الإيرادات والمصروفات (٦ أشهر)')}</span>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground font-mono">SAR</span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {analytics?.monthlyTrends?.map((pt, idx) => {
                    const maxVal = Math.max(Number(pt.revenue), Number(pt.expenses), 1);
                    const revPct = Math.min(100, Math.max(5, (Number(pt.revenue) / maxVal) * 100));
                    const expPct = Math.min(100, Math.max(5, (Number(pt.expenses) / maxVal) * 100));

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{isRtl ? pt.monthNameAr : pt.monthNameEn} {pt.monthKey.split('-')[0]}</span>
                          <div className="flex gap-4 font-mono text-[11px]">
                            <span className="text-primary font-bold">{t('Rev:', 'إيراد:')} {formatCurrency(Number(pt.revenue), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                            <span className="text-muted-foreground">{t('Exp:', 'مصروف:')} {formatCurrency(Number(pt.expenses), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {/* Revenue Bar */}
                          <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${revPct}%` }} />
                          </div>
                          {/* Expense Bar */}
                          <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                            <div className="bg-muted-foreground/40 h-full rounded-full transition-all duration-500" style={{ width: `${expPct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Financial Position Overview */}
            <Card className="border-border bg-card rounded-2xl flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Landmark className="w-5 h-5 text-primary" />
                  <span>{t('Cash Flow & Balance Highlights', 'الموقف المالي النقدي')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-center">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="text-xs font-bold text-primary">{t('Total Customer Receivables (AR)', 'إجمالي مستحقات العملاء (الديون)')}</div>
                  <div className="text-2xl font-extrabold font-mono text-foreground mt-1">
                    {formatCurrency(Number(analytics?.totalReceivables || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{t('Uncollected customer invoices', 'الفواتير غير المحصلة')}</div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="text-xs font-bold text-muted-foreground">{t('Total Supplier Payables (AP)', 'إجمالي مستحقات الموردين (الالتزامات)')}</div>
                  <div className="text-2xl font-extrabold font-mono text-foreground mt-1">
                    {formatCurrency(Number(analytics?.totalPayables || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{t('Unpaid vendor purchase bills', 'فواتير المشتريات غير المدفوعة')}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AR & AP Aging Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Receivables Aging */}
            <Card className="border-border bg-card rounded-2xl">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-foreground">
                    {t('Accounts Receivable (AR) Aging Breakdown', 'أعمار ديون العملاء (الذمم المدينة)')}
                  </CardTitle>
                  <Link href="/finance/customers" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                    <span>{t('View Customers', 'عرض العملاء')}</span>
                    {isRtl ? <ArrowRight className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="divide-y divide-border">
                  {analytics?.arAging?.map((bucket, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-sm">
                      <div className="space-y-1 flex-1 pr-4 rtl:pr-0 rtl:pl-4">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{isRtl ? bucket.labelAr : bucket.labelEn}</span>
                          <span className="text-muted-foreground font-mono">{bucket.count} {t('invoices', 'فواتير')}</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(5, bucket.percentage)}%` }} />
                        </div>
                      </div>
                      <div className="font-mono font-bold text-end shrink-0 w-28 text-foreground">
                        {formatCurrency(Number(bucket.amount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vendor Payables Aging */}
            <Card className="border-border bg-card rounded-2xl">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-foreground">
                    {t('Accounts Payable (AP) Aging Breakdown', 'أعمار التزامات الموردين (الذمم الدائنة)')}
                  </CardTitle>
                  <Link href="/finance/suppliers" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                    <span>{t('View Suppliers', 'عرض الموردين')}</span>
                    {isRtl ? <ArrowRight className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="divide-y divide-border">
                  {analytics?.apAging?.map((bucket, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-sm">
                      <div className="space-y-1 flex-1 pr-4 rtl:pr-0 rtl:pl-4">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-foreground">{isRtl ? bucket.labelAr : bucket.labelEn}</span>
                          <span className="text-muted-foreground font-mono">{bucket.count} {t('bills', 'فواتير')}</span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-muted-foreground/40 h-full rounded-full" style={{ width: `${Math.max(5, bucket.percentage)}%` }} />
                        </div>
                      </div>
                      <div className="font-mono font-bold text-end shrink-0 w-28 text-foreground">
                        {formatCurrency(Number(bucket.amount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
