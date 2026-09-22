import { useState, useEffect } from 'react';
import {
  useCreateInvoice,
  useUpdateInvoice,
  useFindParties,
  getFindPartiesQueryKey,
  useListCatalogItems,
  getListCatalogItemsQueryKey,
  getGetInvoiceQueryKey,
  getListInvoicesQueryKey,
  useGetCurrentSession,
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { useTranslation, Button } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Plus, Trash2, Receipt, Calculator, User, Calendar, Tag, Percent, ShieldCheck } from 'lucide-react';
import { showAlert } from '@/lib/alerts';
import type { InvoiceInput, InvoiceItemInput } from '@workspace/api-client-react';
import { InvoiceTaxSummary } from './invoice-tax-summary';

export interface InvoiceCreateSheetProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  invoiceId?: string;
  initialData?: any;
  onSuccess?: () => void;
}

export function InvoiceCreateSheet({
  open,
  onClose,
  onOpenChange,
  invoiceId,
  initialData,
  onSuccess,
}: InvoiceCreateSheetProps) {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (onClose) onClose();
      if (onOpenChange) onOpenChange(false);
    } else {
      if (onOpenChange) onOpenChange(true);
    }
  };

  const { data: customers } = useFindParties(orgId, { q: '' }, {
    query: { enabled: !!orgId, queryKey: getFindPartiesQueryKey(orgId, { q: '' }), staleTime: 5 * 60 * 1000 }
  });

  const { data: catalogData } = useListCatalogItems(orgId, { pageSize: 100, status: 'ACTIVE' }, {
    query: { enabled: !!orgId, queryKey: getListCatalogItemsQueryKey(orgId, { pageSize: 100, status: 'ACTIVE' }), staleTime: 5 * 60 * 1000 }
  });

  const [invoiceType, setInvoiceType] = useState<'STANDARD' | 'SIMPLIFIED'>('STANDARD');
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(
    t('Payment due within 15 days. 15% Standard VAT included.', 'الدفع مستحق خلال 15 يوماً. تشمل ضريبة القيمة المضافة 15٪.')
  );

  const [items, setItems] = useState<InvoiceItemInput[]>([
    {
      description: '',
      descriptionAr: '',
      quantity: '1.0000',
      unitPrice: '0.00',
      discountAmount: '0.00',
      taxCategory: 'STANDARD',
      taxRate: '15.00',
    },
  ]);

  useEffect(() => {
    if (initialData) {
      setInvoiceType(initialData.invoiceType || 'STANDARD');
      setCustomerId(initialData.customerId || '');
      setIssueDate(initialData.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setNotes(initialData.notes || '');
      setTerms(initialData.terms || '');
      if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items);
      }
    }
  }, [initialData]);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        descriptionAr: '',
        quantity: '1.0000',
        unitPrice: '0.00',
        discountAmount: '0.00',
        taxCategory: 'STANDARD',
        taxRate: '15.00',
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof InvoiceItemInput, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'taxCategory') {
        if (value === 'ZERO' || value === 'EXEMPT' || value === 'OUT_OF_SCOPE') {
          copy[index].taxRate = '0.00';
        } else {
          copy[index].taxRate = '15.00';
        }
      }
      return copy;
    });
  };

  const selectCatalogItem = (index: number, catalogItemId: string) => {
    if (!catalogItemId) return;
    const selected = catalogData?.items?.find((c) => c.id === catalogItemId);
    if (!selected) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        catalogItemId: selected.id,
        itemCode: selected.code,
        description: selected.name,
        descriptionAr: selected.nameAr || selected.name,
        unitPrice: String(selected.salesPrice || '0.00'),
        taxCategory: (selected.taxCategory as any) || 'STANDARD',
        taxRate: String(selected.taxRate || '15.00'),
      };
      return copy;
    });
  };

  // Live Totals Calculation
  let subtotal = 0;
  let taxAmount = 0;
  let totalAmount = 0;

  items.forEach((it) => {
    const qty = parseFloat(it.quantity || '1') || 0;
    const price = parseFloat(it.unitPrice || '0') || 0;
    const disc = parseFloat(it.discountAmount || '0') || 0;
    const rate =
      it.taxCategory === 'ZERO' || it.taxCategory === 'EXEMPT' || it.taxCategory === 'OUT_OF_SCOPE'
        ? 0
        : parseFloat(it.taxRate || '15') || 15;
    const lineSub = Math.max(0, qty * price - disc);
    const lineTax = (lineSub * rate) / 100;

    subtotal += lineSub;
    taxAmount += lineTax;
  });

  totalAmount = subtotal + taxAmount;

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Customer Selection: Mandatory
    if (!customerId) {
      newErrors.customerId = t('Please select a customer', 'يرجى اختيار العميل');
    }

    // Issue Date & Due Date: Mandatory
    if (!issueDate) {
      newErrors.issueDate = t('Issue date is required', 'تاريخ الإصدار مطلوب');
    }
    if (!dueDate) {
      newErrors.dueDate = t('Due date is required', 'تاريخ الاستحقاق مطلوب');
    } else if (issueDate && new Date(dueDate) < new Date(issueDate)) {
      newErrors.dueDate = t('Due date cannot be before issue date', 'تاريخ الاستحقاق لا يمكن أن يكون قبل تاريخ الإصدار');
    }

    // Line Items Validation: Must have at least 1 line item
    if (!items || items.length === 0) {
      const msg = t('Please add at least one line item to issue invoice.', 'يرجى إضافة بند واحد على الأقل لإصدار الفاتورة.');
      newErrors.items = msg;
      showAlert.error(t('Missing Line Items', 'لا توجد بنود'), msg);
    } else {
      let itemHasError = false;
      items.forEach((it, idx) => {
        if (!it.description.trim()) {
          newErrors[`item_${idx}_desc`] = t('Description is required', 'الوصف مطلوب');
          itemHasError = true;
        }
        const qty = parseFloat(it.quantity || '0');
        if (isNaN(qty) || qty <= 0) {
          newErrors[`item_${idx}_qty`] = t('Quantity must be > 0', 'الكمية يجب أن تكون أكبر من 0');
          itemHasError = true;
        }
        const price = parseFloat(it.unitPrice || '0');
        if (isNaN(price) || price <= 0) {
          newErrors[`item_${idx}_price`] = t('Unit price must be > 0', 'سعر الوحدة يجب أن يكون أكبر من 0');
          itemHasError = true;
        }
      });
      if (itemHasError && !newErrors.items) {
        newErrors.items = t('Line item quantity and unit price must be greater than 0.', 'الكمية وسعر الوحدة لبنود الفاتورة يجب أن تكون أكبر من 0.');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: InvoiceInput = {
      invoiceType,
      customerId,
      issueDate: issueDate ? new Date(issueDate).toISOString() : new Date().toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      currency: 'SAR',
      notes: notes || null,
      terms: terms || null,
      items: items.map((it) => ({
        ...it,
        quantity: String(parseFloat(it.quantity || '1') || 1),
        unitPrice: String(parseFloat(it.unitPrice || '0') || 0),
        discountAmount: String(parseFloat(it.discountAmount || '0') || 0),
        taxRate:
          it.taxCategory === 'ZERO' || it.taxCategory === 'EXEMPT' || it.taxCategory === 'OUT_OF_SCOPE'
            ? '0.00'
            : '15.00',
      })),
    };

    if (invoiceId) {
      updateMutation.mutate(
        { organizationId: orgId, invoiceId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
            queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(orgId, invoiceId) });
            showAlert.toast(
              isRtl ? 'تم تحديث الفاتورة الضريبية!' : 'Invoice Updated Successfully!',
              'success'
            );
            handleOpenChange(false);
            if (onSuccess) onSuccess();
          },
        }
      );
    } else {
      createMutation.mutate(
        { organizationId: orgId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
            showAlert.toast(
              isRtl ? 'تم إصدار الفاتورة الضريبية بنجاح!' : 'Invoice Issued Successfully!',
              'success'
            );
            handleOpenChange(false);
            if (onSuccess) onSuccess();
          },
        }
      );
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isRtl ? 'left' : 'right'}
        className="w-full sm:max-w-3xl sm:w-[780px] p-0 flex flex-col h-full bg-background border-s shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border bg-muted/20 text-left sm:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Receipt size={22} />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>{invoiceId ? t('Edit Tax Invoice', 'تعديل الفاتورة الضريبية') : t('New Tax Invoice', 'فاتورة ضريبية جديدة')}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck size={12} /> ZATCA Phase 1
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'Create a ZATCA-compliant Tax Invoice with automatic Base64 TLV QR Code generation.',
                  'إنشاء فاتورة ضريبية معتمدة ومطابقة لمتطلبات هيئة الزكاة والضريبة والجمارك مع رمز الاستجابة السريع.'
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-500/20 flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1.5">
                ⚠️ {t('Please fix the following validation errors:', 'يرجى تصحيح أخطاء التحقق التالية:')}
              </span>
              <ul className="list-disc list-inside space-y-0.5 ps-2 font-normal">
                {Object.values(errors).filter((v, i, a) => a.indexOf(v) === i).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Invoice Type & Customer Selector Card */}
          <div className="p-4 rounded-xl bg-card border border-border/80 shadow-2xs space-y-4">
            
            {/* Invoice Type Selector */}
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">{t('Invoice Type', 'نوع الفاتورة')} <span className="text-red-500">*</span></span>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border text-xs">
                <button
                  type="button"
                  onClick={() => setInvoiceType('STANDARD')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    invoiceType === 'STANDARD' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('Standard Tax Invoice (B2B)', 'فاتورة ضريبية (شركات)')}
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceType('SIMPLIFIED')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    invoiceType === 'SIMPLIFIED' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('Simplified Invoice (B2C)', 'فاتورة مبسطة (أفراد)')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Customer Selector */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <User size={12} className="text-primary" />
                  {t('Customer', 'العميل')} <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2 bg-background border ${errors.customerId ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  value={customerId}
                  onChange={(e) => { setCustomerId(e.target.value); if (errors.customerId) setErrors(prev => ({ ...prev, customerId: '' })); }}
                >
                  <option value="">-- {t('Select Customer', 'اختر العميل')} --</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
                {errors.customerId && <p className="text-[11px] font-medium text-red-500">{errors.customerId}</p>}
              </div>

              {/* Issue Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} className="text-primary" />
                  {t('Issue Date', 'تاريخ الإصدار')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 bg-background border ${errors.issueDate ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  value={issueDate}
                  onChange={(e) => { setIssueDate(e.target.value); if (errors.issueDate) setErrors(prev => ({ ...prev, issueDate: '' })); }}
                />
                {errors.issueDate && <p className="text-[11px] font-medium text-red-500">{errors.issueDate}</p>}
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} className="text-primary" />
                  {t('Due Date', 'تاريخ الاستحقاق')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 bg-background border ${errors.dueDate ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: '' })); }}
                />
                {errors.dueDate && <p className="text-[11px] font-medium text-red-500">{errors.dueDate}</p>}
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Calculator size={16} className="text-primary" />
                <span>{t('Line Items & Services', 'بنود الفاتورة والخدمات')} <span className="text-red-500">*</span></span>
              </h3>
              <Button type="button" variant="secondary" onClick={addItemRow} className="gap-1.5 text-xs py-1.5 px-3">
                <Plus size={14} />
                <span>{t('Add Line Item', 'إضافة بند')}</span>
              </Button>
            </div>

            {errors.items && <p className="text-xs font-semibold text-red-500">{errors.items}</p>}

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${errors[`item_${idx}_desc`] || errors[`item_${idx}_qty`] || errors[`item_${idx}_price`] ? 'border-red-500 bg-red-500/5' : 'border-border/80 bg-card'} shadow-2xs space-y-3 relative group`}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    
                    {/* Catalog Item Quick Selector */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Tag size={10} />
                        {t('Catalog Item (Optional)', 'المنتج / الخدمة')}
                      </label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={item.catalogItemId || ''}
                        onChange={(e) => selectCatalogItem(idx, e.target.value)}
                      >
                        <option value="">-- {t('Custom Item', 'بند مخصص')} --</option>
                        {catalogData?.items?.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.code} - {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-7 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        {t('Description', 'الوصف')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        className={`w-full px-2.5 py-1.5 bg-background border ${errors[`item_${idx}_desc`] ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        placeholder={t('Item description', 'وصف المنتج أو الخدمة')}
                        value={item.description}
                        onChange={(e) => updateItemRow(idx, 'description', e.target.value)}
                      />
                      {errors[`item_${idx}_desc`] && <p className="text-[10px] font-medium text-red-500">{errors[`item_${idx}_desc`]}</p>}
                    </div>

                    {/* Delete Row Button */}
                    <div className="md:col-span-1 flex justify-end items-center pt-5">
                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => removeItemRow(idx)}
                        title={t('Delete line item', 'حذف البند')}
                        className="text-muted-foreground hover:text-rose-600 disabled:opacity-30 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/40">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        {t('Quantity', 'الكمية')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        className={`w-full px-2.5 py-1.5 bg-background border ${errors[`item_${idx}_qty`] ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        value={item.quantity}
                        onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                      />
                      {errors[`item_${idx}_qty`] && <p className="text-[10px] font-medium text-red-500">{errors[`item_${idx}_qty`]}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        {t('Unit Price (SAR)', 'سعر الوحدة')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`w-full px-2.5 py-1.5 bg-background border ${errors[`item_${idx}_price`] ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        value={item.unitPrice}
                        onChange={(e) => updateItemRow(idx, 'unitPrice', e.target.value)}
                      />
                      {errors[`item_${idx}_price`] && <p className="text-[10px] font-medium text-red-500">{errors[`item_${idx}_price`]}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Percent size={10} />
                        {t('VAT Category', 'فئة الضريبة')}
                      </label>
                      <select
                        className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={item.taxCategory}
                        onChange={(e) => updateItemRow(idx, 'taxCategory', e.target.value)}
                      >
                        <option value="STANDARD">Standard VAT 15%</option>
                        <option value="ZERO">Zero Rated 0%</option>
                        <option value="EXEMPT">Exempt</option>
                        <option value="OUT_OF_SCOPE">Out of Scope</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        {t('Line Total (SAR)', 'الإجمالي (ر.س)')}
                      </label>
                      <div className="w-full px-2.5 py-1.5 bg-muted/50 border border-input/60 rounded-lg text-xs font-mono font-bold text-foreground flex items-center justify-end">
                        {(
                          Math.max(
                            0,
                            parseFloat(item.quantity || '0') * parseFloat(item.unitPrice || '0') -
                              parseFloat(item.discountAmount || '0')
                          ) * (item.taxCategory === 'STANDARD' ? 1.15 : 1)
                        ).toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-muted-foreground ms-1">SAR</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals Calculation Box */}
          <div className="max-w-sm ms-auto">
            <InvoiceTaxSummary subtotal={subtotal} taxAmount={taxAmount} totalAmount={totalAmount} />
          </div>

          {/* Terms & Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('Terms & Conditions', 'الشروط والأحكام')}
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('Notes for Customer', 'ملاحظات للعميل')}
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={t('Thank you for your business.', 'شكراً لتعاملكم معنا.')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !customerId}>
              {isSubmitting
                ? t('Saving...', 'جاري الحفظ...')
                : invoiceId
                ? t('Update Invoice', 'تحديث الفاتورة')
                : t('Create Tax Invoice', 'إصدار الفاتورة الضريبية')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
