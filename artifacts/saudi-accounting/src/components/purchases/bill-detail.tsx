import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
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
  ArrowLeft, ArrowRight, Building2, Calendar, FileText, CheckCircle2, Clock, Trash2, Printer, ShieldCheck, DollarSign
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
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
        <p className="text-sm">{isRtl ? 'جاري تحميل تفاصيل الفاتورة...' : 'Loading bill details...'}</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        <p>{isRtl ? 'لم يتم العثور على الفاتورة' : 'Bill not found'}</p>
        <Button onClick={() => setLocation('/finance/bills')} className="mt-4">
          {isRtl ? 'العودة لقائمة الفواتير' : 'Back to Bills'}
        </Button>
      </div>
    );
  }

  const handleStatusUpdate = async (status: 'PAID' | 'RECEIVED' | 'CANCELLED') => {
    try {
      setUpdating(true);
      await updateStatusMutation.mutateAsync({
        organizationId: orgId,
        billId: bill.id,
        data: { status }
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: getListPurchaseBillsQueryKey(orgId) });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(isRtl ? 'هل أنت تأكد من حذف فاتورة الشراء هذه؟' : 'Are you sure you want to delete this bill?')) return;

    try {
      await deleteMutation.mutateAsync({
        organizationId: orgId,
        billId: bill.id
      });
      queryClient.invalidateQueries({ queryKey: getListPurchaseBillsQueryKey(orgId) });
      setLocation('/finance/bills');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLocation('/finance/bills')}
            className="p-2"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{bill.billNumber}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                {bill.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'تاريخ الفاتورة:' : 'Issued date:'} {new Date(bill.issueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {bill.status !== 'PAID' && (
            <Button
              onClick={() => handleStatusUpdate('PAID')}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              {isRtl ? 'تعليم كـ مدفوعة' : 'Mark as Paid'}
            </Button>
          )}

          {bill.status !== 'CANCELLED' && (
            <Button
              variant="secondary"
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={updating}
              className="text-xs text-slate-600 dark:text-slate-300"
            >
              {isRtl ? 'إلغاء الفاتورة' : 'Cancel Bill'}
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
            {isRtl ? 'طباعة' : 'Print'}
          </Button>

          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Printed Voucher Layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-8">
        {/* Bill Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              {isRtl ? 'معلومات المورد (الجهة الخاطبة)' : 'Supplier Details'}
            </span>
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{bill.supplierName || '—'}</h3>
                {bill.supplierVatNumber && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {isRtl ? 'الرقم الضريبي للمورد:' : 'Supplier VAT Number:'} <span className="font-mono font-medium">{bill.supplierVatNumber}</span>
                  </p>
                )}
                {bill.supplierBillNumber && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isRtl ? 'رقم الفاتورة الأصلي من المورد:' : 'Supplier Bill Ref #:'} <span className="font-medium">{bill.supplierBillNumber}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="md:text-right rtl:md:text-left space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              {isRtl ? 'ملخص مالي' : 'Financial Breakdown'}
            </span>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {parseFloat(bill.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {bill.currency}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl ? 'تاريخ الاستحقاق:' : 'Due Date:'} {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
            {isRtl ? 'بنود فاتورة الشراء' : 'Bill Items'}
          </h3>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{isRtl ? 'الوصف' : 'Description'}</th>
                  <th className="px-4 py-3 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'الخصم' : 'Discount'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'ضريبة المدخلات 15%' : 'Input VAT (15%)'}</th>
                  <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'الإجمالي' : 'Line Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {bill.items?.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 text-xs text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      <div>{item.description}</div>
                      {item.descriptionAr && <div className="text-xs text-slate-400">{item.descriptionAr}</div>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                      {parseFloat(item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono">
                      {parseFloat(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-slate-400">
                      {parseFloat(item.discountAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-indigo-600 dark:text-indigo-400">
                      {parseFloat(item.taxAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-slate-100">
                      {parseFloat(item.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Box */}
        <div className="flex justify-end pt-4">
          <div className="w-full md:w-80 space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isRtl ? 'المجموع الفرعي (صافي البنود):' : 'Subtotal (Net):'}</span>
              <span className="font-mono font-medium">{parseFloat(bill.subtotal).toFixed(2)} {bill.currency}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isRtl ? 'إجمالي ضريبة المدخلات المستردة (15%):' : 'Recoverable Input VAT (15%):'}</span>
              <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                {parseFloat(bill.taxAmount).toFixed(2)} {bill.currency}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-slate-100">
              <span>{isRtl ? 'المبلغ الإجمالي المستحق:' : 'Total Amount Due:'}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {parseFloat(bill.totalAmount).toFixed(2)} {bill.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {bill.notes && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              {isRtl ? 'ملاحظات' : 'Notes'}
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              {bill.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
