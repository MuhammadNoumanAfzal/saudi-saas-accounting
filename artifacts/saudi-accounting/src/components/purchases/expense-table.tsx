import { useTranslation, Button } from '@/lib/utils';
import type { Expense } from '@workspace/api-client-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { RowActions } from '@/components/ui/row-actions';
import { 
  CreditCard, Plus, Tag, ArrowRight, ArrowLeft 
} from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  search: string;
  categoryFilter: string;
  page: number;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  onViewExpense?: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onCreateClick: () => void;
}

export function ExpenseTable({
  expenses,
  isLoading,
  search,
  categoryFilter,
  page,
  totalPages,
  totalItems,
  currentPage,
  onPageChange,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
  onCreateClick,
}: ExpenseTableProps) {
  const { t, isRtl } = useTranslation();

  const getCategoryLabel = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'RENT': return t('Rent', 'إيجار');
      case 'UTILITIES': return t('Utilities', 'مرافق ومنافع');
      case 'SALARIES': return t('Salaries & Wages', 'رواتب وأجور');
      case 'OFFICE_SUPPLIES': return t('Office Supplies', 'مستلزمات مكتبية');
      case 'TRAVEL': return t('Travel & Lodging', 'سفر وانتقالات');
      case 'MARKETING': return t('Marketing', 'تسويق وإعلان');
      default: return t('Other Expenses', 'مصروفات أخرى');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{t('Loading Operational Expenses & Input Tax Deduction...', 'جاري تحميل سجل المصروفات التشغيلية والخصم الضريبي...')}</span>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
          <CreditCard size={28} />
        </div>
        <h3 className="text-lg font-black mb-1">{t('No expense records found', 'لا توجد مصروفات مسجلة')}</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {search || categoryFilter 
            ? t('Try adjusting your search query or category filter options.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
            : t('Record daily operational costs (rent, utilities, supplies) to track profit & loss and tax deductions.', 'سجل مصروفات مؤسستك اليومية لتتبع الأرباح ومطالبة الزكاة والدخل بالضريبة.')}
        </p>
        {!search && !categoryFilter && (
          <Button className="btn-primary rounded-xl text-xs font-bold gap-2 cursor-pointer" onClick={onCreateClick}>
            <Plus size={16} /> {t('Record Expense', 'إضافة مصروف')}
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
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Ref #', 'رقم السند')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Category', 'التصنيف')}</th>
              <th className="px-5 py-3.5">{t('Payee / Description', 'الجهة / البيان')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Date', 'التاريخ')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('VAT (15%)', 'الضريبة (15%)')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Total Amount', 'المبلغ الإجمالي')}</th>
              <th className="px-5 py-3.5 w-24 text-center whitespace-nowrap">{t('Action', 'إجراء')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {expenses.map((expense: Expense) => (
              <tr key={expense.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-primary text-xs font-mono font-extrabold border border-border group-hover:border-primary/40 whitespace-nowrap">
                    {expense.expenseNumber}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-foreground border border-border whitespace-nowrap">
                    <Tag size={12} className="text-muted-foreground shrink-0" />
                    <span>{getCategoryLabel(expense.category)}</span>
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-foreground text-sm">
                  {expense.description}
                </td>
                <td className="px-5 py-4 text-muted-foreground font-semibold text-xs whitespace-nowrap">
                  {new Date(expense.expenseDate).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right rtl:text-left font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                  SAR {Number(expense.taxAmount).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-foreground text-sm whitespace-nowrap">
                  SAR {Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  <RowActions
                    onView={onViewExpense ? () => onViewExpense(expense) : undefined}
                    onEdit={onEditExpense ? () => onEditExpense(expense) : undefined}
                    onDelete={() => onDeleteExpense(expense.id)}
                    viewLabel={t('View Expense', 'عرض المصروف')}
                    editLabel={t('Edit Expense', 'تعديل المصروف')}
                    deleteLabel={t('Delete Expense', 'حذف المصروف')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="md:hidden divide-y divide-border">
        {expenses.map((expense: Expense) => (
          <div key={expense.id} className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-foreground text-sm truncate">{expense.description}</div>
                <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center flex-wrap">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary whitespace-nowrap">{expense.expenseNumber}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-foreground border border-border whitespace-nowrap">
                    <Tag size={10} className="shrink-0" />
                    <span>{getCategoryLabel(expense.category)}</span>
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <RowActions
                  onView={onViewExpense ? () => onViewExpense(expense) : undefined}
                  onEdit={onEditExpense ? () => onEditExpense(expense) : undefined}
                  onDelete={() => onDeleteExpense(expense.id)}
                  viewLabel={t('View', 'عرض')}
                  editLabel={t('Edit', 'تعديل')}
                  deleteLabel={t('Delete', 'حذف')}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2.5 border-t border-border/60">
              <div className="font-semibold text-muted-foreground">
                {t('Date:', 'التاريخ:')} <span className="text-foreground">{new Date(expense.expenseDate).toLocaleDateString()}</span>
              </div>
              <div className="font-mono font-black text-foreground text-sm tracking-tight text-right">
                SAR {Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
