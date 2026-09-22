import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListPurchaseBills,
  getListPurchaseBillsQueryKey
} from '@workspace/api-client-react';
import type { PurchaseBill } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { FileText, Plus, Search, Filter, Building2, Eye, ArrowRight, ArrowLeft } from 'lucide-react';
import { BillCreateSheet } from './bill-create-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';

interface BillsListProps {
  onSelectBill?: (id: string) => void;
}

export function BillsList({ onSelectBill }: BillsListProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [createOpen, setCreateOpen] = useState(() => {
    return new URLSearchParams(window.location.search).has('new');
  });

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    status: (statusFilter as any) || undefined,
  };

  const { data, isLoading, refetch } = useListPurchaseBills(orgId, queryParams as any, {
    query: { 
      enabled: !!orgId, 
      queryKey: getListPurchaseBillsQueryKey(orgId, queryParams as any) 
    }
  });

  const bills: PurchaseBill[] = data?.items || [];
  const totalItems = data?.total || 0;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Calculate local KPI summary metrics
  const summary = {
    total: totalItems,
    received: bills.filter(q => q.status === 'RECEIVED').length,
    paid: bills.filter(q => q.status === 'PAID').length,
    totalValue: bills.reduce((acc, q) => acc + (parseFloat(q.totalAmount) || 0), 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" /> {isRtl ? 'تم الاستلام' : 'Received'}</span>;
      case 'PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" /> {isRtl ? 'مدفوعة' : 'Paid'}</span>;
      case 'PARTIALLY_PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{isRtl ? 'مدفوعة جزئياً' : 'Partially Paid'}</span>;
      case 'OVERDUE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">{isRtl ? 'متأخرة' : 'Overdue'}</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{isRtl ? 'ملغاة' : 'Cancelled'}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{isRtl ? 'مسودة' : 'Draft'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {isRtl ? 'فواتير المشتريات' : 'Purchase Bills'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl 
              ? 'إدارة فواتير الموردين ومتابعة ضريبة المدخلات 15% واستردادها' 
              : 'Manage vendor bills, input VAT 15% recovery, and payment status'}
          </p>
        </div>

        <Button 
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {isRtl ? 'فاتورة شراء جديدة' : 'New Purchase Bill'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            {isRtl ? 'إجمالي الفواتير' : 'Total Bills'}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.total}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block mb-1">
            {isRtl ? 'مستلمة ومستحقة' : 'Received & Due'}
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.received}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block mb-1">
            {isRtl ? 'مدفوعة' : 'Paid Bills'}
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.paid}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 block mb-1">
            {isRtl ? 'القيمة الإجمالية (ر.س)' : 'Total Volume (SAR)'}
          </span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">SAR</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'البحث بالرقم أو اسم المورد...' : 'Search by bill number, vendor name...'}
            className="w-full pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="RECEIVED">{isRtl ? 'تم الاستلام' : 'Received'}</option>
              <option value="PAID">{isRtl ? 'مدفوعة' : 'Paid'}</option>
              <option value="PARTIALLY_PAID">{isRtl ? 'مدفوعة جزئياً' : 'Partially Paid'}</option>
              <option value="OVERDUE">{isRtl ? 'متأخرة' : 'Overdue'}</option>
              <option value="DRAFT">{isRtl ? 'مسودة' : 'Draft'}</option>
              <option value="CANCELLED">{isRtl ? 'ملغاة' : 'Cancelled'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Bills Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{isRtl ? 'جاري تحميل فواتير الشراء وحساب ضريبة المدخلات...' : 'Retrieving Purchase Bills & Input VAT...'}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {isRtl ? 'لا توجد فواتير شراء' : 'No purchase bills found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              {isRtl 
                ? 'لم يتم إضافة فواتير شراء بعد. أضف أول فاتورة لتتبع ضريبة المدخلات.' 
                : 'No purchase bills created yet. Add your first bill to track vendor expenses.'}
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isRtl ? 'إضافة فاتورة شراء' : 'Create Purchase Bill'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-slate-600 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'رقم الفاتورة' : 'Bill #'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'المورد' : 'Supplier / Vendor'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'رقم فاتورة المورد' : 'Ref #'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {bills.map((bill) => (
                  <tr 
                    key={bill.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => {
                      if (onSelectBill) onSelectBill(bill.id);
                      else setLocation(`/finance/bills/${bill.id}`);
                    }}
                  >
                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {bill.billNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div>{bill.supplierName || '—'}</div>
                          {bill.supplierVatNumber && (
                            <div className="text-xs text-slate-400">VAT: {bill.supplierVatNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {bill.supplierBillNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Date(bill.issueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {parseFloat(bill.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {bill.currency}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectBill) onSelectBill(bill.id);
                          else setLocation(`/finance/bills/${bill.id}`);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <Eye className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                        {isRtl ? 'عرض' : 'View'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl 
                ? `عرض الصفحة ${currentPage} من ${totalPages}` 
                : `Showing page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </Button>
              <Button
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>

          </div>
        )}
      </div>

      {/* Create Purchase Bill Sheet */}
      <BillCreateSheet 
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          refetch();
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
