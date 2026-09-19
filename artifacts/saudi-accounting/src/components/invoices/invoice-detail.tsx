import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useGetInvoice, 
  useUpdateInvoiceStatus,
  getGetInvoiceQueryKey,
  getListInvoicesQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Calendar, 
  CreditCard,
  ShieldCheck,
  Receipt
} from 'lucide-react';

export function InvoiceDetail({ id }: { id: string }) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const queryClient = useQueryClient();

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: invoice, isLoading, refetch } = useGetInvoice(orgId, id, {
    query: {
      enabled: !!orgId && !!id,
      queryKey: getGetInvoiceQueryKey(orgId, id),
    },
  });

  const { mutateAsync: updateStatus } = useUpdateInvoiceStatus();

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await updateStatus({
        organizationId: orgId,
        invoiceId: id,
        data: { status: newStatus as any }
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
    } catch (err: any) {
      alert(err?.message || 'Failed to update invoice status');
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
        <p>{t('Loading invoice details...', 'جاري تحميل تفاصيل الفاتورة...')}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center fade-up">
        <h2 className="text-xl font-bold text-foreground">{t('Invoice Not Found', 'الفاتورة غير موجودة')}</h2>
        <Button variant="secondary" className="mt-4 gap-2" onClick={() => setLocation('/finance/invoices')}>
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t('Back to Invoices', 'العودة لقائمة الفواتير')}
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
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={14} />
            {t('Issued', 'صادرة')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} />
            {t('Paid', 'مدفوعة')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle size={14} />
            {t('Overdue', 'متأخرة')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            <XCircle size={14} />
            {t('Cancelled', 'ملغاة')}
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
          onClick={() => setLocation('/finance/invoices')}
          className="gap-2 w-fit text-xs py-1.5 px-3"
        >
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t('Back to Invoices', 'العودة إلى الفواتير')}
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handlePrint} className="gap-2 text-xs py-1.5 px-3">
            <Printer size={16} />
            {t('Print / PDF', 'طباعة / PDF')}
          </Button>

          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <Button
              variant="primary"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('PAID')}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3"
            >
              <CheckCircle2 size={16} />
              {t('Mark as Paid', 'تسديد الفاتورة')}
            </Button>
          )}

          {invoice.status !== 'CANCELLED' && (
            <Button
              variant="secondary"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('CANCELLED')}
              className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs py-1.5 px-3"
            >
              <XCircle size={16} />
              {t('Cancel Invoice', 'إلغاء الفاتورة')}
            </Button>
          )}
        </div>
      </div>

      {/* Printable ZATCA Tax Invoice Card */}
      <div className="soft-card p-6 sm:p-8 bg-background border shadow-sm rounded-xl space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {invoice.invoiceNumber}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="mt-1 text-sm font-semibold text-primary flex items-center gap-1.5">
              <Receipt size={16} />
              {invoice.invoiceType === 'SIMPLIFIED'
                ? t('Simplified Tax Invoice / فاتورة ضريبية مبسطة', 'فاتورة ضريبية مبسطة / Simplified Tax Invoice')
                : t('Standard Tax Invoice / فاتورة ضريبية', 'فاتورة ضريبية / Standard Tax Invoice')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* ZATCA Phase 1 QR Code Component */}
            {invoice.zatcaQrCode && (
              <div className="p-2 bg-white rounded-lg border shadow-2xs flex flex-col items-center">
                <QRCodeSVG value={invoice.zatcaQrCode} size={96} level="M" />
                <span className="text-[9px] font-bold font-mono text-slate-500 mt-1 flex items-center gap-0.5">
                  <ShieldCheck size={10} className="text-emerald-600" /> ZATCA Phase 1
                </span>
              </div>
            )}

            <div className="text-left sm:text-right space-y-1">
              <div className="text-lg font-bold text-foreground">
                {t('KHANBAS NEXUS Store', 'متجر خانباس نيكسس')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('Seller TRN / الرقم الضريبي للمورد:', 'الرقم الضريبي للمورد:')} <span className="font-mono font-bold text-foreground">310000000000003</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border">
          {/* Customer Details */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-muted-foreground tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 size={14} />
              {t('Customer / Buyer Details', 'تفاصيل العميل / المشتري')}
            </h4>
            <div className="font-semibold text-foreground text-base">
              {invoice.customerName || t('Customer', 'عميل')}
            </div>
            {invoice.customerVatNumber && (
              <div className="text-xs text-muted-foreground mt-1">
                {t('Buyer TRN / الرقم الضريبي للعميل:', 'الرقم الضريبي للعميل:')} <span className="font-mono font-medium text-foreground">{invoice.customerVatNumber}</span>
              </div>
            )}
          </div>

          {/* Dates & Reference */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                <Calendar size={12} />
                {t('Issue Date', 'تاريخ الإصدار')}
              </span>
              <span className="font-semibold text-foreground">{new Date(invoice.issueDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                <Calendar size={12} />
                {t('Due Date', 'تاريخ الاستحقاق')}
              </span>
              <span className="font-semibold text-foreground">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
              </span>
            </div>
            {invoice.terms && (
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                  <CreditCard size={12} />
                  {t('Payment & Terms', 'الشروط والأحكام')}
                </span>
                <span className="font-semibold text-foreground">{invoice.terms}</span>
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
                {invoice.items?.map((item, idx: number) => (
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
            {invoice.notes && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t('Notes', 'ملاحظات')}</h5>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t('Terms & Conditions', 'الشروط والأحكام')}</h5>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border whitespace-pre-wrap">
                  {invoice.terms}
                </p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-80 bg-muted/30 p-4 rounded-lg border space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('Subtotal (Excl. VAT)', 'المجموع (غير شامل الضريبة)')}</span>
              <span className="font-mono font-medium text-foreground">
                {Number(invoice.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('SAR', 'ر.س')}
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('VAT (15%)', 'ضريبة القيمة المضافة (15%)')}</span>
              <span className="font-mono font-medium text-foreground">
                {Number(invoice.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('SAR', 'ر.س')}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-base font-bold text-foreground">
              <span>{t('Grand Total', 'المبلغ الإجمالي النهائي')}</span>
              <span className="font-mono text-primary text-lg">
                {Number(invoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('SAR', 'ر.س')}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
