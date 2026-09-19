import { useState } from 'react';
import { useGetCurrentSession, useGetProfitAndLoss } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Printer, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export function ProfitLossReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const [datePreset, setDatePreset] = useState<'this_month' | 'this_quarter' | 'this_year'>('this_month');

  const getDates = () => {
    const now = new Date();
    if (datePreset === 'this_quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterMonth, 1);
      const end = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (datePreset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const { startDate, endDate } = getDates();
  const { data: pnl, isLoading } = useGetProfitAndLoss(orgId, {
    startDate,
    endDate,
  }, {
    query: { enabled: !!orgId }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('Profit & Loss Statement', 'قائمة الدخل (الأرباح والخسائر)')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Financial income and expenditure statement for selected period.', 'بيان الإيرادات والمصروفات المالية عن الفترة المحددة.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDatePreset('this_month')}
              className={`px-3 py-1.5 rounded-md transition-colors ${datePreset === 'this_month' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >
              {t('This Month', 'هذا الشهر')}
            </button>
            <button
              onClick={() => setDatePreset('this_quarter')}
              className={`px-3 py-1.5 rounded-md transition-colors ${datePreset === 'this_quarter' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >
              {t('This Quarter', 'هذا الربع')}
            </button>
            <button
              onClick={() => setDatePreset('this_year')}
              className={`px-3 py-1.5 rounded-md transition-colors ${datePreset === 'this_year' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >
              {t('Year to Date', 'حتى تاريخه')}
            </button>
          </div>
          <Button variant="outline" onClick={handlePrint} className="gap-2 text-xs">
            <Printer className="w-4 h-4" />
            <span>{t('Print', 'طباعة')}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">{t('Loading statement...', 'جاري تحميل قائمة الدخل...')}</Card>
      ) : (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t('Total Revenue', 'إجمالي الإيرادات')}
              </div>
              <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
                {formatCurrency(Number(pnl?.totalRevenue || 0), pnl?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
            </Card>

            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {t('Gross Profit', 'مجمل الربح')}
              </div>
              <div className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">
                {formatCurrency(Number(pnl?.grossProfit || 0), pnl?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
            </Card>

            <Card className="p-4 bg-amber-500/5 border-amber-500/20">
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {t('Total Operating Expenses', 'إجمالي المصروفات التشغيلية')}
              </div>
              <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">
                {formatCurrency(Number(pnl?.totalExpenses || 0), pnl?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
            </Card>

            <Card className={`p-4 ${Number(pnl?.netProfit || 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="text-xs font-medium text-foreground">
                {t('Net Operating Income', 'صافي الدخل التشغيلي')}
              </div>
              <div className={`text-2xl font-extrabold mt-1 ${Number(pnl?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(Number(pnl?.netProfit || 0), pnl?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
            </Card>
          </div>

          {/* Statement Table */}
          <Card className="overflow-hidden border">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="text-base font-semibold">
                {t('Income & Expense Breakdown', 'تفاصيل الإيرادات والمصروفات')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {/* Revenue Section */}
                <div className="p-4 bg-muted/10 font-bold text-sm text-foreground flex justify-between uppercase tracking-wider">
                  <span>{t('1. Operating Revenues', '١. الإيرادات التشغيلية')}</span>
                  <span>{formatCurrency(Number(pnl?.totalRevenue || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                </div>
                {pnl?.revenueCategories?.map((cat, cIdx) => (
                  <div key={cIdx} className="bg-background">
                    {cat.items?.map((item, iIdx) => (
                      <div key={iIdx} className="flex justify-between px-8 py-2.5 text-sm border-b last:border-0 hover:bg-muted/20">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                          <span>{isRtl ? item.nameArabic : item.nameEnglish}</span>
                        </div>
                        <span className="font-mono font-medium">{formatCurrency(Number(item.amount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Cost of Goods Sold */}
                <div className="flex justify-between px-6 py-3 font-semibold text-sm bg-muted/20 border-t border-b">
                  <span>{t('2. Cost of Sales (COGS)', '٢. تكلفة المبيعات')}</span>
                  <span className="font-mono text-amber-600">({formatCurrency(Number(pnl?.totalCostOfSales || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')})</span>
                </div>

                {/* Gross Margin Row */}
                <div className="flex justify-between px-6 py-3 font-bold text-base bg-emerald-500/10 text-emerald-900 dark:text-emerald-300">
                  <span>{t('GROSS PROFIT', 'مجمل الربح')}</span>
                  <span className="font-mono">{formatCurrency(Number(pnl?.grossProfit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                </div>

                {/* Operating Expenses Section */}
                <div className="p-4 bg-muted/10 font-bold text-sm text-foreground flex justify-between uppercase tracking-wider">
                  <span>{t('3. Operating & General Expenses', '٣. المصروفات التشغيلية والإدارية')}</span>
                  <span className="font-mono text-red-600">({formatCurrency(Number(pnl?.totalExpenses || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')})</span>
                </div>
                {pnl?.expenseCategories?.map((cat, cIdx) => (
                  <div key={cIdx} className="bg-background">
                    {cat.items?.map((item, iIdx) => (
                      <div key={iIdx} className="flex justify-between px-8 py-2.5 text-sm border-b last:border-0 hover:bg-muted/20">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                          <span>{isRtl ? item.nameArabic : item.nameEnglish}</span>
                        </div>
                        <span className="font-mono">{formatCurrency(Number(item.amount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Final Net Profit Row */}
                <div className={`flex justify-between px-6 py-4 font-extrabold text-lg ${Number(pnl?.netProfit || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200' : 'bg-red-500/20 text-red-950 dark:text-red-200'}`}>
                  <span>{t('NET PROFIT FOR THE PERIOD', 'صافي ربح الفترة')}</span>
                  <span className="font-mono">{formatCurrency(Number(pnl?.netProfit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
