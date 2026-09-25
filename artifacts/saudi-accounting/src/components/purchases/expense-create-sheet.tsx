import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { getErrorMessage } from '@/lib/form-errors';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetSuppliers,
  getGetSuppliersQueryKey,
  useCreateExpense,
  customFetch
} from '@workspace/api-client-react';
import { X, CreditCard } from 'lucide-react';

interface ExpenseCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  expenseId?: string;
  initialExpense?: any;
}

export function ExpenseCreateSheet({ open, onOpenChange, onSuccess, expenseId, initialExpense }: ExpenseCreateSheetProps) {
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

  useEffect(() => {
    if (initialExpense) {
      setCategory(initialExpense.category || 'OFFICE_SUPPLIES');
      setDescription(initialExpense.description || initialExpense.payeeName || '');
      setSupplierId(initialExpense.supplierId || '');
      setAmount(initialExpense.amount ? String(initialExpense.amount) : '');
      setTaxAmount(initialExpense.taxAmount ? String(initialExpense.taxAmount) : '0.00');
      setHasVat(Boolean(initialExpense.taxAmount && Number(initialExpense.taxAmount) > 0));
      setPaymentMethod(initialExpense.paymentMethod || 'BANK_TRANSFER');
      setExpenseDate(initialExpense.expenseDate ? new Date(initialExpense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setReferenceNumber(initialExpense.referenceNumber || '');
      setNotes(initialExpense.notes || '');
    } else {
      setCategory('OFFICE_SUPPLIES');
      setDescription('');
      setSupplierId('');
      setAmount('');
      setTaxAmount('');
      setHasVat(true);
      setPaymentMethod('BANK_TRANSFER');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setReferenceNumber('');
      setNotes('');
    }
  }, [initialExpense, open]);

  // Auto-calculate 15% VAT when amount changes if hasVat is checked
  useEffect(() => {
    if (!initialExpense && hasVat && amount) {
      const total = parseFloat(amount) || 0;
      const calculatedVat = (total * 15) / 115;
      setTaxAmount(calculatedVat.toFixed(2));
    } else if (!hasVat) {
      setTaxAmount('0.00');
    }
  }, [amount, hasVat, initialExpense]);

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
      const payload = {
        category,
        description: description.trim(),
        supplierId: supplierId || undefined,
        amount,
        taxAmount: taxAmount || '0.00',
        paymentMethod,
        expenseDate: expenseDate ? new Date(expenseDate).toISOString() : undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (expenseId || initialExpense?.id) {
        const idToUpdate = expenseId || initialExpense.id;
        await customFetch(`/api/organizations/${orgId}/expenses/${idToUpdate}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        showAlert.toast(
          isRtl ? 'تم تحديث المصروف بنجاح!' : 'Expense Updated Successfully!',
          'success'
        );
      } else {
        await createMutation.mutateAsync({
          organizationId: orgId,
          data: payload
        });
        showAlert.toast(
          isRtl ? 'تم تسجيل المصروف بنجاح!' : 'Expense Recorded Successfully!',
          'success'
        );
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrors({ submit: getErrorMessage(err, (isRtl ? 'فشل حفظ المصروف' : 'Failed to save expense')) });
    }
  };

  const isEdit = Boolean(expenseId || initialExpense?.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-card text-card-foreground h-full shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {isEdit ? (isRtl ? 'تعديل المصروف التشغيلي' : 'Edit Operational Expense') : (isRtl ? 'تسجيل مصروف جديد' : 'Record Operational Expense')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRtl ? 'أدخل تفاصيل النفقة ومبلغ ضريبة القيمة المضافة' : 'Enter expense details and input VAT'}
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{isRtl ? 'الرجاء تصحيح الأخطاء المحددة:' : 'Please fix highlighted errors:'}</span>
              </div>
              {Object.entries(errors).map(([key, msg]) => (
                <div key={key} className="pl-4 rtl:pr-4">
                  • {msg}
                </div>
              ))}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {isRtl ? 'التصنيف *' : 'Category *'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field h-10 text-xs font-semibold cursor-pointer"
            >
              <option value="OFFICE_SUPPLIES">{isRtl ? 'مستلزمات مكتبية' : 'Office Supplies'}</option>
              <option value="RENT">{isRtl ? 'إيجار' : 'Rent'}</option>
              <option value="UTILITIES">{isRtl ? 'مرافق ومنافع (كهرباء، مياه، إنترنت)' : 'Utilities (Electricity, Water, Net)'}</option>
              <option value="SALARIES">{isRtl ? 'رواتب وأجور' : 'Salaries & Wages'}</option>
              <option value="TRAVEL">{isRtl ? 'سفر وانتقالات' : 'Travel & Lodging'}</option>
              <option value="MARKETING">{isRtl ? 'تسويق وإعلان' : 'Marketing & Ads'}</option>
              <option value="OTHER">{isRtl ? 'مصروفات تشغيلية أخرى' : 'Other Operational Expense'}</option>
            </select>
          </div>

          {/* Payee / Description */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {isRtl ? 'الجهة / اسم المستفيد / البيان *' : 'Payee / Description *'}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRtl ? 'مثال: إيجار المكتب الرئيسي / فاتورة الكهرباء' : 'e.g., Main Office Rent / Electricity Bill'}
              className="field h-10 text-xs font-semibold"
            />
          </div>

          {/* Link to Supplier (Optional) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {isRtl ? 'ربط بالمورد (اختياري)' : 'Link to Supplier (Optional)'}
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="field h-10 text-xs font-semibold cursor-pointer"
            >
              <option value="">{isRtl ? '-- غير مربوط بمورد --' : '-- No Supplier Link --'}</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.displayName} {s.vatNumber ? `(VAT: ${s.vatNumber})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amounts Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {isRtl ? 'المبلغ الإجمالي (ر.س) *' : 'Total Amount (SAR) *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="field h-10 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {isRtl ? 'مبلغ الضريبة (15%)' : 'Tax Amount (VAT)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxAmount}
                onChange={(e) => {
                  setTaxAmount(e.target.value);
                  setHasVat(true);
                }}
                placeholder="0.00"
                className="field h-10 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="hasVatCheck"
              checked={hasVat}
              onChange={(e) => setHasVat(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <label htmlFor="hasVatCheck" className="text-xs font-bold text-foreground cursor-pointer">
              {isRtl ? 'يتضمن استرداد ضريبة القيمة المضافة 15%' : 'Includes 15% Input VAT recovery'}
            </label>
          </div>

          {/* Payment Method & Expense Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {isRtl ? 'طريقة الدفع *' : 'Payment Method *'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="field h-10 text-xs font-semibold cursor-pointer"
              >
                <option value="BANK_TRANSFER">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="CASH">{isRtl ? 'نقداً' : 'Cash'}</option>
                <option value="CREDIT_CARD">{isRtl ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                <option value="CHEQUE">{isRtl ? 'شيك' : 'Cheque'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                {isRtl ? 'تاريخ المصروف *' : 'Expense Date *'}
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="field h-10 text-xs font-semibold cursor-pointer"
              />
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {isRtl ? 'رقم الإيصال / السند المرجعي' : 'Reference / Receipt #'}
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={isRtl ? 'رقم سند القبض أو الفاتورة الخارجية' : 'e.g., REC-88912'}
              className="field h-10 text-xs font-semibold font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              {isRtl ? 'ملاحظات إضافية' : 'Notes / Remarks'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRtl ? 'أي تفاصيل إضافية...' : 'Any additional comments...'}
              className="field text-xs font-medium p-3"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex gap-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl text-xs font-bold cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="flex-1 btn-primary rounded-xl text-xs font-bold cursor-pointer"
            >
              {isEdit ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'تسجيل المصروف' : 'Record Expense')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
