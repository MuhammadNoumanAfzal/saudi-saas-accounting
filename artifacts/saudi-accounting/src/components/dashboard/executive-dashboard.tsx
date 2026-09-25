import { Link } from 'wouter';
import { useGetCurrentSession, useGetDashboardAnalytics } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/utils';
import {
  Plus, Receipt, ShoppingBag, Landmark, Sparkles, RefreshCw
} from 'lucide-react';
import { SkeletonKpiGrid, SkeletonTable } from '@/components/ui/platform-loader';
import { KpiCards } from './kpi-cards';
import { TrendChart } from './trend-chart';
import { CashFlowHighlights } from './cash-flow-highlights';
import { AgingBreakdown } from './aging-breakdown';

export function ExecutiveDashboard() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  // Optimized React Query configuration (10 mins staleTime for 0ms navigation latency)
  const { data: analytics, isLoading, refetch } = useGetDashboardAnalytics(orgId, {
    query: {
      enabled: !!orgId,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  });

  return (
    <div className="space-y-6 fade-up">
      {/* Executive Welcome & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-sm hover:shadow-md transition-shadow">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
              <span>{t('Saudi Enterprise Intelligence', 'الذكاء المالي السعودي')}</span>
            </span>
            <span className="text-xs text-muted-foreground font-mono">SOCPA & ZATCA Compliant</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('Executive Finance Overview', 'لوحة التحليلات والمركز المالي')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('Real-time consolidated analytics, cash flow trends, and ZATCA tax liabilities.', 'تحليلات مباشرة مجمعة، اتجاهات التدفق النقدي والالتزامات الضريبية.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 max-w-full">
          {/* Refresh Data */}
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Analytics Data', 'تحديث البيانات')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          {/* New Invoice (Primary Highlight CTA) */}
          <Link href="/finance/invoices" className="shrink-0">
            <Button
              type="button"
              className="h-9 px-3.5 rounded-xl btn-primary shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Invoice', 'فاتورة جديدة')}</span>
            </Button>
          </Link>

          {/* Record Bill */}
          <Link href="/finance/bills" className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span>{t('Record Bill', 'فاتورة مشتريات')}</span>
            </Button>
          </Link>

          {/* Log Expense */}
          <Link href="/finance/expenses" className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('Log Expense', 'تسجيل مصروف')}</span>
            </Button>
          </Link>

          {/* Journal Entry */}
          <Link href="/accounting/journal-entries" className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5 text-primary" />
              <span>{t('Journal Entry', 'قيد محاسبي')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('Syncing Real-Time Financial Intelligence, Revenue Trends & ZATCA Tax Returns...', 'جاري مزامنة الذكاء المالي المباشر، اتجاهات الإيرادات والإقرارات الضريبية...')}</span>
          </div>
          <SkeletonKpiGrid />
          <SkeletonTable rows={4} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive KPI Header Cards */}
          <KpiCards analytics={analytics} isRtl={isRtl} />

          {/* Interactive Trend Chart & Cash Flow Position */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrendChart analytics={analytics} isRtl={isRtl} />
            </div>
            <div>
              <CashFlowHighlights analytics={analytics} isRtl={isRtl} />
            </div>
          </div>

          {/* Color-Coded AR & AP Aging Breakdown */}
          <AgingBreakdown analytics={analytics} isRtl={isRtl} />
        </div>
      )}
    </div>
  );
}
