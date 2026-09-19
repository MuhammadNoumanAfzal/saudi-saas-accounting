import { useState } from 'react';
import { Link } from 'wouter';
import { useGetCurrentSession, useGetDashboardAnalytics } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, ShoppingBag, Landmark,
  Plus, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, FileText, ChevronRight, ArrowRight
} from 'lucide-react';

export function ExecutiveDashboard() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: analytics, isLoading } = useGetDashboardAnalytics(orgId, {
    query: { enabled: !!orgId }
  });

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('Executive Finance Overview', 'لوحة التحليلات والمركز المالي')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Real-time consolidated analytics, cash flow trends, and ZATCA tax liabilities.', 'تحليلات مباشرة مجمعة، اتجاهات التدفق النقدي والالتزامات الضريبية.')}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/finance/invoices">
            <Button className="gap-2 text-xs font-semibold">
              <Plus className="w-4 h-4" />
              <span>{t('New Invoice', 'فاتورة جديدة')}</span>
            </Button>
          </Link>
          <Link href="/finance/bills">
            <Button variant="secondary" className="gap-2 text-xs font-semibold">
              <ShoppingBag className="w-4 h-4" />
              <span>{t('Record Bill', 'فاتورة مشتريات')}</span>
            </Button>
          </Link>
          <Link href="/finance/expenses">
            <Button variant="secondary" className="gap-2 text-xs font-semibold">
              <Receipt className="w-4 h-4" />
              <span>{t('Log Expense', 'تسجيل مصروف')}</span>
            </Button>
          </Link>
          <Link href="/accounting/journal-entries">
            <Button variant="ghost" className="gap-2 text-xs font-semibold">
              <Landmark className="w-4 h-4" />
              <span>{t('Journal Entry', 'قيد محاسبي')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">{t('Loading executive analytics...', 'جاري تحميل التحليلات المباشرة...')}</Card>
      ) : (
        <div className="space-y-6">
          {/* Executive KPI Header Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Revenue YTD', 'إجمالي الإيرادات (السنة)')}</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-300 font-mono">
                {formatCurrency(Number(analytics?.totalRevenueYtd || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>{t('Posted invoices & sales', 'الفواتير والمبيعات المرحّلة')}</span>
              </div>
            </Card>

            <Card className="p-4 bg-amber-500/5 border-amber-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('Expenses YTD', 'إجمالي المصروفات (السنة)')}</span>
                <TrendingDown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold mt-2 text-amber-700 dark:text-amber-300 font-mono">
                {formatCurrency(Number(analytics?.totalExpensesYtd || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span>{t('Bills, COGS & direct expenses', 'المشتريات والمصروفات المباشرة')}</span>
              </div>
            </Card>

            <Card className="p-4 bg-blue-500/5 border-blue-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Net Profit YTD', 'صافي الأرباح (السنة)')}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                  {analytics?.netMarginPercentage}% {t('Margin', 'هامش')}
                </span>
              </div>
              <div className={`text-2xl font-extrabold mt-2 font-mono ${Number(analytics?.netProfitYtd || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600'}`}>
                {formatCurrency(Number(analytics?.netProfitYtd || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                <span>{t('Net income after expenditure', 'صافي الدخل بعد استقطاع التكاليف')}</span>
              </div>
            </Card>

            <Card className="p-4 bg-purple-500/5 border-purple-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Net VAT Liability', 'الالتزام الضريبي (ZATCA)')}</span>
                <ShieldCheck className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold mt-2 text-purple-700 dark:text-purple-300 font-mono">
                {formatCurrency(Number(analytics?.netVatLiability || 0), analytics?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                <span>{t('Output VAT - Input VAT', 'ضريبة المخرجات - المدخلات')}</span>
                <Link href="/reports/zatca-vat-return" className="text-primary hover:underline text-[10px] font-semibold">
                  {t('View Return', 'عرض الإقرار')}
                </Link>
              </div>
            </Card>
          </div>

          {/* Monthly Trend Visualizer & Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Past 6 Months Revenue vs Expense Chart Visualizer */}
            <Card className="lg:col-span-2 border">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
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
                            <span className="text-emerald-600">{t('Rev:', 'إيراد:')} {formatCurrency(Number(pt.revenue), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                            <span className="text-amber-600">{t('Exp:', 'مصروف:')} {formatCurrency(Number(pt.expenses), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {/* Revenue Bar */}
                          <div className="w-full bg-muted/40 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${revPct}%` }} />
                          </div>
                          {/* Expense Bar */}
                          <div className="w-full bg-muted/40 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${expPct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Financial Position Overview */}
            <Card className="border flex flex-col justify-between">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-primary" />
                  <span>{t('Cash Flow & Balance Highlights', 'الموقف المالي النقدي')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-center">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{t('Total Customer Receivables (AR)', 'إجمالي مستحقات العملاء (الديون)')}</div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                    {formatCurrency(Number(analytics?.totalReceivables || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{t('Uncollected customer invoices', 'الفواتير غير المحصلة')}</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs font-medium text-amber-800 dark:text-amber-300">{t('Total Supplier Payables (AP)', 'إجمالي مستحقات الموردين (الالتزامات)')}</div>
                  <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
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
            <Card className="border">
              <CardHeader className="pb-3 border-b bg-emerald-500/10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                    {t('Accounts Receivable (AR) Aging Breakdown', 'أعمار ديون العملاء (الذمم المدينة)')}
                  </CardTitle>
                  <Link href="/finance/customers" className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-semibold">
                    <span>{t('View Customers', 'عرض العملاء')}</span>
                    {isRtl ? <ArrowRight className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="divide-y">
                  {analytics?.arAging?.map((bucket, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-sm">
                      <div className="space-y-1 flex-1 pr-4 rtl:pr-0 rtl:pl-4">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{isRtl ? bucket.labelAr : bucket.labelEn}</span>
                          <span className="text-muted-foreground font-mono">{bucket.count} {t('invoices', 'فواتير')}</span>
                        </div>
                        <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(5, bucket.percentage)}%` }} />
                        </div>
                      </div>
                      <div className="font-mono font-bold text-end shrink-0 w-28">
                        {formatCurrency(Number(bucket.amount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vendor Payables Aging */}
            <Card className="border">
              <CardHeader className="pb-3 border-b bg-amber-500/10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-amber-950 dark:text-amber-200">
                    {t('Accounts Payable (AP) Aging Breakdown', 'أعمار التزامات الموردين (الذمم الدائنة)')}
                  </CardTitle>
                  <Link href="/finance/suppliers" className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-semibold">
                    <span>{t('View Suppliers', 'عرض الموردين')}</span>
                    {isRtl ? <ArrowRight className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="divide-y">
                  {analytics?.apAging?.map((bucket, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-sm">
                      <div className="space-y-1 flex-1 pr-4 rtl:pr-0 rtl:pl-4">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{isRtl ? bucket.labelAr : bucket.labelEn}</span>
                          <span className="text-muted-foreground font-mono">{bucket.count} {t('bills', 'فواتير')}</span>
                        </div>
                        <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.max(5, bucket.percentage)}%` }} />
                        </div>
                      </div>
                      <div className="font-mono font-bold text-end shrink-0 w-28">
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
