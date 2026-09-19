import { useState } from 'react';
import { useGetCurrentSession, useGetZatcaVatReturn } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Printer, ShieldCheck, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';

export function ZatcaVatReturnReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const currentOrg = session?.organizations?.find(o => o.organization.id === orgId)?.organization;

  const [datePreset, setDatePreset] = useState<'this_month' | 'this_quarter'>('this_quarter');

  const getDates = () => {
    const now = new Date();
    if (datePreset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), quarterMonth, 1);
    const end = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const { startDate, endDate } = getDates();
  const { data: vat, isLoading } = useGetZatcaVatReturn(orgId, {
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {t('ZATCA Official VAT Return Report', 'إقرار ضريبة القيمة المضافة - هيئة الزكاة والضريبة')}
            </h1>
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-bold border border-emerald-500/20">
              GAZT 15% VAT
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('Official Saudi tax return summary for Output Tax vs Input Tax refund calculation.', 'ملخص الإقرار الضريبي الرسمي لحساب ضريبة المخرجات واسترداد المدخلات.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDatePreset('this_quarter')}
              className={`px-3 py-1.5 rounded-md transition-colors ${datePreset === 'this_quarter' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >
              {t('Quarterly Tax Period', 'الفترة الربع سنوية')}
            </button>
            <button
              onClick={() => setDatePreset('this_month')}
              className={`px-3 py-1.5 rounded-md transition-colors ${datePreset === 'this_month' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            >
              {t('Monthly Tax Period', 'الفترة الشهرية')}
            </button>
          </div>
          <Button variant="outline" onClick={handlePrint} className="gap-2 text-xs">
            <Printer className="w-4 h-4" />
            <span>{t('Print Form', 'طباعة النموذج')}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">{t('Loading VAT declaration form...', 'جاري تحميل نموذج الإقرار الضريبي...')}</Card>
      ) : (
        <div className="space-y-6">
          {/* Taxable Entity Card Header */}
          <Card className="p-4 bg-muted/40 border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{currentOrg?.nameEnglish || currentOrg?.nameArabic || "Saudi Enterprise"}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {t('VAT Registration No (TIN):', 'الرقم الضريبي:')} <span className="font-bold text-foreground">{currentOrg?.vatNumber || "300000000000003"}</span>
                  </div>
                </div>
              </div>

              {/* Net VAT Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-6 ${vat?.isRefundable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200' : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'}`}>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider">
                    {vat?.isRefundable ? t('Net VAT Refundable (استرداد ضريبي)', 'صافي الضريبة المستردة') : t('Net VAT Payable to ZATCA (ضريبة مستحقة)', 'صافي الضريبة الواجب أداؤها')}
                  </div>
                  <div className="text-2xl font-extrabold font-mono mt-0.5">
                    {formatCurrency(Number(vat?.netVatPayable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
                {vat?.isRefundable ? <ArrowDownRight className="w-8 h-8 text-emerald-600" /> : <ArrowUpRight className="w-8 h-8 text-amber-600" />}
              </div>
            </div>
          </Card>

          {/* Section 1: Sales / Output Tax (المبيعات والضريبة المستحقة) */}
          <Card className="border overflow-hidden">
            <CardHeader className="bg-emerald-500/10 border-b pb-3">
              <CardTitle className="text-base font-bold text-emerald-950 dark:text-emerald-200 uppercase">
                {t('SECTION 1: VAT ON SALES (ضريبة القيمة المضافة على المبيعات / المخرجات)', 'القسم الأول: ضريبة القيمة المضافة على المبيعات')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-start">
                <thead className="bg-muted/40 text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="p-3 text-center w-16">{t('Box #', 'الخانة')}</th>
                    <th className="p-3 text-start">{t('Declaration Line Item', 'بند الإقرار الضريبي')}</th>
                    <th className="p-3 text-end">{t('Taxable Amount (المبلغ الخاضع)', 'المبلغ الخاضع للضريبة')}</th>
                    <th className="p-3 text-end">{t('VAT Amount (مبلغ الضريبة)', 'مبلغ الضريبة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vat?.salesBoxes?.map((box, bIdx) => (
                    <tr key={bIdx} className="hover:bg-muted/20">
                      <td className="p-3 text-center font-bold font-mono text-xs bg-muted/20">{box.boxNumber}</td>
                      <td className="p-3 font-medium">{isRtl ? box.titleAr : box.titleEn}</td>
                      <td className="p-3 text-end font-mono">{formatCurrency(Number(box.taxableAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                      <td className="p-3 text-end font-mono font-bold text-emerald-600">{formatCurrency(Number(box.vatAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-500/10 font-bold border-t">
                    <td className="p-3 text-center font-mono">5</td>
                    <td className="p-3">{t('TOTAL SALES & OUTPUT VAT (إجمالي ضريبة المخرجات)', 'إجمالي ضريبة المبيعات والمخرجات')}</td>
                    <td className="p-3 text-end font-mono">{formatCurrency(Number(vat?.totalSalesTaxable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    <td className="p-3 text-end font-mono text-emerald-700 dark:text-emerald-300 text-base">{formatCurrency(Number(vat?.totalOutputVat || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Section 2: Purchases / Input Tax (المشتريات والضريبة المستردة) */}
          <Card className="border overflow-hidden">
            <CardHeader className="bg-amber-500/10 border-b pb-3">
              <CardTitle className="text-base font-bold text-amber-950 dark:text-amber-200 uppercase">
                {t('SECTION 2: VAT ON PURCHASES (ضريبة القيمة المضافة على المشتريات / المدخلات)', 'القسم الثاني: ضريبة القيمة المضافة على المشتريات')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-start">
                <thead className="bg-muted/40 text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="p-3 text-center w-16">{t('Box #', 'الخانة')}</th>
                    <th className="p-3 text-start">{t('Declaration Line Item', 'بند الإقرار الضريبي')}</th>
                    <th className="p-3 text-end">{t('Taxable Amount (المبلغ الخاضع)', 'المبلغ الخاضع للضريبة')}</th>
                    <th className="p-3 text-end">{t('Recoverable VAT (الضريبة المستردة)', 'الضريبة المستردة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vat?.purchaseBoxes?.map((box, bIdx) => (
                    <tr key={bIdx} className="hover:bg-muted/20">
                      <td className="p-3 text-center font-bold font-mono text-xs bg-muted/20">{box.boxNumber}</td>
                      <td className="p-3 font-medium">{isRtl ? box.titleAr : box.titleEn}</td>
                      <td className="p-3 text-end font-mono">{formatCurrency(Number(box.taxableAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                      <td className="p-3 text-end font-mono font-bold text-amber-600">{formatCurrency(Number(box.vatAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-500/10 font-bold border-t">
                    <td className="p-3 text-center font-mono">10</td>
                    <td className="p-3">{t('TOTAL PURCHASES & INPUT VAT (إجمالي ضريبة المدخلات)', 'إجمالي ضريبة المشتريات والمدخلات')}</td>
                    <td className="p-3 text-end font-mono">{formatCurrency(Number(vat?.totalPurchasesTaxable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    <td className="p-3 text-end font-mono text-amber-700 dark:text-amber-300 text-base">{formatCurrency(Number(vat?.totalInputVat || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Section 3: Net VAT Calculation (الخانة 11: صافي الضريبة) */}
          <Card className="p-6 bg-muted border-foreground/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-start">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('BOX 11: TOTAL VAT DUE / REFUNDABLE FOR THE PERIOD', 'الخانة ١١: إجمالي الضريبة المستحقة / المستردة عن الفترة')}
                </div>
                <div className="text-sm font-medium">
                  {t('Output VAT (Box 5) minus Input VAT (Box 10)', 'ضريبة المخرجات (الخانة ٥) مطروحاً منها ضريبة المدخلات (الخانة ١٠)')}
                </div>
              </div>
              <div className="text-2xl font-black font-mono">
                {formatCurrency(Number(vat?.netVatPayable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
