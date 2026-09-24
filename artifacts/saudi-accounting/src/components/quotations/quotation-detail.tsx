import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetQuotation, 
  useUpdateQuotationStatus,
  useConvertQuotationToInvoice,
  getGetQuotationQueryKey,
  getListQuotationsQueryKey,
  getListInvoicesQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  Send, 
  CheckCircle2, 
  XCircle, 
  FileCheck, 
  Clock, 
  Building2, 
  Calendar, 
  CreditCard,
  FileText,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Hash
} from 'lucide-react';

export function QuotationDetail({ id }: { id: string }) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const rawOrgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const orgId = rawOrgId || '';
  const org = session?.organizations?.find(o => o.organization.id === orgId)?.organization || session?.organizations?.[0]?.organization;
  const queryClient = useQueryClient();

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: fetchedQuotation, isLoading, refetch } = useGetQuotation(orgId, id, {
    query: {
      enabled: Boolean(orgId) && !!id,
      queryKey: getGetQuotationQueryKey(orgId, id),
    },
  });

  const quotation = (fetchedQuotation && (fetchedQuotation as any).id) ? fetchedQuotation : null;

  const { mutateAsync: updateStatus } = useUpdateQuotationStatus();
  const { mutateAsync: convertQuotation } = useConvertQuotationToInvoice();

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      if (newStatus === 'CONVERTED') {
        const createdInvoice = await convertQuotation({
          organizationId: orgId,
          quotationId: id,
        });
        await refetch();
        queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey(orgId) });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
        await showAlert.success(
          t('Quotation Converted!', 'تم تحويل عرض السعر!'),
          t('Quotation has been successfully converted into a ZATCA Tax Invoice.', 'تم تحويل عرض السعر إلى فاتورة ضريبية إلكترونية بنجاح.')
        );
        if (createdInvoice?.id) {
          setLocation(`/finance/invoices/${createdInvoice.id}`);
        } else {
          setLocation('/finance/invoices');
        }
      } else {
        await updateStatus({
          organizationId: orgId,
          quotationId: id,
          data: { status: newStatus as any }
        });
        await refetch();
        queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey(orgId) });
        showAlert.toast(t('Quotation status updated successfully!', 'تم تحديث حالة عرض السعر بنجاح!'));
      }
    } catch (err: any) {
      showAlert.error(t('Error', 'خطأ'), err?.message || t('Failed to update quotation status', 'فشل تحديث حالة عرض السعر'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <PlatformLoader
        title={t('Retrieving Commercial Quotation', 'جاري جلب عرض السعر التجاري')}
        subtitle={t('Preparing tax specifications & line item breakdown...', 'تحضير المواصفات الضريبية وتفاصيل الأصناف...')}
      />
    );
  }

  if (!quotation) {
    return (
      <div className="p-12 text-center fade-up">
        <h2 className="text-xl font-bold text-foreground">{t('Quotation Not Found', 'عرض السعر غير موجود')}</h2>
        <Button variant="secondary" className="mt-4 gap-2" onClick={() => setLocation('/finance/quotations')}>
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t('Back to Quotations', 'العودة لقائمة عروض الأسعار')}
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock size={14} />
            {t('Draft', 'مسودة')}
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Send size={14} />
            {t('Sent', 'مرسل')}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} />
            {t('Accepted', 'مقبول')}
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle size={14} />
            {t('Declined', 'مرفوض')}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock size={14} />
            {t('Expired', 'منتهي')}
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <FileCheck size={14} />
            {t('Converted to Invoice', 'محوّل لفاتورة')}
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  const companyNameEn = org?.legalNameEnglish || org?.tradingNameEnglish || 'Saudi SaaS Enterprise';
  const companyNameAr = org?.legalNameArabic || org?.tradingNameArabic || 'شركة نعمان للتجارة والتقنية';
  const vatNumber = org?.vatNumber || '310998877600003';
  const crNumber = org?.commercialRegistrationNumber || '1010889922';

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      
      {/* Top Action Toolbar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-card/70 backdrop-blur-md p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLocation('/finance/quotations')}
            className="gap-2 text-xs py-2 px-3 font-semibold"
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t('Back to Quotations', 'العودة إلى عروض الأسعار')}
          </Button>
          <span className="text-muted-foreground/40 font-light">|</span>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <span className="font-mono font-bold text-foreground text-sm">{quotation.quotationNumber}</span>
            {getStatusBadge(quotation.status)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={handlePrint} 
            className="gap-2 text-xs py-2 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Printer size={16} />
            {t('Print / Save PDF', 'طباعة / حفظ PDF')}
          </Button>

          {quotation.status === 'DRAFT' && (
            <Button
              variant="primary"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('SENT')}
              className="gap-2 text-xs py-2 px-4 font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Send size={16} />
              {t('Mark as Sent', 'تحديد كمرسل')}
            </Button>
          )}

          {quotation.status === 'SENT' && (
            <>
              <Button
                variant="primary"
                disabled={updatingStatus}
                onClick={() => handleStatusChange('ACCEPTED')}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 font-bold shadow-md"
              >
                <CheckCircle2 size={16} />
                {t('Accept Quotation', 'قبول عرض السعر')}
              </Button>
              <Button
                variant="secondary"
                disabled={updatingStatus}
                onClick={() => handleStatusChange('DECLINED')}
                className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs py-2 px-4 font-semibold"
              >
                <XCircle size={16} />
                {t('Decline', 'رفض')}
              </Button>
            </>
          )}

          {quotation.status === 'ACCEPTED' && (
            <Button
              variant="primary"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('CONVERTED')}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-4 font-bold shadow-md"
            >
              <FileCheck size={16} />
              {t('Convert to Tax Invoice', 'تحويل إلى فاتورة ضريبية')}
            </Button>
          )}
        </div>
      </div>

      {/* Official Printable Executive Quotation Card */}
      <div className="print-document soft-card p-6 sm:p-10 bg-card border shadow-lg rounded-2xl space-y-8 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-6">
        
        {/* Document Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-6 gap-6 print:pb-4">
          
          {/* Left: Document Title & Meta */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold print:hidden">
                <FileText size={22} />
              </div>
              <div>
                <span className="eyebrow block text-[10px] tracking-widest text-primary font-bold">
                  {t('OFFICIAL QUOTATION & PRICE ESTIMATE', 'عرض سعر وتقدير تكلفة رسمي')}
                </span>
                <h1 className="text-3xl font-black tracking-tight text-foreground font-mono mt-0.5">
                  {quotation.quotationNumber}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <span>{t('Status:', 'الحالة:')}</span>
              {getStatusBadge(quotation.status)}
            </div>
          </div>

          {/* Right: Company Branding & ZATCA Registration */}
          <div className="text-left sm:text-right space-y-1">
            <div className="text-xl font-extrabold text-foreground tracking-tight">
              {companyNameEn}
            </div>
            {companyNameAr && (
              <div className="text-sm font-semibold text-primary arabic">
                {companyNameAr}
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-1 space-y-0.5 font-mono">
              <div>
                <span className="font-semibold text-foreground">{t('VAT / TRN:', 'الرقم الضريبي:')}</span> {vatNumber}
              </div>
              <div>
                <span className="font-semibold text-foreground">{t('CR No:', 'السجل التجاري:')}</span> {crNumber}
              </div>
              {org?.city && (
                <div className="text-[11px] text-muted-foreground">
                  {org.city}, Saudi Arabia
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Details Grid (Customer & Dates) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/40 p-5 rounded-xl border border-border/80 print:bg-slate-50 print:border-slate-300">
          
          {/* Customer / Billed To Info */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
              <Building2 size={15} />
              {t('BILLED TO / العميل', 'بيانات العميل')}
            </h4>
            <div className="font-extrabold text-foreground text-lg tracking-tight">
              {quotation.customerName || t('Al Rajhi Trading Co.', 'شركة الراجحي للتجارة')}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-muted-foreground shrink-0" />
                <span>Riyadh, Kingdom of Saudi Arabia</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash size={13} className="text-muted-foreground shrink-0" />
                <span>VAT #: 300123456700003</span>
              </div>
            </div>
          </div>

          {/* Quotation Dates & Terms Summary */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
              <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                <Calendar size={13} className="text-primary" />
                {t('Issue Date', 'تاريخ الإصدار')}
              </span>
              <span className="font-bold text-foreground text-sm font-mono">
                {new Date(quotation.issueDate).toLocaleDateString()}
              </span>
            </div>

            <div className="bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
              <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                <Clock size={13} className="text-amber-500" />
                {t('Valid Until', 'تاريخ الانتهاء')}
              </span>
              <span className="font-bold text-foreground text-sm font-mono">
                {quotation.validUntilDate ? new Date(quotation.validUntilDate).toLocaleDateString() : '-'}
              </span>
            </div>

            {quotation.terms && (
              <div className="col-span-2 bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
                <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                  <CreditCard size={13} className="text-primary" />
                  {t('Payment Terms', 'شروط الدفع')}
                </span>
                <span className="font-medium text-foreground">{quotation.terms}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items & Services Table */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
            <FileText size={15} />
            {t('ITEMS & SERVICES BREAKDOWN / المنتجات والخدمات', 'تفاصيل المنتجات والخدمات')}
          </h4>
          
          <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/60 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider print:bg-slate-100">
                <tr>
                  <th className="p-3.5 w-12 text-center border-r border-border/40">#</th>
                  <th className="p-3.5 border-r border-border/40">{t('Item & Description', 'المنتج / الوصف')}</th>
                  <th className="p-3.5 text-right w-20 border-r border-border/40">{t('Qty', 'الكمية')}</th>
                  <th className="p-3.5 text-right w-28 border-r border-border/40">{t('Unit Price', 'السعر')}</th>
                  <th className="p-3.5 text-right w-24 border-r border-border/40">{t('VAT Rate', 'الضريبة')}</th>
                  <th className="p-3.5 text-right w-28 border-r border-border/40">{t('VAT Amount', 'مبلغ الضريبة')}</th>
                  <th className="p-3.5 text-right w-36">{t('Total (Incl. VAT)', 'الإجمالي')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-slate-200">
                {quotation.items?.map((item, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 text-center text-muted-foreground font-mono text-xs border-r border-border/30">{idx + 1}</td>
                    <td className="p-3.5 font-medium border-r border-border/30">
                      <div className="text-foreground font-semibold">
                        {isRtl && item.descriptionAr ? item.descriptionAr : item.description}
                      </div>
                      {item.itemCode && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.itemCode}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono text-foreground border-r border-border/30">
                      {Number(item.quantity).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-foreground border-r border-border/30">
                      {Number(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs text-muted-foreground border-r border-border/30">
                      {Number(item.taxRate || 15)}%
                    </td>
                    <td className="p-3.5 text-right font-mono text-muted-foreground border-r border-border/30">
                      {Number(item.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-foreground">
                      {Number(item.lineTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans text-muted-foreground">SAR</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes Summary Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t border-border pt-6 print:pt-4 print:avoid-break">
          
          {/* Notes & Terms Box */}
          <div className="w-full md:w-1/2 space-y-4">
            {quotation.notes && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Notes for Customer', 'ملاحظات للعميل')}</h5>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap leading-relaxed print:bg-slate-50 print:border-slate-200">
                  {quotation.notes}
                </p>
              </div>
            )}
            
            {quotation.terms && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Terms & Conditions', 'الشروط والأحكام')}</h5>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap leading-relaxed print:bg-slate-50 print:border-slate-200">
                  {quotation.terms}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground/80">
              <ShieldCheck size={14} className="text-primary shrink-0" />
              <span>{t('All prices in Saudi Riyals (SAR). SOCPA Accounting Standard compliant.', 'جميع الأسعار بالريال السعودي. خاضعة لـمعايير الهيئة السعودية للمحاسبين.')}</span>
            </div>
          </div>

          {/* Financial Calculation Summary Card */}
          <div className="w-full md:w-80 bg-muted/40 p-5 rounded-2xl border border-border/80 space-y-3 print:bg-slate-50 print:border-slate-300">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('Subtotal (Excl. VAT)', 'المجموع (غير شامل الضريبة)')}</span>
              <span className="font-mono font-semibold text-foreground">
                {Number(quotation.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
              </span>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('15% VAT Tax Amount', 'ضريبة القيمة المضافة (15%)')}</span>
              <span className="font-mono font-semibold text-foreground">
                {Number(quotation.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
              </span>
            </div>

            <div className="border-t border-border/80 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-foreground">{t('Total Amount', 'المبلغ الإجمالي النهائي')}</span>
              <div className="text-right">
                <span className="font-mono text-xl font-black text-primary block">
                  {Number(quotation.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SAR (ر.س)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Authorized Signature Box & Verification Footnote */}
        <div className="hidden print:flex justify-between items-end border-t border-slate-300 pt-8 mt-12 print-avoid-break">
          <div className="text-xs text-slate-500 space-y-1">
            <div className="font-bold text-slate-800">{companyNameEn}</div>
            <div>Authorized Financial Quotation Document</div>
            <div className="text-[10px]">Generated via NEXUS ERP System · SOCPA & ZATCA Phase 2</div>
          </div>

          <div className="text-center w-56 space-y-12">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Authorized Signature & Stamp
            </div>
            <div className="border-b border-dashed border-slate-400 w-full"></div>
            <div className="text-[10px] text-slate-400">Date: ____ / ____ / 2026</div>
          </div>
        </div>

      </div>
    </div>
  );
}
