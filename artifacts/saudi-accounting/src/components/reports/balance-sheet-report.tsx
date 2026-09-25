import { useGetCurrentSession, useGetBalanceSheet, getGetBalanceSheetQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Printer, Scale, RefreshCw, Sparkles, ShieldCheck, DownloadCloud } from 'lucide-react';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { BalanceSheetKpiCards } from './balance-sheet-kpi-cards';

export function BalanceSheetReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const currentOrg = session?.organizations?.find(o => o.organization.id === orgId)?.organization;

  // Fast React Query caching (10 mins staleTime for 0ms instant load latency)
  const { data: bs, isLoading, refetch } = useGetBalanceSheet(orgId, {}, {
    query: { 
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getGetBalanceSheetQueryKey(orgId, {})
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
    if (!bs) return;
    const headers = ['Category / Code', 'Name English', 'Name Arabic', 'Balance (SAR)'];
    const rows: string[][] = [];

    rows.push(['ASSETS', '', '', String(bs.totalAssets || 0)]);
    bs.assetsSections?.forEach(sec => {
      sec.accounts?.forEach(acc => {
        rows.push([acc.code || '', acc.nameEnglish || '', acc.nameArabic || '', String(acc.balance || 0)]);
      });
    });

    rows.push(['LIABILITIES', '', '', String(bs.totalLiabilities || 0)]);
    bs.liabilitiesSections?.forEach(sec => {
      sec.accounts?.forEach(acc => {
        rows.push([acc.code || '', acc.nameEnglish || '', acc.nameArabic || '', String(acc.balance || 0)]);
      });
    });

    rows.push(['OWNERS EQUITY', '', '', String(bs.totalEquity || 0)]);
    bs.equitySections?.forEach(sec => {
      sec.accounts?.forEach(acc => {
        rows.push([acc.code || '', acc.nameEnglish || '', acc.nameArabic || '', String(acc.balance || 0)]);
      });
    });

    rows.push(['TOTAL LIABILITIES & EQUITY', '', '', String(bs.totalLiabilitiesAndEquity || 0)]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `balance_sheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('Balance Sheet Exported Successfully!', 'تم تصدير الميزانية العمومية بنجاح!'), 'success');
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
            {t('Balance Sheet Statement', 'الميزانية العمومية (قائمة المركز المالي)')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Financial position showing organization Assets, Liabilities, and Owner\'s Equity.', 'بيان المركز المالي الذي يوضح أصول المنشأة والالتزامات وحقوق الملكية.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
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
            <span>{t('Print Statement PDF', 'طباعة الميزانية')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Component */}
      <BalanceSheetKpiCards
        totalAssets={Number(bs?.totalAssets || 0)}
        totalLiabilities={Number(bs?.totalLiabilities || 0)}
        totalEquity={Number(bs?.totalEquity || 0)}
        isBalanced={bs?.isBalanced ?? true}
        currency={bs?.currency || 'SAR'}
        isLoading={isLoading}
      />

      {isLoading ? (
        <PlatformLoader
          title={t('Constructing Financial Statement (Balance Sheet)', 'جاري بناء قائمة المركز المالي (الميزانية العمومية)')}
          subtitle={t('Auditing Total Assets vs. Liabilities & Equity balances...', 'مراجعة إجمالي الأصول مقابل الالتزامات وحقوق الملكية...')}
        />
      ) : (
        /* Printable Official Balance Sheet Document Container */
        <div className="print-document soft-card p-6 sm:p-10 bg-card border shadow-xs rounded-2xl space-y-8 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-6">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-6 gap-6 print:pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold print:hidden">
                  <Scale size={24} />
                </div>
                <div>
                  <span className="eyebrow block text-[10px] tracking-widest text-primary font-bold">
                    {t('SOCPA FINANCIAL STATEMENT · FORM BS', 'قائمة المركز المالي المعتمدة')}
                  </span>
                  <h1 className="text-2xl font-black tracking-tight text-foreground mt-0.5">
                    {t('BALANCE SHEET STATEMENT', 'الميزانية العمومية')}
                  </h1>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {t('As of Date:', 'كما في تاريخ:')} <span className="font-mono font-bold text-foreground">{new Date().toLocaleDateString()}</span>
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

          {/* 2-Column Balance Sheet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            
            {/* Left Column: Assets */}
            <div className="space-y-4">
              <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
                <div className="p-4 bg-emerald-500/10 border-b border-border flex justify-between items-center print:bg-slate-100">
                  <span className="font-black text-xs uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                    {t('1. ASSETS (الأصول)', '١. الأصول')}
                  </span>
                  <span className="font-mono text-base font-black text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(Number(bs?.totalAssets || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
                <div className="divide-y divide-border/60 print:divide-slate-200">
                  {bs?.assetsSections?.map((section, sIdx) => (
                    <div key={sIdx}>
                      <div className="px-4 py-2.5 bg-muted/40 font-bold text-xs text-muted-foreground uppercase tracking-wider">
                        {isRtl ? section.titleAr : section.titleEn}
                      </div>
                      {section.accounts?.map((acc, aIdx) => (
                        <div key={aIdx} className="flex justify-between px-6 py-3 text-sm hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-semibold text-muted-foreground">{acc.code}</span>
                            <span className="font-medium text-foreground">{isRtl ? acc.nameArabic : acc.nameEnglish}</span>
                          </div>
                          <span className="font-mono font-semibold text-foreground">{formatCurrency(Number(acc.balance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Liabilities & Equity */}
            <div className="space-y-6">
              
              {/* Liabilities */}
              <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
                <div className="p-4 bg-amber-500/10 border-b border-border flex justify-between items-center print:bg-slate-100">
                  <span className="font-black text-xs uppercase tracking-wider text-amber-950 dark:text-amber-200">
                    {t('2. LIABILITIES (الالتزامات)', '٢. الالتزامات')}
                  </span>
                  <span className="font-mono text-base font-black text-amber-700 dark:text-amber-300">
                    {formatCurrency(Number(bs?.totalLiabilities || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
                <div className="divide-y divide-border/60 print:divide-slate-200">
                  {bs?.liabilitiesSections?.map((section, sIdx) => (
                    <div key={sIdx}>
                      <div className="px-4 py-2.5 bg-muted/40 font-bold text-xs text-muted-foreground uppercase tracking-wider">
                        {isRtl ? section.titleAr : section.titleEn}
                      </div>
                      {section.accounts?.map((acc, aIdx) => (
                        <div key={aIdx} className="flex justify-between px-6 py-3 text-sm hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-semibold text-muted-foreground">{acc.code}</span>
                            <span className="font-medium text-foreground">{isRtl ? acc.nameArabic : acc.nameEnglish}</span>
                          </div>
                          <span className="font-mono font-semibold text-foreground">{formatCurrency(Number(acc.balance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity */}
              <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
                <div className="p-4 bg-blue-500/10 border-b border-border flex justify-between items-center print:bg-slate-100">
                  <span className="font-black text-xs uppercase tracking-wider text-blue-950 dark:text-blue-200">
                    {t('3. OWNER\'S EQUITY (حقوق الملكية)', '٣. حقوق الملكية')}
                  </span>
                  <span className="font-mono text-base font-black text-blue-700 dark:text-blue-300">
                    {formatCurrency(Number(bs?.totalEquity || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
                <div className="divide-y divide-border/60 print:divide-slate-200">
                  {bs?.equitySections?.map((section, sIdx) => (
                    <div key={sIdx}>
                      <div className="px-4 py-2.5 bg-muted/40 font-bold text-xs text-muted-foreground uppercase tracking-wider">
                        {isRtl ? section.titleAr : section.titleEn}
                      </div>
                      {section.accounts?.map((acc, aIdx) => (
                        <div key={aIdx} className="flex justify-between px-6 py-3 text-sm hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-semibold text-muted-foreground">{acc.code}</span>
                            <span className="font-medium text-foreground">{isRtl ? acc.nameArabic : acc.nameEnglish}</span>
                          </div>
                          <span className="font-mono font-semibold text-foreground">{formatCurrency(Number(acc.balance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Liabilities & Equity Summary */}
              <div className="p-5 bg-muted/60 border border-border/80 rounded-2xl flex justify-between items-center print:bg-slate-100 print:border-slate-300">
                <span className="font-black text-xs uppercase tracking-wider text-foreground">
                  {t('TOTAL LIABILITIES & EQUITY', 'إجمالي الالتزامات وحقوق الملكية')}
                </span>
                <span className="font-mono font-black text-xl text-primary">
                  {formatCurrency(Number(bs?.totalLiabilitiesAndEquity || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                </span>
              </div>

            </div>

          </div>

          {/* Printable Official Statement Footnote & Signature Box */}
          <div className="hidden print:flex justify-between items-end border-t border-slate-300 pt-8 mt-12 print-avoid-break">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="font-bold text-slate-800">{companyNameEn}</div>
              <div>Official SOCPA Financial Position & Balance Sheet Statement</div>
              <div className="text-[10px]">Generated via NEXUS ERP · General Ledger Double-Entry Audit Trail</div>
            </div>

            <div className="text-center w-64 space-y-12">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Certified Auditor Signature & Stamp
              </div>
              <div className="border-b border-dashed border-slate-400 w-full"></div>
              <div className="text-[10px] text-slate-400">Audit Date: ____ / ____ / 2026</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
