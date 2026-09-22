import { useState } from 'react';
import { useGetCurrentSession, useGetZatcaVatReturn } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Printer, ShieldCheck, ArrowUpRight, ArrowDownRight, Building2, FileText, CheckCircle2 } from 'lucide-react';
import { PlatformLoader } from '@/components/ui/platform-loader';

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

  const companyNameEn = currentOrg?.legalNameEnglish || currentOrg?.tradingNameEnglish || 'Nouman Trading & Technology Co.';
  const companyNameAr = currentOrg?.legalNameArabic || currentOrg?.tradingNameArabic || 'شركة نعمان للتجارة والتقنية';
  const vatNumber = currentOrg?.vatNumber || '310998877600003';
  const crNumber = currentOrg?.commercialRegistrationNumber || '1010889922';

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      
      {/* Top Header Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-card/70 backdrop-blur-md p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('ZATCA Official VAT Return Report', 'إقرار ضريبة القيمة المضافة - هيئة الزكاة والضريبة')}
            </h1>
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-0.5 text-xs font-extrabold border border-emerald-500/20">
              GAZT 15% VAT
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('Official Saudi Form 21 Tax Return summary for Output Tax vs Input Tax refund calculation.', 'ملخص الإقرار الضريبي الرسمي نموذج 21 لحساب ضريبة المخرجات والمدخلات المستردة.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-xl text-xs font-bold border border-border">
            <button
              onClick={() => setDatePreset('this_quarter')}
              className={`px-3 py-1.5 rounded-lg transition-all ${datePreset === 'this_quarter' ? 'bg-background shadow text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('Quarterly Tax Period', 'الفترة الربع سنوية')}
            </button>
            <button
              onClick={() => setDatePreset('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${datePreset === 'this_month' ? 'bg-background shadow text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('Monthly Tax Period', 'الفترة الشهرية')}
            </button>
          </div>
          <Button onClick={handlePrint} className="gap-2 text-xs py-2 px-4 font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
            <Printer className="w-4 h-4" />
            <span>{t('Print Form 21 PDF', 'طباعة النموذج 21')}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PlatformLoader
          title={t('Generating ZATCA VAT Return Form 21', 'جاري إعداد نموذج الإقرار الضريبي 21 ZATCA')}
          subtitle={t('Consolidating Output VAT & Claimable Input Tax...', 'تجميع ضريبة المخرجات والضريبة القابلة للخصم...')}
        />
      ) : (
        /* Printable Official ZATCA Declaration Form Container */
        <div className="print-document soft-card p-6 sm:p-10 bg-card border shadow-lg rounded-2xl space-y-8 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-6">
          
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-6 gap-6 print:pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold print:hidden">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <span className="eyebrow block text-[10px] tracking-widest text-primary font-bold">
                    {t('KINGDOM OF SAUDI ARABIA · ZATCA FORM 21', 'المملكة العربية السعودية · الإقرار الضريبي نموذج 21')}
                  </span>
                  <h1 className="text-2xl font-black tracking-tight text-foreground mt-0.5">
                    {t('VALUE ADDED TAX RETURN DECLARATION', 'إقرار ضريبة القيمة المضافة')}
                  </h1>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {t('Tax Period:', 'فترة الإقرار:')} <span className="font-mono font-bold text-foreground">{new Date(startDate).toLocaleDateString()}</span> - <span className="font-mono font-bold text-foreground">{new Date(endDate).toLocaleDateString()}</span>
              </p>
            </div>

            {/* Taxpayer Entity Card */}
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
                  <span className="font-semibold text-foreground">{t('TIN / VAT Reg #:', 'الرقم الضريبي:')}</span> <span className="font-bold text-foreground">{vatNumber}</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">{t('CR Number:', 'السجل التجاري:')}</span> {crNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Net VAT Calculation Summary Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-6 print:bg-slate-50 print:border-slate-300 ${
            vat?.isRefundable 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
          }`}>
            <div className="space-y-1 text-center sm:text-start">
              <div className="text-xs font-extrabold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                {vat?.isRefundable ? <ArrowDownRight className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-amber-600" />}
                <span>
                  {vat?.isRefundable 
                    ? t('NET VAT REFUNDABLE / CREDIT (استرداد ضريبي لك للم المنشأة)', 'صافي الضريبة المستردة للشركة') 
                    : t('NET VAT PAYABLE TO ZATCA (ضريبة مستحقة للهيئة)', 'صافي الضريبة الواجب أداؤها للهيئة')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {vat?.isRefundable 
                  ? t('Input Tax (Purchases) exceeds Output Tax (Sales). You are entitled to a ZATCA tax refund.', 'ضريبة المدخلات أعلى من ضريبة المخرجات. يحق للمنشأة استرداد رصيد ضريبي.') 
                  : t('Output Tax (Sales) exceeds Input Tax (Purchases). Amount payable to ZATCA by due date.', 'ضريبة المخرجات أعلى من المدخلات. يلزم سداد المبلغ للهيئة.')}
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black font-mono text-primary tracking-tight">
                {formatCurrency(Number(vat?.netVatPayable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase text-center sm:text-right">
                {t('SAR (ر.س)', 'ريال سعودي')}
              </div>
            </div>
          </div>

          {/* Section 1: Sales / Output Tax (المبيعات والضريبة المستحقة) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs uppercase font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                <FileText size={15} />
                {t('SECTION 1: VAT ON SALES / OUTPUT TAX (ضريبة القيمة المضافة على المبيعات / المخرجات)', 'القسم الأول: ضريبة القيمة المضافة على المبيعات')}
              </h3>
              <span className="text-[11px] font-bold text-muted-foreground">{t('Boxes 1 - 5', 'الخانات ١ - ٥')}</span>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted/60 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider print:bg-slate-100">
                  <tr>
                    <th className="p-3.5 text-center w-16 border-r border-border/40">{t('Box #', 'الخانة')}</th>
                    <th className="p-3.5 border-r border-border/40">{t('Declaration Line Item', 'بند الإقرار الضريبي')}</th>
                    <th className="p-3.5 text-right w-44 border-r border-border/40">{t('Taxable Amount', 'المبلغ الخاضع')}</th>
                    <th className="p-3.5 text-right w-44">{t('Output VAT (15%)', 'مبلغ الضريبة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 print:divide-slate-200">
                  {vat?.salesBoxes?.map((box, bIdx) => (
                    <tr key={bIdx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 text-center font-bold font-mono text-xs bg-muted/30 border-r border-border/30">{box.boxNumber}</td>
                      <td className="p-3.5 font-medium border-r border-border/30">{isRtl ? box.titleAr : box.titleEn}</td>
                      <td className="p-3.5 text-right font-mono border-r border-border/30">{formatCurrency(Number(box.taxableAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">{formatCurrency(Number(box.vatAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-500/10 font-extrabold border-t border-emerald-500/30">
                    <td className="p-3.5 text-center font-mono border-r border-emerald-500/30">5</td>
                    <td className="p-3.5 text-emerald-950 dark:text-emerald-200 border-r border-emerald-500/30">
                      {t('TOTAL SALES & OUTPUT VAT (إجمالي ضريبة المخرجات)', 'إجمالي ضريبة المبيعات والمخرجات')}
                    </td>
                    <td className="p-3.5 text-right font-mono border-r border-emerald-500/30">{formatCurrency(Number(vat?.totalSalesTaxable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    <td className="p-3.5 text-right font-mono text-emerald-700 dark:text-emerald-300 text-base">{formatCurrency(Number(vat?.totalOutputVat || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Purchases / Input Tax (المشتريات والضريبة المستردة) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs uppercase font-extrabold text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
                <FileText size={15} />
                {t('SECTION 2: VAT ON PURCHASES / INPUT TAX (ضريبة القيمة المضافة على المشتريات / المدخلات)', 'القسم الثاني: ضريبة القيمة المضافة على المشتريات')}
              </h3>
              <span className="text-[11px] font-bold text-muted-foreground">{t('Boxes 6 - 10', 'الخانات ٦ - ١٠')}</span>
            </div>

            <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted/60 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider print:bg-slate-100">
                  <tr>
                    <th className="p-3.5 text-center w-16 border-r border-border/40">{t('Box #', 'الخانة')}</th>
                    <th className="p-3.5 border-r border-border/40">{t('Declaration Line Item', 'بند الإقرار الضريبي')}</th>
                    <th className="p-3.5 text-right w-44 border-r border-border/40">{t('Taxable Amount', 'المبلغ الخاضع')}</th>
                    <th className="p-3.5 text-right w-44">{t('Recoverable VAT (15%)', 'الضريبة المستردة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 print:divide-slate-200">
                  {vat?.purchaseBoxes?.map((box, bIdx) => (
                    <tr key={bIdx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 text-center font-bold font-mono text-xs bg-muted/30 border-r border-border/30">{box.boxNumber}</td>
                      <td className="p-3.5 font-medium border-r border-border/30">{isRtl ? box.titleAr : box.titleEn}</td>
                      <td className="p-3.5 text-right font-mono border-r border-border/30">{formatCurrency(Number(box.taxableAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-600">{formatCurrency(Number(box.vatAmount), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    </tr>
                  ))}
                  <tr className="bg-amber-500/10 font-extrabold border-t border-amber-500/30">
                    <td className="p-3.5 text-center font-mono border-r border-amber-500/30">10</td>
                    <td className="p-3.5 text-amber-950 dark:text-amber-200 border-r border-amber-500/30">
                      {t('TOTAL PURCHASES & INPUT VAT (إجمالي ضريبة المدخلات)', 'إجمالي ضريبة المشتريات والمدخلات')}
                    </td>
                    <td className="p-3.5 text-right font-mono border-r border-amber-500/30">{formatCurrency(Number(vat?.totalPurchasesTaxable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    <td className="p-3.5 text-right font-mono text-amber-700 dark:text-amber-300 text-base">{formatCurrency(Number(vat?.totalInputVat || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Net VAT Calculation (Box 11) */}
          <div className="p-6 bg-muted/60 border border-border/80 rounded-2xl print:bg-slate-100 print:border-slate-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-start">
                <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span>{t('BOX 11: TOTAL VAT DUE / REFUNDABLE FOR THE PERIOD', 'الخانة ١١: إجمالي الضريبة المستحقة / المستردة عن الفترة')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('Output VAT (Box 5) minus Input VAT (Box 10)', 'ضريبة المخرجات (الخانة ٥) مطروحاً منها ضريبة المدخلات (الخانة ١٠)')}
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-primary">
                {formatCurrency(Number(vat?.netVatPayable || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </div>
            </div>
          </div>

          {/* Printable Official Tax Declaration Footnote & Signature Box */}
          <div className="hidden print:flex justify-between items-end border-t border-slate-300 pt-8 mt-12 print-avoid-break">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="font-bold text-slate-800">{companyNameEn}</div>
              <div>Official ZATCA Form 21 Value Added Tax Return Declaration</div>
              <div className="text-[10px]">Generated via NEXUS ERP · ZATCA Tax Compliance Module</div>
            </div>

            <div className="text-center w-64 space-y-12">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Authorized Tax Officer Signature & Stamp
              </div>
              <div className="border-b border-dashed border-slate-400 w-full"></div>
              <div className="text-[10px] text-slate-400">Submission Date: ____ / ____ / 2026</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
