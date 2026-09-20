import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetPurchaseBill,
  useUpdatePurchaseBillStatus,
  useDeletePurchaseBill,
  getGetPurchaseBillQueryKey,
  getListPurchaseBillsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, ArrowRight, Building2, Calendar, FileText, CheckCircle2, Clock, Trash2, Printer, ShieldCheck, ShoppingBag, MapPin, Hash, XCircle
} from 'lucide-react';

interface BillDetailProps {
  billId: string;
}

export function BillDetail({ billId }: BillDetailProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const org = session?.organizations?.find(o => o.organization.id === orgId)?.organization || session?.organizations?.[0]?.organization;

  const { data: bill, isLoading, refetch } = useGetPurchaseBill(orgId, billId, {
    query: {
      enabled: !!orgId && !!billId,
      queryKey: getGetPurchaseBillQueryKey(orgId, billId)
    }
  });

  const updateStatusMutation = useUpdatePurchaseBillStatus();
  const deleteMutation = useDeletePurchaseBill();

  const [updating, setUpdating] = useState(false);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground fade-up">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-2" />
        <p className="text-sm">{t('Loading bill details...', 'جاري تحميل تفاصيل الفاتورة...')}</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-12 text-center fade-up">
        <p className="text-lg font-bold text-foreground">{t('Bill not found', 'لم يتم العثور على الفاتورة')}</p>
        <Button variant="secondary" onClick={() => setLocation('/finance/bills')} className="mt-4 gap-2">
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t('Back to Bills', 'العودة لقائمة الفواتير')}
        </Button>
      </div>
    );
  }

  const handleStatusUpdate = async (status: 'PAID' | 'RECEIVED' | 'CANCELLED') => {
    const isPaid = status === 'PAID';
    const isCancelled = status === 'CANCELLED';

    const confirmTitle = isPaid 
      ? t('Mark Purchase Bill as Paid?', 'تسديد فاتورة المشتريات؟')
      : t('Cancel Purchase Bill?', 'إلغاء فاتورة المشتريات؟');

    const confirmMessage = isPaid
      ? t('This will record payment to the supplier and update accounts payable in your General Ledger.', 'سيتم تسجيل السداد للمورد وتحديث حسابات الموردين في الاستاد General Ledger.')
      : t('This will void the purchase bill and exclude input VAT from tax returns.', 'سيتم إلغاء الفاتورة واستبعاد ضريبة المدخلات من الإقرار الضريبي.');

    const confirmed = await showAlert.confirm(confirmMessage, confirmTitle);
    if (!confirmed) return;

    try {
      setUpdating(true);
      await updateStatusMutation.mutateAsync({
        organizationId: orgId,
        billId: bill.id,
        data: { status }
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: getListPurchaseBillsQueryKey(orgId) });
      
      if (isPaid) {
        showAlert.success(
          t('Bill Paid!', 'تم تسديد الفاتورة!'),
          t('Payment has been successfully recorded in Accounts Payable.', 'تم تسجيل عملية السداد للمورد بنجاح.')
        );
      } else if (isCancelled) {
        showAlert.success(
          t('Bill Cancelled', 'تم إلغاء الفاتورة'),
          t('Purchase bill has been voided.', 'تم إلغاء فاتورة المشتريات بنجاح.')
        );
      }
    } catch (err: any) {
      console.error(err);
      showAlert.error(t('Error', 'خطأ'), err.message || t('Status update failed', 'فشل تحديث حالة الفاتورة'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showAlert.confirm(
      t('Are you sure you want to delete this purchase bill?', 'هل أنت تأكد من حذف فاتورة الشراء هذه؟'),
      t('Delete Purchase Bill', 'حذف فاتورة المشتريات')
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync({
        organizationId: orgId,
        billId: bill.id
      });
      queryClient.invalidateQueries({ queryKey: getListPurchaseBillsQueryKey(orgId) });
      showAlert.toast(t('Purchase bill deleted.', 'تم حذف فاتورة المشتريات.'));
      setLocation('/finance/bills');
    } catch (err: any) {
      console.error(err);
      showAlert.error(t('Error', 'خطأ'), err.message || t('Delete failed', 'فشل عملية الحذف'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={14} />
            {t('Received', 'مستلمة')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} />
            {t('Paid', 'مدفوعة')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
            <XCircle size={14} />
            {t('Cancelled', 'ملغاة')}
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  const companyNameEn = org?.legalNameEnglish || org?.tradingNameEnglish || 'Nouman Trading & Technology Co.';
  const companyNameAr = org?.legalNameArabic || org?.tradingNameArabic || 'شركة نعمان للتجارة والتقنية';
  const vatNumber = org?.vatNumber || '310998877600003';
  const crNumber = org?.commercialRegistrationNumber || '1010889922';

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      
      {/* Top Header Bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-card/70 backdrop-blur-md p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLocation('/finance/bills')}
            className="gap-2 text-xs py-2 px-3 font-semibold"
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t('Back to Bills', 'العودة إلى الفواتير')}
          </Button>
          <span className="text-muted-foreground/40 font-light">|</span>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" />
            <span className="font-mono font-bold text-foreground text-sm">{bill.billNumber}</span>
            {getStatusBadge(bill.status)}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {bill.status !== 'PAID' && bill.status !== 'CANCELLED' && (
            <Button
              onClick={() => handleStatusUpdate('PAID')}
              disabled={updating}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 font-bold shadow-md"
            >
              <CheckCircle2 size={16} />
              {t('Mark as Paid', 'تعليم كـ مدفوعة')}
            </Button>
          )}

          {bill.status !== 'CANCELLED' && (
            <Button
              variant="secondary"
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={updating}
              className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs py-2 px-4 font-semibold"
            >
              <XCircle size={16} />
              {t('Cancel Bill', 'إلغاء الفاتورة')}
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="gap-2 text-xs py-2 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Printer size={16} />
            {t('Print / Save PDF', 'طباعة / حفظ PDF')}
          </Button>

          <Button
            variant="ghost"
            onClick={handleDelete}
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
            title={t('Delete Bill', 'حذف الفاتورة')}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Main Printed Purchase Voucher Layout */}
      <div className="print-document soft-card p-6 sm:p-10 bg-card border shadow-lg rounded-2xl space-y-8 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-6">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-6 gap-6 print:pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold print:hidden">
                <ShoppingBag size={22} />
              </div>
              <div>
                <span className="eyebrow block text-[10px] tracking-widest text-primary font-bold">
                  {t('OFFICIAL VENDOR PURCHASE BILL / فاتورة مشتريات', 'فاتورة مشتريات / OFFICIAL VENDOR PURCHASE BILL')}
                </span>
                <h1 className="text-3xl font-black tracking-tight text-foreground font-mono mt-0.5">
                  {bill.billNumber}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <span>{t('Status:', 'الحالة:')}</span>
              {getStatusBadge(bill.status)}
            </div>
          </div>

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
                <span className="font-semibold text-foreground">{t('Buyer TRN:', 'الرقم الضريبي للمنشأة:')}</span> {vatNumber}
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

        {/* Supplier Details & Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/40 p-5 rounded-xl border border-border/80 print:bg-slate-50 print:border-slate-300">
          
          {/* Supplier Details */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
              <Building2 size={15} />
              {t('SUPPLIER / VENDOR DETAILS', 'بيانات المورد')}
            </h4>
            <div className="font-extrabold text-foreground text-lg tracking-tight">
              {bill.supplierName || t('Saudi Technical Solutions', 'الحلول التقنية السعودية')}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {bill.supplierVatNumber && (
                <div className="flex items-center gap-1.5">
                  <Hash size={13} className="text-muted-foreground shrink-0" />
                  <span>
                    {t('Supplier VAT No:', 'الرقم الضريبي للمورد:')} <span className="font-mono font-bold text-foreground">{bill.supplierVatNumber}</span>
                  </span>
                </div>
              )}
              {bill.supplierBillNumber && (
                <div className="flex items-center gap-1.5">
                  <FileText size={13} className="text-muted-foreground shrink-0" />
                  <span>
                    {t('Vendor Bill Ref #:', 'رقم مرجع الفاتورة الأصلي:')} <span className="font-mono font-bold text-foreground">{bill.supplierBillNumber}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Dates Breakdown */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
              <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                <Calendar size={13} className="text-primary" />
                {t('Bill Date', 'تاريخ الفاتورة')}
              </span>
              <span className="font-bold text-foreground text-sm font-mono">
                {new Date(bill.issueDate).toLocaleDateString()}
              </span>
            </div>

            <div className="bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
              <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                <Calendar size={13} className="text-amber-500" />
                {t('Due Date', 'تاريخ الاستحقاق')}
              </span>
              <span className="font-bold text-foreground text-sm font-mono">
                {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
            <FileText size={15} />
            {t('ITEMS & SERVICES SUMMARY / بنود الفاتورة', 'تفاصيل بنود فاتورة الشراء')}
          </h4>
          
          <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/60 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider print:bg-slate-100">
                <tr>
                  <th className="p-3.5 w-12 text-center border-r border-border/40">#</th>
                  <th className="p-3.5 border-r border-border/40">{t('Description', 'الوصف')}</th>
                  <th className="p-3.5 text-right w-20 border-r border-border/40">{t('Qty', 'الكمية')}</th>
                  <th className="p-3.5 text-right w-28 border-r border-border/40">{t('Unit Price', 'السعر')}</th>
                  <th className="p-3.5 text-right w-24 border-r border-border/40">{t('Input VAT (15%)', 'ضريبة المدخلات')}</th>
                  <th className="p-3.5 text-right w-36">{t('Line Total', 'الإجمالي')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-slate-200">
                {bill.items?.map((item, idx: number) => (
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
                    <td className="p-3.5 text-right font-mono text-primary font-semibold border-r border-border/30">
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
          
          {/* Notes Box */}
          <div className="w-full md:w-1/2 space-y-4">
            {bill.notes && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Notes', 'ملاحظات')}</h5>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap leading-relaxed print:bg-slate-50 print:border-slate-200">
                  {bill.notes}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground/80">
              <ShieldCheck size={14} className="text-primary shrink-0" />
              <span>{t('Recoverable Input VAT recorded under Saudi ZATCA Tax Regulations.', 'ضريبة المدخلات مقيدة ومستردة وفق نظام هيئة الزكاة والضريبة والجمارك.')}</span>
            </div>
          </div>

          {/* Financial Calculation Summary Card */}
          <div className="w-full md:w-80 bg-muted/40 p-5 rounded-2xl border border-border/80 space-y-3 print:bg-slate-50 print:border-slate-300">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('Subtotal (Net)', 'المجموع الفرعي (صافي البنود)')}</span>
              <span className="font-mono font-semibold text-foreground">
                {Number(bill.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
              </span>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('Recoverable Input VAT (15%)', 'ضريبة المدخلات المستردة (15%)')}</span>
              <span className="font-mono font-semibold text-primary">
                {Number(bill.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
              </span>
            </div>

            <div className="border-t border-border/80 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-foreground">{t('Total Amount Due', 'المبلغ الإجمالي المستحق')}</span>
              <div className="text-right">
                <span className="font-mono text-xl font-black text-primary block">
                  {Number(bill.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            <div>Vendor Purchase Voucher & Input VAT Ledger Entry</div>
            <div className="text-[10px]">SOCPA General Ledger Compliant</div>
          </div>

          <div className="text-center w-56 space-y-12">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Approval & Stamp
            </div>
            <div className="border-b border-dashed border-slate-400 w-full"></div>
            <div className="text-[10px] text-slate-400">Date: ____ / ____ / 2026</div>
          </div>
        </div>

      </div>
    </div>
  );
}
