import { useState } from 'react';
import { useGetCurrentSession, useGetProfitAndLoss, getGetProfitAndLossQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Printer, RefreshCw, FileText, Sparkles, ShieldCheck, DownloadCloud } from 'lucide-react';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { PnlKpiCards } from './pnl-kpi-cards';

export function ProfitLossReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const currentOrg = session?.organizations?.find(o => o.organization.id === orgId)?.organization;

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

  // Fast React Query caching (10 mins staleTime for 0ms instant load latency)
  const queryParams = { startDate, endDate };
  const { data: pnl, isLoading, refetch } = useGetProfitAndLoss(orgId, queryParams, {
    query: { 
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getGetProfitAndLossQueryKey(orgId, queryParams)
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const companyNameEn = currentOrg?.legalNameEnglish || currentOrg?.tradingNameEnglish || 'Nouman Trading & Technology Co.';
  const companyNameAr = currentOrg?.legalNameArabic || currentOrg?.tradingNameArabic || 'شركة نعمان للتجارة والتقنية';
  const vatNumber = currentOrg?.vatNumber || '310998877600003';
  const crNumber = currentOrg?.commercialRegistrationNumber || '1010889922';

  const handleExportCSV = () => {
    if (!pnl) return;
    const headers = ['Category / Item Code', 'Name English', 'Name Arabic', 'Amount (SAR)'];
    const rows: string[][] = [];

    rows.push(['OPERATING REVENUE', '', '', String(pnl.totalRevenue || 0)]);
    pnl.revenueCategories?.forEach(cat => {
      cat.items?.forEach(item => {
        rows.push([item.code || '', item.nameEnglish || '', item.nameArabic || '', String(item.amount || 0)]);
      });
    });

    rows.push(['COST OF SALES', '', '', String(pnl.totalCostOfSales || 0)]);
    rows.push(['GROSS PROFIT', '', '', String(pnl.grossProfit || 0)]);

    rows.push(['OPERATING EXPENSES', '', '', String(pnl.totalExpenses || 0)]);
    pnl.expenseCategories?.forEach(cat => {
      cat.items?.forEach(item => {
        rows.push([item.code || '', item.nameEnglish || '', item.nameArabic || '', String(item.amount || 0)]);
      });
    });

    rows.push(['NET PROFIT / LOSS', '', '', String(pnl.netProfit || 0)]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `profit_loss_${datePreset}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('Profit & Loss Statement Exported!', 'تم تصدير قائمة الدخل بنجاح!'), 'success');
  };

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      
      {/* Luxury Header & Action Toolbar Bar (Hidden on Print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>SOCPA GAAP</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA Verified
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('Profit & Loss Statement', 'قائمة الدخل (الأرباح والخسائر)')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Financial income, cost of sales, and operating expenditure statement.', 'بيان الإيرادات والتكاليف والمصروفات التشغيلية عن الفترة المحددة.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <div className="flex bg-muted p-1 rounded-xl text-xs font-bold border border-border shrink-0">
            <button
              type="button"
              onClick={() => setDatePreset('this_month')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${datePreset === 'this_month' ? 'bg-background shadow-xs text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('This Month', 'هذا الشهر')}
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('this_quarter')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${datePreset === 'this_quarter' ? 'bg-background shadow-xs text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('This Quarter', 'هذا الربع')}
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('this_year')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${datePreset === 'this_year' ? 'bg-background shadow-xs text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('Year to Date', 'حتى تاريخه')}
            </button>
          </div>

          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Data', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Export', 'تصدير')}</span>
          </Button>

          <Button 
            type="button"
            onClick={handlePrint} 
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Statement PDF', 'طباعة التقرير')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Component */}
      <PnlKpiCards
        totalRevenue={Number(pnl?.totalRevenue || 0)}
        grossProfit={Number(pnl?.grossProfit || 0)}
        totalExpenses={Number(pnl?.totalExpenses || 0)}
        netProfit={Number(pnl?.netProfit || 0)}
        currency={pnl?.currency || 'SAR'}
        isLoading={isLoading}
      />

      {isLoading ? (
        <PlatformLoader
          title={t('Calculating Income Statement (P&L)', 'جاري حساب قائمة الدخل والأرباح والخسائر')}
          subtitle={t('Aggregating Operating Revenues, COGS & Tax Deductions...', 'تجميع الإيرادات التشغيلية وتكلفة المبيعات والمصروفات...')}
        />
      ) : (
        /* Printable Official Income Statement Document Container */
        <div className="print-document soft-card p-6 sm:p-10 bg-card border shadow-xs rounded-2xl space-y-8 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-6 gap-6 print:pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold print:hidden">
                  <FileText size={24} />
                </div>
                <div>
                  <span className="eyebrow block text-[10px] tracking-widest text-primary font-bold">
                    {t('SOCPA FINANCIAL STATEMENT · FORM P&L', 'قائمة الدخل الحسابية المعتمدة')}
                  </span>
                  <h1 className="text-2xl font-black tracking-tight text-foreground mt-0.5">
                    {t('PROFIT & LOSS STATEMENT', 'قائمة الأرباح والخسائر')}
                  </h1>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {t('For the Period:', 'عن الفترة:')} <span className="font-mono font-bold text-foreground">{new Date(startDate).toLocaleDateString()}</span> - <span className="font-mono font-bold text-foreground">{new Date(endDate).toLocaleDateString()}</span>
              </p>
            </div>

            {/* Entity Header */}
            <div className="text-left sm:text-right space-y-1 bg-muted/40 p-4 rounded-xl border border-border/80 print:bg-slate-50 print:border-slate-300">
              <div className="text-base font-extrabold text-foreground">
                {companyNameEn}
              </div>
              {companyNameAr && (
                <div className="text-xs font-semibold text-primary arabic">
                  {companyNameAr}
                </div>
              )}
              <div className="text-xs text-muted-foreground font-mono space-y-0.5 pt-1">
                <div>
                  <span className="font-semibold text-foreground">{t('TIN / VAT Reg #:', 'الرقم الضريبي:')}</span> {vatNumber}
                </div>
                <div>
                  <span className="font-semibold text-foreground">{t('CR Number:', 'السجل التجاري:')}</span> {crNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Financial Statement Table */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <FileText size={15} />
              {t('INCOME & EXPENSE BREAKDOWN / تفاصيل الإيرادات والمصروفات', 'تفاصيل قائمة الإيرادات والمصروفات')}
            </h4>

            <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
              <div className="divide-y divide-border/60 print:divide-slate-200">
                
                {/* 1. Operating Revenues */}
                <div className="p-4 bg-muted/60 font-bold text-xs text-foreground flex justify-between uppercase tracking-wider print:bg-slate-100">
                  <span className="font-extrabold">{t('1. OPERATING REVENUES', '١. الإيرادات التشغيلية')}</span>
                  <span className="font-mono text-sm font-black">{formatCurrency(Number(pnl?.totalRevenue || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                </div>
                {pnl?.revenueCategories?.map((cat, cIdx) => (
                  <div key={cIdx} className="bg-background">
                    {cat.items?.map((item, iIdx) => (
                      <div key={iIdx} className="flex justify-between px-8 py-3 text-sm border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-muted-foreground">{item.code}</span>
                          <span className="font-medium text-foreground">{isRtl ? item.nameArabic : item.nameEnglish}</span>
                        </div>
                        <span className="font-mono font-semibold text-foreground">{formatCurrency(Number(item.amount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* 2. Cost of Sales (COGS) */}
                <div className="flex justify-between px-6 py-3.5 font-bold text-sm bg-muted/30 print:bg-slate-50 border-t border-b">
                  <span>{t('2. COST OF SALES (COGS)', '٢. تكلفة المبيعات')}</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">({formatCurrency(Number(pnl?.totalCostOfSales || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')})</span>
                </div>

                {/* Gross Profit Summary Row */}
                <div className="flex justify-between px-6 py-4 font-black text-base bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 border-t border-b border-emerald-500/30">
                  <span>{t('GROSS PROFIT', 'مجمل الربح')}</span>
                  <span className="font-mono">{formatCurrency(Number(pnl?.grossProfit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                </div>

                {/* 3. Operating & General Expenses */}
                <div className="p-4 bg-muted/60 font-bold text-xs text-foreground flex justify-between uppercase tracking-wider print:bg-slate-100">
                  <span className="font-extrabold">{t('3. OPERATING & GENERAL EXPENSES', '٣. المصروفات التشغيلية والإدارية')}</span>
                  <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">({formatCurrency(Number(pnl?.totalExpenses || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')})</span>
                </div>
                {pnl?.expenseCategories?.map((cat, cIdx) => (
                  <div key={cIdx} className="bg-background">
                    {cat.items?.map((item, iIdx) => (
                      <div key={iIdx} className="flex justify-between px-8 py-3 text-sm border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-muted-foreground">{item.code}</span>
                          <span className="font-medium text-foreground">{isRtl ? item.nameArabic : item.nameEnglish}</span>
                        </div>
                        <span className="font-mono font-medium text-foreground">{formatCurrency(Number(item.amount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Final Net Profit / Loss Banner */}
                <div className={`flex justify-between items-baseline px-6 py-5 font-black text-xl border-t-2 ${
                  Number(pnl?.netProfit || 0) >= 0 
                    ? 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-950 dark:text-rose-200 border-rose-500/40'
                }`}>
                  <span className="tracking-tight">
                    {Number(pnl?.netProfit || 0) >= 0 
                      ? t('NET PROFIT FOR THE PERIOD', 'صافي ربح الفترة') 
                      : t('NET LOSS FOR THE PERIOD', 'صافي خسارة الفترة')}
                  </span>
                  <span className="font-mono font-black text-2xl">
                    {formatCurrency(Number(pnl?.netProfit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Printable Official Statement Footnote & Signature Box */}
          <div className="hidden print:flex justify-between items-end border-t border-slate-300 pt-8 mt-12 print-avoid-break">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="font-bold text-slate-800">{companyNameEn}</div>
              <div>Official SOCPA Financial Income & Loss Statement</div>
              <div className="text-[10px]">Generated via NEXUS ERP · General Ledger Double-Entry Audit Trail</div>
            </div>

            <div className="text-center w-64 space-y-12">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Financial Controller Signature & Stamp
              </div>
              <div className="border-b border-dashed border-slate-400 w-full"></div>
              <div className="text-[10px] text-slate-400">Date: ____ / ____ / 2026</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
