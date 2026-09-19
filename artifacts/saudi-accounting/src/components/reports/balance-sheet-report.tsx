import { useState } from 'react';
import { useGetCurrentSession, useGetBalanceSheet } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Printer, Scale, CheckCircle2, AlertTriangle } from 'lucide-react';

export function BalanceSheetReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: bs, isLoading } = useGetBalanceSheet(orgId, {}, {
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
            {t('Balance Sheet Statement', 'الميزانية العمومية (قائمة المركز المالي)')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Financial position showing organization Assets, Liabilities, and Owner\'s Equity.', 'بيان المركز المالي الذي يوضح أصول المنشأة والالتزامات وحقوق الملكية.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bs && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bs.isBalanced ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
              {bs.isBalanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{bs.isBalanced ? t('Balanced Statement (Assets = L + E)', 'الميزانية متوازنة (الأصول = الالتزامات + الملكية)') : t('Unbalanced Statement', 'الميزانية غير متوازنة')}</span>
            </div>
          )}
          <Button variant="outline" onClick={handlePrint} className="gap-2 text-xs">
            <Printer className="w-4 h-4" />
            <span>{t('Print', 'طباعة')}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">{t('Loading balance sheet...', 'جاري تحميل الميزانية العمومية...')}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Assets */}
          <Card className="border">
            <CardHeader className="bg-emerald-500/10 border-b pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                  {t('1. ASSETS (الأصول)', '١. الأصول')}
                </CardTitle>
                <span className="font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(Number(bs?.totalAssets || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {bs?.assetsSections?.map((section, sIdx) => (
                <div key={sIdx}>
                  <div className="px-4 py-2 bg-muted/30 font-semibold text-xs text-muted-foreground uppercase">
                    {isRtl ? section.titleAr : section.titleEn}
                  </div>
                  {section.accounts?.map((acc, aIdx) => (
                    <div key={aIdx} className="flex justify-between px-6 py-2.5 text-sm hover:bg-muted/20">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{acc.code}</span>
                        <span>{isRtl ? acc.nameArabic : acc.nameEnglish}</span>
                      </div>
                      <span className="font-mono font-medium">{formatCurrency(Number(acc.balance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Right Column: Liabilities & Equity */}
          <div className="space-y-6">
            {/* Liabilities */}
            <Card className="border">
              <CardHeader className="bg-amber-500/10 border-b pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                    {t('2. LIABILITIES (الالتزامات)', '٢. الالتزامات')}
                  </CardTitle>
                  <span className="font-mono text-lg font-extrabold text-amber-700 dark:text-amber-300">
                    {formatCurrency(Number(bs?.totalLiabilities || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {bs?.liabilitiesSections?.map((section, sIdx) => (
                  <div key={sIdx}>
                    <div className="px-4 py-2 bg-muted/30 font-semibold text-xs text-muted-foreground uppercase">
                      {isRtl ? section.titleAr : section.titleEn}
                    </div>
                    {section.accounts?.map((acc, aIdx) => (
                      <div key={aIdx} className="flex justify-between px-6 py-2.5 text-sm hover:bg-muted/20">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{acc.code}</span>
                          <span>{isRtl ? acc.nameArabic : acc.nameEnglish}</span>
                        </div>
                        <span className="font-mono font-medium">{formatCurrency(Number(acc.balance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Equity */}
            <Card className="border">
              <CardHeader className="bg-blue-500/10 border-b pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wide">
                    {t('3. OWNER\'S EQUITY (حقوق الملكية)', '٣. حقوق الملكية')}
                  </CardTitle>
                  <span className="font-mono text-lg font-extrabold text-blue-700 dark:text-blue-300">
                    {formatCurrency(Number(bs?.totalEquity || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {bs?.equitySections?.map((section, sIdx) => (
                  <div key={sIdx}>
                    <div className="px-4 py-2 bg-muted/30 font-semibold text-xs text-muted-foreground uppercase">
                      {isRtl ? section.titleAr : section.titleEn}
                    </div>
                    {section.accounts?.map((acc, aIdx) => (
                      <div key={aIdx} className="flex justify-between px-6 py-2.5 text-sm hover:bg-muted/20">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{acc.code}</span>
                          <span>{isRtl ? acc.nameArabic : acc.nameEnglish}</span>
                        </div>
                        <span className="font-mono font-medium">{formatCurrency(Number(acc.balance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Total Liabilities & Equity Summary */}
            <Card className="p-4 bg-muted border-foreground/20 flex justify-between items-center">
              <span className="font-bold text-base uppercase">
                {t('TOTAL LIABILITIES & EQUITY', 'إجمالي الالتزامات وحقوق الملكية')}
              </span>
              <span className="font-mono font-extrabold text-xl">
                {formatCurrency(Number(bs?.totalLiabilitiesAndEquity || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </span>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
