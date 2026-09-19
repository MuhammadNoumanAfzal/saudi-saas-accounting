import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useGetQuotation, 
  useUpdateQuotationStatus,
  getGetQuotationQueryKey,
  getListQuotationsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
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
  CreditCard
} from 'lucide-react';

export function QuotationDetail({ id }: { id: string }) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const queryClient = useQueryClient();

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: quotation, isLoading, refetch } = useGetQuotation(orgId, id, {
    query: {
      enabled: !!orgId && !!id,
      queryKey: getGetQuotationQueryKey(orgId, id),
    },
  });

  const { mutateAsync: updateStatus } = useUpdateQuotationStatus();

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await updateStatus({
        organizationId: orgId,
        quotationId: id,
        data: { status: newStatus as any }
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey(orgId) });
    } catch (err: any) {
      alert(err?.message || 'Failed to update quotation status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground fade-up">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></div>
        <p>{t('Loading quotation details...', 'جاري تحميل تفاصيل عرض السعر...')}</p>
      </div>
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
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock size={14} />
            {t('Draft', 'مسودة')}
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={14} />
            {t('Sent', 'مرسل')}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} />
            {t('Accepted', 'مقبول')}
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle size={14} />
            {t('Declined', 'مرفوض')}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock size={14} />
            {t('Expired', 'منتهي')}
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <FileCheck size={14} />
            {t('Converted to Invoice', 'محوّل لفاتورة')}
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 fade-up pb-16">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Button
          variant="secondary"
          onClick={() => setLocation('/finance/quotations')}
          className="gap-2 w-fit text-xs py-1.5 px-3"
        >
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t('Back to Quotations', 'العودة إلى عروض الأسعار')}
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handlePrint} className="gap-2 text-xs py-1.5 px-3">
            <Printer size={16} />
            {t('Print / PDF', 'طباعة / PDF')}
          </Button>

          {quotation.status === 'DRAFT' && (
            <Button
              variant="primary"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('SENT')}
              className="gap-2 text-xs py-1.5 px-3"
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
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3"
              >
                <CheckCircle2 size={16} />
                {t('Accept Quotation', 'قبول عرض السعر')}
              </Button>
              <Button
                variant="secondary"
                disabled={updatingStatus}
                onClick={() => handleStatusChange('DECLINED')}
                className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs py-1.5 px-3"
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
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 px-3"
            >
              <FileCheck size={16} />
              {t('Convert to Tax Invoice', 'تحويل إلى فاتورة ضريبية')}
            </Button>
          )}
        </div>
      </div>

      {/* Printable Invoice-style Document Card */}
      <div className="soft-card p-6 sm:p-8 bg-background border shadow-sm rounded-xl space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {quotation.quotationNumber}
              </h1>
              {getStatusBadge(quotation.status)}
            </div>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {t('Sales Quotation & Price Estimate', 'عرض سعر وتقدير تكلفة')}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl font-bold text-primary">
              {t('KHANBAS NEXUS Store', 'متجر خانباس نيكسس')}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('VAT / TRN Registration #:', 'الرقم الضريبي:')} <span className="font-mono">310000000000003</span>
            </p>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border">
          {/* Customer Details */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 size={14} />
              {t('Customer Information', 'معلومات العميل')}
            </h4>
            <div className="font-semibold text-foreground text-base">
              {quotation.customerName || t('Customer', 'عميل')}
            </div>
          </div>

          {/* Dates & Reference */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                <Calendar size={12} />
                {t('Issue Date', 'تاريخ الإصدار')}
              </span>
              <span className="font-semibold text-foreground">{new Date(quotation.issueDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                <Calendar size={12} />
                {t('Valid Until', 'تاريخ الانتهاء')}
              </span>
              <span className="font-semibold text-foreground">
                {quotation.validUntilDate ? new Date(quotation.validUntilDate).toLocaleDateString() : '-'}
              </span>
            </div>
            {quotation.terms && (
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                  <CreditCard size={12} />
                  {t('Payment & Terms', 'الشروط والأحكام')}
                </span>
                <span className="font-semibold text-foreground">{quotation.terms}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-3">
            {t('Items & Services Summary', 'ملخص المنتجات والخدمات')}
          </h4>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">{t('Item Description', 'وصف المنتج / الخدمة')}</th>
                  <th className="p-3 text-right">{t('Qty', 'الكمية')}</th>
                  <th className="p-3 text-right">{t('Unit Price', 'سعر الوحدة')}</th>
                  <th className="p-3 text-right">{t('VAT Rate', 'نسبة الضريبة')}</th>
                  <th className="p-3 text-right">{t('VAT Amount', 'مبلغ الضريبة')}</th>
                  <th className="p-3 text-right">{t('Total (Incl. VAT)', 'الإجمالي شامل الضريبة')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotation.items?.map((item, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="p-3 text-center text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="p-3 font-medium">
                      <div className="text-foreground">{isRtl && item.descriptionAr ? item.descriptionAr : item.description}</div>
                      {item.itemCode && (
                        <div className="text-xs text-muted-foreground font-mono">{item.itemCode}</div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">
                      {Number(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                      {Number(item.taxRate || 15)}%
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {Number(item.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-foreground">
                      {Number(item.lineTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t pt-6">
          <div className="w-full sm:w-1/2 space-y-4">
            {quotation.notes && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t('Notes', 'ملاحظات')}</h5>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border whitespace-pre-wrap">
                  {quotation.notes}
                </p>
              </div>
            )}
            {quotation.terms && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t('Terms & Conditions', 'الشروط والأحكام')}</h5>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border whitespace-pre-wrap">
                  {quotation.terms}
                </p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-80 bg-muted/30 p-4 rounded-lg border space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('Subtotal (Excl. VAT)', 'المجموع (غير شامل الضريبة)')}</span>
              <span className="font-mono font-medium text-foreground">
                {Number(quotation.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('SAR', 'ر.س')}
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('VAT (15%)', 'ضريبة القيمة المضافة (15%)')}</span>
              <span className="font-mono font-medium text-foreground">
                {Number(quotation.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('SAR', 'ر.س')}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-base font-bold text-foreground">
              <span>{t('Grand Total', 'المبلغ الإجمالي النهائي')}</span>
              <span className="font-mono text-primary text-lg">
                {Number(quotation.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('SAR', 'ر.س')}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
