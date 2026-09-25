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
import { 
  Search, Plus, ShieldCheck, RefreshCw, Sparkles, Tag, Calendar, DollarSign, FileText, Pencil
} from 'lucide-react';
import { ExpenseCreateSheet } from './expense-create-sheet';
import { ExpenseKpiCards } from './expense-kpi-cards';
import { ExpenseTable } from './expense-table';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ExpensesList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    category: categoryFilter || undefined,
  };

  // Optimized React Query config (10 mins staleTime for 0ms navigation latency)
  const { data, isLoading, refetch } = useListExpenses(orgId, queryParams as any, {
    query: { 
      enabled: Boolean(orgId), 
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
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

  const handleDelete = async (id: string) => {
    const confirmed = await showAlert.confirm(
      t('Delete Expense?', 'حذف المصروف؟'),
      t('Are you sure you want to delete this expense? This action cannot be undone.', 'هل أنت تأكد من رغبتك في حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.'),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );
    if (!confirmed) return;

    // Optimistically update React Query cache for 0ms instant UI removal
    const queryKey = getListExpensesQueryKey(orgId, queryParams as any);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.filter((item: any) => item.id !== id),
        total: Math.max(0, (oldData.total || 1) - 1),
      };
    });

    showAlert.toast(
      t('Expense Deleted Successfully!', 'تم حذف المصروف بنجاح!'),
      'success'
    );

    try {
      await deleteMutation.mutateAsync({
        organizationId: orgId,
        expenseId: id
      });
      queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey(orgId) });
    } catch (err: any) {
      console.error(err);
      queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey(orgId) });
      showAlert.error(t('Delete Failed', 'فشل الحذف'), getErrorMessage(err, t('Failed to delete expense.', 'تعذر حذف المصروف.')));
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Operational Expenditure', 'المصروفات التشغيلية')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> Input VAT 15% Eligible
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Operational Expenses', 'المصروفات التشغيلية')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Track daily operating costs (rent, utilities, supplies) and Input VAT recovery.', 'تتبع المصروفات اليومية (إيجارات، رواتب، مستلزمات) مع استرداد الضريبة.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Data', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-3.5 rounded-xl btn-primary shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Record Expense', 'تسجيل مصروف جديد')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Component */}
      <ExpenseKpiCards 
        totalCount={totalItems}
        totalSpent={totalSpent}
        totalVat={totalVat}
      />

      {/* Main Table Card with Search & Category Filter */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search by payee or reference...', 'البحث بالمستفيد أو المرجع...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex gap-2">
            <select className="field bg-background h-10 w-full sm:w-48 rounded-xl text-xs font-semibold cursor-pointer" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">{t('All Categories', 'جميع التصنيفات')}</option>
              <option value="RENT">{t('Rent', 'إيجار')}</option>
              <option value="UTILITIES">{t('Utilities', 'مرافق')}</option>
              <option value="SALARIES">{t('Salaries & Wages', 'رواتب وأجور')}</option>
              <option value="OFFICE_SUPPLIES">{t('Office Supplies', 'مستلزمات مكتبية')}</option>
              <option value="TRAVEL">{t('Travel & Lodging', 'سفر وانتقالات')}</option>
              <option value="MARKETING">{t('Marketing', 'تسويق وإعلان')}</option>
              <option value="OTHER">{t('Other Expenses', 'مصروفات أخرى')}</option>
            </select>
          </div>
        </div>

        {/* Expense Table Component */}
        <ExpenseTable 
          expenses={expenses}
          isLoading={isLoading}
          search={search}
          categoryFilter={categoryFilter}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={setPage}
          onViewExpense={setViewExpense}
          onEditExpense={setEditExpense}
          onDeleteExpense={handleDelete}
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      {/* Expense Create Sheet */}
      <ExpenseCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey(orgId) });
          refetch();
          setCreateOpen(false);
        }}
      />

      {/* Expense Edit Sheet */}
      <ExpenseCreateSheet
        open={Boolean(editExpense)}
        onOpenChange={(nextOpen) => { if (!nextOpen) setEditExpense(null); }}
        expenseId={editExpense?.id}
        initialExpense={editExpense}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey(orgId) });
          refetch();
          setEditExpense(null);
        }}
      />

      {/* Expense Details View Modal */}
      <Dialog open={Boolean(viewExpense)} onOpenChange={(open) => { if (!open) setViewExpense(null); }}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-card border border-border shadow-xl">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/10 text-primary font-mono font-extrabold text-xs border border-primary/20">
                {viewExpense?.expenseNumber}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck size={12} /> ZATCA 15% Eligible
              </span>
            </div>
            <DialogTitle className="text-xl font-black tracking-tight text-foreground mt-3">
              {t('Expense Details', 'تفاصيل المصروف')}
            </DialogTitle>
          </DialogHeader>

          {viewExpense && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('Payee / Description', 'الجهة / البيان')}
                </div>
                <div className="text-base font-extrabold text-foreground leading-snug">
                  {viewExpense.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mb-1">
                    <Tag size={12} className="text-primary" />
                    <span>{t('Category', 'التصنيف')}</span>
                  </div>
                  <div className="text-xs font-extrabold text-foreground">
                    {viewExpense.category}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mb-1">
                    <Calendar size={12} className="text-primary" />
                    <span>{t('Date', 'التاريخ')}</span>
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {new Date(viewExpense.expenseDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-card to-emerald-500/5 border border-primary/20 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">{t('Subtotal (excl. VAT)', 'المبلغ قبل الضريبة')}</span>
                  <span className="font-mono font-bold text-foreground">
                    SAR {(Number(viewExpense.amount) - Number(viewExpense.taxAmount)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t('VAT (15%)', 'ضريبة القيمة المضافة (15%)')}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    SAR {Number(viewExpense.taxAmount).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-center text-sm">
                  <span className="font-black text-foreground">{t('Total Amount', 'المبلغ الإجمالي')}</span>
                  <span className="font-mono font-black text-primary text-base">
                    SAR {Number(viewExpense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewExpense(null)}
                  className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
                >
                  {t('Close', 'إغلاق')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const exp = viewExpense;
                    setViewExpense(null);
                    setEditExpense(exp);
                  }}
                  className="btn-primary rounded-xl text-xs font-bold px-4 py-2 gap-1.5 cursor-pointer"
                >
                  <Pencil size={14} />
                  <span>{t('Edit Expense', 'تعديل المصروف')}</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
