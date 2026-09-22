import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListExpenses,
  useDeleteExpense,
  getListExpensesQueryKey
} from '@workspace/api-client-react';
import type { Expense } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { CreditCard, Plus, Search, Filter, Tag, Trash2 } from 'lucide-react';
import { ExpenseCreateSheet } from './expense-create-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';

export function ExpensesList() {
  const { t, isRtl } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    category: categoryFilter || undefined,
  };

  const { data, isLoading, refetch } = useListExpenses(orgId, queryParams as any, {
    query: { 
      enabled: !!orgId, 
      queryKey: getListExpensesQueryKey(orgId, queryParams as any) 
    }
  });

  const deleteMutation = useDeleteExpense();

  const expenses: Expense[] = data?.items || [];
  const totalItems = data?.total || 0;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // KPI calculations
  const totalSpent = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  const totalVat = expenses.reduce((acc, e) => acc + (parseFloat(e.taxAmount) || 0), 0);

  const getCategoryLabel = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'RENT': return isRtl ? 'إيجار' : 'Rent';
      case 'UTILITIES': return isRtl ? 'مرافق ومنافع' : 'Utilities';
      case 'SALARIES': return isRtl ? 'رواتب وأجور' : 'Salaries & Wages';
      case 'OFFICE_SUPPLIES': return isRtl ? 'مستلزمات مكتبية' : 'Office Supplies';
      case 'TRAVEL': return isRtl ? 'سفر وانتقالات' : 'Travel & Lodging';
      case 'MARKETING': return isRtl ? 'تسويق وإعلان' : 'Marketing';
      default: return isRtl ? 'مصروفات أخرى' : 'Other Expenses';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRtl ? 'هل أنت تأكد من حذف هذا المصروف؟' : 'Are you sure you want to delete this expense?')) return;
    try {
      await deleteMutation.mutateAsync({
        organizationId: orgId,
        expenseId: id
      });
      refetch();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {isRtl ? 'المصروفات التشغيلية' : 'Operational Expenses'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl 
              ? 'تتبع المصروفات اليومية (إيجارات، رواتب، مستلزمات) مع استرداد الضريبة' 
              : 'Track daily operating costs (rent, utilities, supplies) and Input VAT'}
          </p>
        </div>

        <Button 
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {isRtl ? 'تسجيل مصروف جديد' : 'Record Expense'}
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            {isRtl ? 'عدد المصروفات المسجلة' : 'Total Expense Records'}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalItems}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 block mb-1">
            {isRtl ? 'إجمالي الإنفاق (ر.س)' : 'Total Spent (SAR)'}
          </span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">SAR</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block mb-1">
            {isRtl ? 'ضريبة القيمة المضافة المستردة' : 'Input VAT Recoverable'}
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal">SAR</span>
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
            placeholder={isRtl ? 'البحث بالمستفيد أو المرجع...' : 'Search by payee or reference...'}
            className="w-full pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
              <option value="RENT">{isRtl ? 'إيجار' : 'Rent'}</option>
              <option value="UTILITIES">{isRtl ? 'مرافق' : 'Utilities'}</option>
              <option value="SALARIES">{isRtl ? 'رواتب' : 'Salaries'}</option>
              <option value="OFFICE_SUPPLIES">{isRtl ? 'مستلزمات مكتبية' : 'Office Supplies'}</option>
              <option value="TRAVEL">{isRtl ? 'سفر وانتقالات' : 'Travel'}</option>
              <option value="MARKETING">{isRtl ? 'تسويق' : 'Marketing'}</option>
              <option value="OTHER">{isRtl ? 'أخرى' : 'Other'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{isRtl ? 'جاري تحميل سجل المصروفات التشغيلية والخصم الضريبي...' : 'Loading Operational Expenses & Input Tax Deduction...'}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {isRtl ? 'لا توجد مصروفات مسجلة' : 'No expense records found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              {isRtl 
                ? 'سجل مصروفات مؤسستك اليومية لتتبع الأرباح ومطالبة الزكاة والدخل بالضريبة.' 
                : 'Record daily operational costs to track profit & loss and tax deductions.'}
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {isRtl ? 'إضافة مصروف' : 'Record Expense'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-slate-600 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'رقم السند' : 'Ref #'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'التصنيف' : 'Category'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'الجهة / البيان' : 'Payee / Description'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'طريقة الدفع' : 'Payment'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                  <th scope="col" className="px-6 py-4 text-right rtl:text-left">{isRtl ? 'حذف' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {expense.expenseNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Tag className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0 text-slate-400" />
                        {getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(expense.expenseDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {expense.paymentMethod}
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-600 dark:text-indigo-400">
                      {parseFloat(expense.taxAmount).toFixed(2)} SAR
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {parseFloat(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(expense.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expense Create Modal */}
      <ExpenseCreateSheet
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
