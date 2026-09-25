import { useTranslation, Button } from '@/lib/utils';
import type { PurchaseBill } from '@workspace/api-client-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { RowActions } from '@/components/ui/row-actions';
import { 
  FileText, Plus, CheckCircle2, XCircle, Clock, Building2,
  ArrowRight, ArrowLeft 
} from 'lucide-react';

interface BillTableProps {
  bills: PurchaseBill[];
  isLoading: boolean;
  search: string;
  statusFilter: string;
  page: number;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  onSelectBill: (id: string) => void;
  onDeleteBill?: (id: string, number: string) => void;
  onCreateClick: () => void;
}

export function BillTable({
  bills,
  isLoading,
  search,
  statusFilter,
  page,
  totalPages,
  totalItems,
  currentPage,
  onPageChange,
  onSelectBill,
  onDeleteBill,
  onCreateClick,
}: BillTableProps) {
  const { t, isRtl } = useTranslation();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Clock size={12} />
            {t('Received', 'تم الاستلام')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 size={12} />
            {t('Paid', 'مدفوعة')}
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Clock size={12} />
            {t('Partially Paid', 'مدفوعة جزئياً')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle size={12} />
            {t('Overdue', 'متأخرة')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <XCircle size={12} />
            {t('Cancelled', 'ملغاة')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            <Clock size={12} />
            {t('Draft', 'مسودة')}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{t('Retrieving Purchase Bills & 15% Input VAT recovery data...', 'جاري تحميل فواتير الشراء وحساب ضريبة المدخلات...')}</span>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
          <FileText size={28} />
        </div>
        <h3 className="text-lg font-black mb-1">{t('No purchase bills found', 'لا توجد فواتير شراء')}</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {search || statusFilter 
            ? t('Try adjusting your search query or status filter options.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
            : t('No purchase bills created yet. Add your first bill to track vendor expenses and input VAT.', 'لم يتم إضافة فواتير شراء بعد. أضف أول فاتورة لمتابعة المصروفات والضريبة.')}
        </p>
        {!search && !statusFilter && (
          <Button className="btn-primary rounded-xl text-xs font-bold gap-2 cursor-pointer" onClick={onCreateClick}>
            <Plus size={16} /> {t('Create Purchase Bill', 'إضافة فاتورة شراء')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left rtl:text-right">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3.5">{t('Bill #', 'رقم الفاتورة')}</th>
              <th className="px-5 py-3.5">{t('Supplier / Vendor', 'المورد')}</th>
              <th className="px-5 py-3.5">{t('Ref #', 'رقم الفاتورة المرجعي')}</th>
              <th className="px-5 py-3.5">{t('Issue Date', 'تاريخ الإصدار')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left">{t('Total Amount', 'المبلغ الإجمالي')}</th>
              <th className="px-5 py-3.5">{t('Status', 'الحالة')}</th>
              <th className="px-5 py-3.5 w-24 text-center">{t('Action', 'إجراء')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {bills.map((bill: PurchaseBill) => (
              <tr 
                key={bill.id} 
                className="hover:bg-primary/5 transition-colors group cursor-pointer" 
                onClick={() => onSelectBill(bill.id)}
              >
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-primary text-xs font-mono font-extrabold border border-border group-hover:border-primary/40">
                    {bill.billNumber}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{bill.supplierName || '—'}</div>
                      {bill.supplierVatNumber && (
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">VAT: {bill.supplierVatNumber}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground font-mono font-semibold text-xs">
                  {bill.supplierBillNumber || '—'}
                </td>
                <td className="px-5 py-4 text-muted-foreground font-semibold text-xs">
                  {new Date(bill.issueDate).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-foreground text-sm">
                  SAR {Number(bill.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4">
                  {getStatusBadge(bill.status)}
                </td>
                <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                  <RowActions
                    onView={() => onSelectBill(bill.id)}
                    onDelete={onDeleteBill ? () => onDeleteBill(bill.id, bill.billNumber) : undefined}
                    viewLabel={t('View Bill', 'عرض الفاتورة')}
                    deleteLabel={t('Delete Bill', 'حذف الفاتورة')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="md:hidden divide-y divide-border">
        {bills.map((bill: PurchaseBill) => (
          <div 
            key={bill.id} 
            className="p-4 active:bg-primary/5 transition-colors cursor-pointer space-y-3 hover:bg-muted/20" 
            onClick={() => onSelectBill(bill.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-foreground text-sm truncate">{bill.supplierName || t('Supplier', 'مورد')}</div>
                <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center flex-wrap">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary">{bill.billNumber}</span>
                  {bill.supplierBillNumber && (
                    <span className="text-[11px] font-mono text-muted-foreground">Ref: {bill.supplierBillNumber}</span>
                  )}
                  {getStatusBadge(bill.status)}
                </div>
              </div>
              <div onClick={e => e.stopPropagation()} className="shrink-0">
                <RowActions
                  onView={() => onSelectBill(bill.id)}
                  onDelete={onDeleteBill ? () => onDeleteBill(bill.id, bill.billNumber) : undefined}
                  viewLabel={t('View', 'عرض')}
                  deleteLabel={t('Delete', 'حذف')}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2.5 border-t border-border/60">
              <div className="font-semibold text-muted-foreground">
                {t('Date:', 'التاريخ:')} <span className="text-foreground">{new Date(bill.issueDate).toLocaleDateString()}</span>
              </div>
              <div className="font-mono font-black text-foreground text-sm tracking-tight text-right">
                SAR {Number(bill.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {t('Page', 'صفحة')} {currentPage} {t('of', 'من')} {totalPages} ({totalItems} {t('items', 'عنصر')})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              {t('Previous', 'السابق')}
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              {t('Next', 'التالي')}
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
