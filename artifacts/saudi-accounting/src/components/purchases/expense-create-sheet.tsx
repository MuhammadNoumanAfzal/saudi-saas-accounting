import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { getErrorMessage } from '@/lib/form-errors';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetSuppliers,
  getGetSuppliersQueryKey,
  useCreateExpense
} from '@workspace/api-client-react';
import { X, CreditCard, Calendar, FileText, Building2, Tag, DollarSign } from 'lucide-react';

interface ExpenseCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExpenseCreateSheet({ open, onOpenChange, onSuccess }: ExpenseCreateSheetProps) {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const supplierParams = { pageSize: 100 };
  const { data: suppliersData } = useGetSuppliers(orgId, supplierParams as any, { 
    query: { enabled: !!orgId && open, queryKey: getGetSuppliersQueryKey(orgId, supplierParams as any) } 
  });
  const suppliers = suppliersData?.items || [];


  const createMutation = useCreateExpense();

  const [category, setCategory] = useState('OFFICE_SUPPLIES');
  const [description, setDescription] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [hasVat, setHasVat] = useState(true);
  const [taxAmount, setTaxAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate 15% VAT when amount changes if hasVat is checked
  useEffect(() => {
    if (hasVat && amount) {
      const total = parseFloat(amount) || 0;
      // Tax included inside total: tax = total * 15 / 115
      const calculatedVat = (total * 15) / 115;
      setTaxAmount(calculatedVat.toFixed(2));
    } else if (!hasVat) {
      setTaxAmount('0.00');
    }
  }, [amount, hasVat]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = isRtl ? 'الرجاء اختيار تصنيف المصروف' : 'Expense category is required';
    }

    if (!description.trim()) {
      newErrors.description = isRtl ? 'البيان / اسم المستفيد مطلوب' : 'Payee / Description is required';
    } else if (description.trim().length < 3) {
      newErrors.description = isRtl ? 'البيان / اسم المستفيد يجب أن يتكون من 3 أحرف على الأقل' : 'Payee / Description must be at least 3 characters';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = isRtl ? 'المبلغ الإجمالي يجب أن يكون أكبر من 0.00' : 'Total amount must be greater than 0.00';
    }

    if (!expenseDate) {
      newErrors.expenseDate = isRtl ? 'تاريخ المصروف مطلوب' : 'Expense date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErr = Object.values(newErrors)[0];
      showAlert.error(isRtl ? 'خطأ في بيانات المصروف' : 'Validation Error', firstErr);
      return;
    }

    try {
      await createMutation.mutateAsync({
        organizationId: orgId,
        data: {
          category,
          description: description.trim(),
          supplierId: supplierId || undefined,
          amount,
          taxAmount: taxAmount || '0.00',
          paymentMethod,
          expenseDate: expenseDate ? new Date(expenseDate).toISOString() : undefined,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        }
      });

      showAlert.toast(
        isRtl ? 'تم تسجيل المصروف بنجاح!' : 'Expense Recorded Successfully!',
        'success'
      );
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrors({ submit: getErrorMessage(err, (isRtl ? 'فشل تسجيل المصروف' : 'Failed to record expense')) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              {isRtl ? 'تسجيل مصروف جديد' : 'Record Operational Expense'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'أدخل تفاصيل النفقة ومبلغ ضريبة القيمة المضافة' : 'Enter expense details and input VAT'}
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold space-y-1">
              <div className="font-bold">⚠️ {isRtl ? 'يرجى تصحيح الأخطاء التالية:' : 'Please fix highlighted errors:'}</div>
              <ul className="list-disc list-inside font-normal">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRtl ? 'التصنيف' : 'Category'} <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors(prev => ({ ...prev, category: '' })); }}
              className={`w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border ${errors.category ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-slate-100`}
            >
              <option value="RENT">{isRtl ? 'إيجار المكاتب / العقارات' : 'Office Rent'}</option>
              <option value="UTILITIES">{isRtl ? 'مرافق (كهرباء، ماء، إنترنت)' : 'Utilities (Electricity, Internet)'}</option>
              <option value="SALARIES">{isRtl ? 'رواتب وأجور ومستحقات' : 'Salaries & Wages'}</option>
              <option value="OFFICE_SUPPLIES">{isRtl ? 'مستلزمات وأدوات مكتبية' : 'Office Supplies'}</option>
              <option value="TRAVEL">{isRtl ? 'سفر وانتقالات وضيافة' : 'Travel & Lodging'}</option>
              <option value="MARKETING">{isRtl ? 'تسويق وإعلان وشبكات' : 'Marketing & Ads'}</option>
              <option value="OTHER">{isRtl ? 'مصروفات متنوعة أخرى' : 'Other General Expense'}</option>
            </select>
            {errors.category && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRtl ? 'البيان / المستفيد' : 'Payee / Description'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors(prev => ({ ...prev, description: '' })); }}
              placeholder={isRtl ? 'مثال: سداد فاتورة كهرباء الفرع' : 'e.g. Electricity Bill Payment'}
              className={`w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border ${errors.description ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-slate-100`}
            />
            {errors.description && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.description}</p>}
          </div>

          {suppliers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'ربط بمورد (اختياري)' : 'Link to Supplier (Optional)'}
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRtl ? '-- بدون ربط بالمورد --' : '-- No supplier link --'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'المبلغ الإجمالي (ر.س)' : 'Total Amount (SAR)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors(prev => ({ ...prev, amount: '' })); }}
                placeholder="0.00"
                className={`w-full py-2 px-3 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border ${errors.amount ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-slate-100`}
              />
              {errors.amount && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'مبلغ الضريبة 15%' : 'Tax Amount (VAT)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="0.00"
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="vatIncludedCheck"
              checked={hasVat}
              onChange={(e) => setHasVat(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="vatIncludedCheck" className="text-xs text-slate-600 dark:text-slate-400">
              {isRtl ? 'يشمل ضريبة القيمة المضافة (15% مدخلات)' : 'Includes 15% Input VAT recovery'}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'طريقة السداد' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="BANK_TRANSFER">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="CASH">{isRtl ? 'نقداً (كاش)' : 'Cash'}</option>
                <option value="CREDIT_CARD">{isRtl ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                <option value="CHECK">{isRtl ? 'شيك' : 'Check'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'تاريخ المصروف' : 'Expense Date'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => { setExpenseDate(e.target.value); if (errors.expenseDate) setErrors(prev => ({ ...prev, expenseDate: '' })); }}
                className={`w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border ${errors.expenseDate ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-slate-100`}
              />
              {errors.expenseDate && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.expenseDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRtl ? 'الرقم المرجعي (السند / الشيك)' : 'Reference / Receipt #'}
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={isRtl ? 'مثال: TRF-887192' : 'e.g. TRF-887192'}
              className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRtl ? 'ملاحظات' : 'Notes'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Footer Submit Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-32"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isRtl ? 'تسجيل المصروف' : 'Record Expense'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
