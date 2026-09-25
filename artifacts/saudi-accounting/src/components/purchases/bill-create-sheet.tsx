import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { getErrorMessage } from '@/lib/form-errors';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetSuppliers,
  getGetSuppliersQueryKey,
  useListCatalogItems,
  getListCatalogItemsQueryKey,
  useCreatePurchaseBill,
  useUpdatePurchaseBill
} from '@workspace/api-client-react';
import { X, Plus, Trash2, Building2, Calendar, FileText, DollarSign, Calculator } from 'lucide-react';
import { BillLineItemsTable } from './bill-line-items-table';

interface BillCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  billId?: string;
  initialBill?: any;
}

interface ItemRow {
  catalogItemId?: string;
  itemCode?: string;
  description: string;
  descriptionAr?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxCategory: 'STANDARD' | 'ZERO' | 'EXEMPT' | 'OUT_OF_SCOPE';
  taxRate: number;
}

export function BillCreateSheet({ open, onOpenChange, onSuccess, billId, initialBill }: BillCreateSheetProps) {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const supplierParams = { pageSize: 100 };
  const { data: suppliersData } = useGetSuppliers(orgId, supplierParams as any, { 
    query: { enabled: !!orgId && open, queryKey: getGetSuppliersQueryKey(orgId, supplierParams as any) } 
  });
  const suppliers = suppliersData?.items || [];

  const catalogParams = { pageSize: 100 };
  const { data: catalogData } = useListCatalogItems(orgId, catalogParams as any, { 
    query: { enabled: !!orgId && open, queryKey: getListCatalogItemsQueryKey(orgId, catalogParams as any) } 
  });
  const catalogItems = catalogData?.items || [];

  const createMutation = useCreatePurchaseBill();
  const updateMutation = useUpdatePurchaseBill();

  const [supplierId, setSupplierId] = useState('');
  const [supplierBillNumber, setSupplierBillNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { description: '', quantity: 1, unitPrice: 0, discountAmount: 0, taxCategory: 'STANDARD', taxRate: 15 }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initialBill) {
      setSupplierId(initialBill.supplierId || '');
      setSupplierBillNumber(initialBill.supplierBillNumber || '');
      setIssueDate(initialBill.issueDate ? new Date(initialBill.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setDueDate(initialBill.dueDate ? new Date(initialBill.dueDate).toISOString().split('T')[0] : '');
      setCurrency(initialBill.currency || 'SAR');
      setNotes(initialBill.notes || '');
      setItems((initialBill.items?.length ? initialBill.items : [{ description: '', quantity: 1, unitPrice: 0, discountAmount: 0, taxCategory: 'STANDARD', taxRate: 15 }]).map((it: any) => ({
        catalogItemId: it.catalogItemId || undefined,
        itemCode: it.itemCode || undefined,
        description: it.description || '',
        descriptionAr: it.descriptionAr || undefined,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discountAmount: Number(it.discountAmount) || 0,
        taxCategory: (it.taxCategory as any) || 'STANDARD',
        taxRate: Number(it.taxRate) || ((it.taxCategory || 'STANDARD') === 'STANDARD' ? 15 : 0),
      })) as ItemRow[]);
      return;
    }
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [open, initialBill, suppliers]);

  if (!open) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: 0, discountAmount: 0, taxCategory: 'STANDARD', taxRate: 15 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectCatalogItem = (index: number, itemId: string) => {
    const found = catalogItems.find(c => c.id === itemId);
    if (!found) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      catalogItemId: found.id,
      itemCode: found.code || undefined,
      description: found.name,
      descriptionAr: found.nameAr || undefined,
      unitPrice: parseFloat(found.purchasePrice || found.salesPrice) || 0,
      taxCategory: (found.taxCategory as any) || 'STANDARD',
      taxRate: found.taxCategory === 'STANDARD' ? 15 : 0
    };
    setItems(newItems);
  };


  // Compute live subtotal & VAT
  let subtotal = 0;
  let taxTotal = 0;

  items.forEach(it => {
    const lineSub = Math.max(0, (it.quantity || 0) * (it.unitPrice || 0) - (it.discountAmount || 0));
    const rate = it.taxCategory === 'STANDARD' ? 15 : 0;
    const lineTax = (lineSub * rate) / 100;
    subtotal += lineSub;
    taxTotal += lineTax;
  });

  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Supplier Selection: Mandatory
    if (!supplierId) {
      newErrors.supplierId = isRtl ? 'الرجاء اختيار المورد' : 'Please select a supplier';
    }

    // Bill / Reference Number: Required
    if (!supplierBillNumber.trim()) {
      newErrors.supplierBillNumber = isRtl ? 'رقم فاتورة المورد / المرجع مطلوب' : 'Vendor Bill / Reference Number is required';
    }

    // Line Items: At least 1 with qty > 0 and price > 0
    if (!items || items.length === 0) {
      newErrors.items = isRtl ? 'يرجى إضافة بند واحد على الأقل' : 'Please add at least one line item';
    } else {
      let itemHasError = false;
      items.forEach((it, idx) => {
        if (!it.description.trim()) {
          newErrors[`item_${idx}_desc`] = isRtl ? 'الوصف مطلوب' : 'Description is required';
          itemHasError = true;
        }
        if (!it.quantity || it.quantity <= 0) {
          newErrors[`item_${idx}_qty`] = isRtl ? 'الكمية يجب أن تكون أكبر من 0' : 'Quantity must be > 0';
          itemHasError = true;
        }
        if (!it.unitPrice || it.unitPrice <= 0) {
          newErrors[`item_${idx}_price`] = isRtl ? 'السعر يجب أن يكون أكبر من 0' : 'Price must be > 0';
          itemHasError = true;
        }
      });
      if (itemHasError && !newErrors.items) {
        newErrors.items = isRtl ? 'جميع البنود يجب أن تحتوي على كمية وسعر أكبر من 0.' : 'All items must have quantity and unit price greater than 0.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErr = Object.values(newErrors)[0];
      showAlert.error(isRtl ? 'خطأ في بيانات فاتورة الشراء' : 'Validation Error', firstErr);
      return;
    }

    try {
      const payload = {
        supplierId,
        supplierBillNumber: supplierBillNumber.trim(),
        issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        currency,
        notes: notes.trim() || undefined,
        items: items.map(it => ({
          catalogItemId: it.catalogItemId || undefined,
          itemCode: it.itemCode || undefined,
          description: it.description.trim(),
          descriptionAr: it.descriptionAr || undefined,
          quantity: String(it.quantity),
          unitPrice: String(it.unitPrice),
          discountAmount: String(it.discountAmount),
          taxCategory: it.taxCategory,
          taxRate: String(it.taxCategory === 'STANDARD' ? 15 : 0),
        }))
      };

      if (billId) {
        await updateMutation.mutateAsync({ organizationId: orgId, billId, data: payload });
      } else {
        await createMutation.mutateAsync({ organizationId: orgId, data: payload });
      }

      showAlert.toast(
        t('Purchase Bill Saved!', 'تم حفظ فاتورة المشتريات!'),
        'success'
      );

      onSuccess();
    } catch (err: any) {
      console.error(err);
      const msg = getErrorMessage(err, (isRtl ? 'فشل إنشاء فاتورة الشراء' : 'Failed to create purchase bill'));
      setErrors({ submit: msg });
      showAlert.error(t('Error', 'خطأ'), msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              {billId ? (isRtl ? 'تعديل فاتورة الشراء' : 'Edit Purchase Bill') : (isRtl ? 'إضافة فاتورة شراء جديدة' : 'Create Purchase Bill')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'تسجيل فاتورة من مورد وحساب ضريبة المدخلات' : 'Record vendor bill and calculate input VAT'}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
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

          {/* Supplier & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'المورد' : 'Supplier / Vendor'} <span className="text-red-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => { setSupplierId(e.target.value); if (errors.supplierId) setErrors(prev => ({ ...prev, supplierId: '' })); }}
                className={`w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border ${errors.supplierId ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100`}
              >
                <option value="">{isRtl ? 'اختر المورد' : 'Select Supplier'}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName} ({s.partyNumber || s.id.slice(0, 8)})
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.supplierId}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'رقم فاتورة المورد' : 'Vendor Bill Ref #'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierBillNumber}
                onChange={(e) => { setSupplierBillNumber(e.target.value); if (errors.supplierBillNumber) setErrors(prev => ({ ...prev, supplierBillNumber: '' })); }}
                placeholder={isRtl ? 'مثال: BILL-9901' : 'e.g. BILL-9901'}
                className={`w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border ${errors.supplierBillNumber ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100`}
              />
              {errors.supplierBillNumber && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.supplierBillNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'تاريخ الفاتورة' : 'Bill Date'}
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Line Items Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                {isRtl ? 'بنود الفاتورة' : 'Bill Items'} <span className="text-red-500">*</span>
              </h3>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddItem}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                {isRtl ? 'إضافة بند' : 'Add Item'}
              </Button>
            </div>

            {errors.items && <p className="text-xs font-semibold text-red-500">{errors.items}</p>}

            {/* Line Items Table */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border ${errors[`item_${idx}_desc`] || errors[`item_${idx}_qty`] || errors[`item_${idx}_price`] ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} space-y-3`}
                >
                  {/* Item catalog selection */}
                  {catalogItems.length > 0 && (
                    <div>
                      <select
                        onChange={(e) => handleSelectCatalogItem(idx, e.target.value)}
                        className="w-full py-1.5 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                      >
                        <option value="">{isRtl ? '-- اختيار من دليل المنتجات / الخدمات --' : '-- Select catalog item --'}</option>
                        {catalogItems.map(ci => (
                          <option key={ci.id} value={ci.id}>
                            {ci.code ? `[${ci.code}] ` : ''}{ci.name} ({ci.purchasePrice || ci.salesPrice} SAR)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder={isRtl ? 'الوصف (مثال: توريد أحبار طابعات) *' : 'Description (e.g. Printer Toner Supply) *'}
                        value={item.description}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].description = e.target.value;
                          setItems(copy);
                        }}
                        className={`w-full py-1.5 px-2.5 text-xs bg-white dark:bg-slate-900 border ${errors[`item_${idx}_desc`] ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-slate-100`}
                      />
                      {errors[`item_${idx}_desc`] && <p className="text-[10px] font-medium text-red-500">{errors[`item_${idx}_desc`]}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        placeholder={isRtl ? 'الكمية *' : 'Qty *'}
                        value={item.quantity}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].quantity = parseFloat(e.target.value) || 0;
                          setItems(copy);
                        }}
                        className={`w-full py-1.5 px-2.5 text-xs bg-white dark:bg-slate-900 border ${errors[`item_${idx}_qty`] ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-slate-100`}
                      />
                      {errors[`item_${idx}_qty`] && <p className="text-[10px] font-medium text-red-500">{errors[`item_${idx}_qty`]}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={isRtl ? 'السعر *' : 'Unit Price *'}
                        value={item.unitPrice}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setItems(copy);
                        }}
                        className={`w-full py-1.5 px-2.5 text-xs bg-white dark:bg-slate-900 border ${errors[`item_${idx}_price`] ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-slate-900 dark:text-slate-100`}
                      />
                      {errors[`item_${idx}_price`] && <p className="text-[10px] font-medium text-red-500">{errors[`item_${idx}_price`]}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        value={item.taxCategory}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].taxCategory = e.target.value as any;
                          copy[idx].taxRate = e.target.value === 'STANDARD' ? 15 : 0;
                          setItems(copy);
                        }}
                        className="w-full py-1.5 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      >
                        <option value="STANDARD">VAT 15%</option>
                        <option value="ZERO">VAT 0%</option>
                        <option value="EXEMPT">Exempt</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRtl ? 'ملاحظات الفاتورة' : 'Notes / Remarks'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRtl ? 'أدخل أي ملاحظات إضافية...' : 'Enter any notes...'}
              className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Totals Summary Box */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isRtl ? 'المبلغ الخاضع للضريبة (المجموع الفرعي):' : 'Subtotal (Net):'}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{subtotal.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{isRtl ? 'ضريبة القيمة المضافة المدخلات (15%):' : 'Input VAT (15%):'}</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{taxTotal.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-indigo-200 dark:border-indigo-800 text-base font-bold text-slate-900 dark:text-slate-100">
              <span>{isRtl ? 'الإجمالي النهائي شامل الضريبة:' : 'Grand Total (Incl. VAT):'}</span>
              <span className="text-indigo-600 dark:text-indigo-400">{grandTotal.toFixed(2)} SAR</span>
            </div>
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
                isRtl ? 'حفظ الفاتورة' : 'Save Bill'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
