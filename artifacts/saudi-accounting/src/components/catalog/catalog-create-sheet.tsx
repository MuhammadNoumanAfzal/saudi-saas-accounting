import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useListCatalogUnits,
  getListCatalogItemsQueryKey,
  getListCatalogUnitsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetCatalogItemQueryKey,
  CatalogItemType,
  TaxCategory,
  CatalogItem
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function CatalogCreateSheet({ 
  open, 
  onOpenChange, 
  orgId, 
  onSuccess,
  mode = 'create',
  initialData
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  orgId: string;
  onSuccess: (id: string) => void;
  mode?: 'create' | 'edit';
  initialData?: CatalogItem;
}) {
  const { t, isRtl } = useTranslation();

  const createItem = useCreateCatalogItem();
  const updateItem = useUpdateCatalogItem();
  const { data: units } = useListCatalogUnits(orgId, {
    query: { enabled: !!orgId && open, queryKey: getListCatalogUnitsQueryKey(orgId) }
  });

  const [type, setType] = useState<CatalogItemType>('PRODUCT');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [unitId, setUnitId] = useState('');
  const [salesPrice, setSalesPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [taxCategory, setTaxCategory] = useState<TaxCategory>('STANDARD');
  
  const [showMore, setShowMore] = useState(false);
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [trackInventory, setTrackInventory] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setType(initialData.type);
        setNameEn(initialData.name);
        setNameAr(initialData.nameAr || '');
        setUnitId(initialData.unitId);
        setSalesPrice(initialData.salesPrice);
        setPurchasePrice(initialData.purchasePrice);
        setTaxCategory(initialData.taxCategory);
        setDescriptionEn(initialData.description || '');
        setDescriptionAr(initialData.descriptionAr || '');
        setSku(initialData.sku || '');
        setBarcode(initialData.barcode || '');
        setTrackInventory(initialData.trackInventory || false);
        setShowMore(!!(initialData.description || initialData.descriptionAr || initialData.sku || initialData.barcode));
      } else {
        setType('PRODUCT');
        setNameEn('');
        setNameAr('');
        setUnitId(units?.[0]?.id || '');
        setSalesPrice('');
        setPurchasePrice('');
        setTaxCategory('STANDARD');
        setShowMore(false);
        setDescriptionEn('');
        setDescriptionAr('');
        setSku('');
        setBarcode('');
        setTrackInventory(false);
      }
      setErrors({});
    }
  }, [open, mode, initialData, units]);

  // Sync initial unit when units load
  useEffect(() => {
    if (units?.length && !unitId && mode === 'create') {
      setUnitId(units[0].id);
    }
  }, [units, unitId, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    // Name English >= 2 chars
    if (!nameEn.trim()) {
      newErrors.nameEn = t('Name in English is required', 'الاسم باللغة الإنجليزية مطلوب');
    } else if (nameEn.trim().length < 2) {
      newErrors.nameEn = t('Name in English must be at least 2 characters', 'يجب أن يكون الاسم بالإنجليزي حرفين على الأقل');
    }

    // Name Arabic >= 2 chars
    if (!nameAr.trim()) {
      newErrors.nameAr = t('Name in Arabic is required', 'الاسم باللغة العربية مطلوب');
    } else if (nameAr.trim().length < 2) {
      newErrors.nameAr = t('Name in Arabic must be at least 2 characters', 'يجب أن يكون الاسم بالعربي حرفين على الأقل');
    }

    if (!unitId && units?.length) newErrors.unitId = t('Unit is required', 'الوحدة مطلوبة');
    
    // Selling Price > 0
    if (!salesPrice || isNaN(Number(salesPrice)) || Number(salesPrice) <= 0) {
      newErrors.salesPrice = t('Selling price must be greater than 0.00', 'يجب أن يكون سعر البيع أكبر من 0.00');
    }

    // Purchase Price >= 0
    if (purchasePrice !== '' && (isNaN(Number(purchasePrice)) || Number(purchasePrice) < 0)) {
      newErrors.purchasePrice = t('Purchase price cannot be negative', 'سعر الشراء لا يمكن أن يكون بالسالب');
    }

    // SKU / Code: alphanumeric string without spaces if provided
    if (sku.trim() && !/^[a-zA-Z0-9_-]+$/.test(sku.trim())) {
      newErrors.sku = t('SKU must be an alphanumeric code without spaces', 'رمز SKU يجب أن يكون أبجدي عددي بدون مسافات');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const container = document.getElementById('item-form-container');
      if (container) container.scrollTop = 0;
      return;
    }

    const payload = {
      type,
      name: nameEn.trim(),
      nameAr: nameAr.trim(),
      unitId: unitId || (units?.length ? units[0].id : 'default'), // Fallback if no units returned
      salesPrice: String(Number(salesPrice).toFixed(2)),
      purchasePrice: purchasePrice ? String(Number(purchasePrice).toFixed(2)) : '0.00',
      taxCategory,
      taxRate: taxCategory === 'STANDARD' ? '15.00' : '0.00',
      description: descriptionEn.trim() || null,
      descriptionAr: descriptionAr.trim() || null,
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      trackInventory: type === 'PRODUCT' ? trackInventory : false,
    };

    if (mode === 'edit' && initialData) {
      updateItem.mutate({
        organizationId: orgId,
        itemId: initialData.id,
        data: payload
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
          queryClient.invalidateQueries({ queryKey: getGetCatalogItemQueryKey(orgId, initialData.id) });
          showAlert.toast(
            t('Item Updated Successfully!', 'تم تحديث الصنف بنجاح!'),
            'success'
          );
          onOpenChange(false);
          onSuccess(initialData.id);
        },
        onError: (err: any) => {
          setErrors({ submit: err?.message || t('Something went wrong', 'حدث خطأ ما') });
          const container = document.getElementById('item-form-container');
          if (container) container.scrollTop = 0;
        }
      });
    } else {
      createItem.mutate({
        organizationId: orgId,
        data: payload
      }, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(orgId) });
          showAlert.toast(
            t('Item Created Successfully!', 'تم إنشاء الصنف بنجاح!'),
            'success'
          );
          onOpenChange(false);
          onSuccess(data.id);
        },
        onError: (err: any) => {
          setErrors({ submit: err?.message || t('Something went wrong', 'حدث خطأ ما') });
          const container = document.getElementById('item-form-container');
          if (container) container.scrollTop = 0;
        }
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 border-b border-border bg-card/50">
          <SheetTitle className="text-xl font-bold">
            {mode === 'edit' ? t('Edit Item', 'تعديل الصنف') : t('New Item', 'صنف جديد')}
          </SheetTitle>
          <SheetDescription>
            {mode === 'edit' ? t('Update product or service details.', 'تحديث تفاصيل المنتج أو الخدمة.') : t('Add a product or service to your catalog.', 'أضف منتجاً أو خدمة إلى الكتالوج الخاص بك.')}
          </SheetDescription>
        </SheetHeader>

        <div id="item-form-container" className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
            {errors.submit && (
              <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg text-sm border border-red-500/20 font-medium">
                {errors.submit}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('Type', 'النوع')} <span className="text-red-500">*</span></label>
              <div className="flex bg-muted/50 p-1 rounded-xl">
                <button type="button" onClick={() => setType('PRODUCT')} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${type === 'PRODUCT' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t('Product', 'منتج')}
                </button>
                <button type="button" onClick={() => setType('SERVICE')} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${type === 'SERVICE' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t('Service', 'خدمة')}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center justify-between">
                <span>{t('Name (English)', 'الاسم (إنجليزي)')} <span className="text-red-500">*</span></span>
              </label>
              <input 
                className={`field ${errors.nameEn ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                value={nameEn} 
                onChange={e => { setNameEn(e.target.value); if (errors.nameEn) setErrors(prev => ({ ...prev, nameEn: '' })); }} 
                placeholder="e.g. Consulting Services" 
              />
              {errors.nameEn && <p className="text-xs font-medium text-red-500 flex items-center gap-1">{errors.nameEn}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center justify-between">
                <span>{t('Name (Arabic)', 'الاسم (عربي)')} <span className="text-red-500">*</span></span>
              </label>
              <input 
                className={`field arabic ${errors.nameAr ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                value={nameAr} 
                onChange={e => { setNameAr(e.target.value); if (errors.nameAr) setErrors(prev => ({ ...prev, nameAr: '' })); }} 
                dir="rtl" 
                placeholder="مثال: خدمات استشارية" 
              />
              {errors.nameAr && <p className="text-xs font-medium text-red-500 flex items-center gap-1">{errors.nameAr}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('Unit', 'الوحدة')} <span className="text-red-500">*</span></label>
              <select 
                className={`field ${errors.unitId ? 'border-red-500 bg-red-500/5' : ''}`} 
                value={unitId} 
                onChange={e => { setUnitId(e.target.value); if (errors.unitId) setErrors(prev => ({ ...prev, unitId: '' })); }}
              >
                {units?.map(u => (
                  <option key={u.id} value={u.id}>{isRtl ? u.nameAr : u.name}</option>
                ))}
                {!units?.length && <option value="default">{t('Default Unit', 'الوحدة الافتراضية')}</option>}
              </select>
              {errors.unitId && <p className="text-xs font-medium text-red-500 flex items-center gap-1">{errors.unitId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Sales Price', 'سعر البيع')} <span className="text-red-500">*</span></label>
                <div className={`flex rounded-xl overflow-hidden border bg-background transition-colors ${errors.salesPrice ? 'border-red-500 bg-red-500/5 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-border focus-within:ring-2 focus-within:ring-primary/20'}`}>
                  <span className="bg-muted/50 px-3 flex items-center text-xs font-bold text-muted-foreground border-r border-border rtl:border-r-0 rtl:border-l select-none shrink-0">
                    SAR
                  </span>
                  <input 
                    type="text" 
                    className="w-full bg-transparent px-3 py-2 text-sm font-semibold outline-none placeholder:text-muted-foreground/40" 
                    value={salesPrice} 
                    onChange={e => { setSalesPrice(e.target.value); if (errors.salesPrice) setErrors(prev => ({ ...prev, salesPrice: '' })); }} 
                    placeholder="0.00" 
                  />
                </div>
                {errors.salesPrice && <p className="text-xs font-medium text-red-500 flex items-center gap-1">{errors.salesPrice}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Purchase Price', 'سعر الشراء')}</label>
                <div className={`flex rounded-xl overflow-hidden border bg-background transition-colors ${errors.purchasePrice ? 'border-red-500 bg-red-500/5 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-border focus-within:ring-2 focus-within:ring-primary/20'}`}>
                  <span className="bg-muted/50 px-3 flex items-center text-xs font-bold text-muted-foreground border-r border-border rtl:border-r-0 rtl:border-l select-none shrink-0">
                    SAR
                  </span>
                  <input 
                    type="text" 
                    className="w-full bg-transparent px-3 py-2 text-sm font-semibold outline-none placeholder:text-muted-foreground/40" 
                    value={purchasePrice} 
                    onChange={e => { setPurchasePrice(e.target.value); if (errors.purchasePrice) setErrors(prev => ({ ...prev, purchasePrice: '' })); }} 
                    placeholder="0.00" 
                  />
                </div>
                {errors.purchasePrice && <p className="text-xs font-medium text-red-500 flex items-center gap-1">{errors.purchasePrice}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('VAT Treatment', 'المعاملة الضريبية')} <span className="text-red-500">*</span></label>
              <select className="field" value={taxCategory} onChange={e => setTaxCategory(e.target.value as TaxCategory)}>
                <option value="STANDARD">{t('Standard Rate (15%)', 'النسبة الأساسية (15%)')}</option>
                <option value="ZERO_RATED">{t('Zero Rated (0%)', 'خاضع لنسبة الصفر (0%)')}</option>
                <option value="EXEMPT">{t('Exempt', 'معفى')}</option>
                <option value="OUT_OF_SCOPE">{t('Out of Scope', 'خارج النطاق')}</option>
              </select>
            </div>

            {type === 'PRODUCT' && (
              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border" checked={trackInventory} onChange={e => setTrackInventory(e.target.checked)} />
                  <span className="text-sm font-semibold">{t('Track Inventory', 'تتبع المخزون')}</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-6 rtl:ml-0 rtl:mr-6">
                  {t('Inventory tracking will be fully enabled in the next setup stage.', 'سيتم تفعيل تتبع المخزون بالكامل في مرحلة الإعداد القادمة.')}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button type="button" onClick={() => setShowMore(!showMore)} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {t('More details', 'تفاصيل إضافية')}
              </button>
            </div>

            {showMore && (
              <div className="space-y-4 fade-up pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Description (English)', 'الوصف (إنجليزي)')}</label>
                  <textarea className="field min-h-20 resize-none" value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Description (Arabic)', 'الوصف (عربي)')}</label>
                  <textarea className="field min-h-20 resize-none arabic" value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} dir="rtl" />
                </div>
                
                {type === 'PRODUCT' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{t('SKU', 'رمز التخزين (SKU)')}</label>
                      <input 
                        className={`field ${errors.sku ? 'border-red-500 bg-red-500/5' : ''}`} 
                        value={sku} 
                        onChange={e => { setSku(e.target.value); if (errors.sku) setErrors(prev => ({ ...prev, sku: '' })); }} 
                        placeholder="e.g. ITEM-001"
                      />
                      {errors.sku && <p className="text-xs font-medium text-red-500 flex items-center gap-1">{errors.sku}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{t('Barcode', 'الباركود')}</label>
                      <input className="field" value={barcode} onChange={e => setBarcode(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-border bg-card/50 flex gap-3 mt-auto">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="flex-1">
            {t('Cancel', 'إلغاء')}
          </Button>
          <Button type="submit" form="item-form" variant="primary" className="flex-1" disabled={createItem.isPending || updateItem.isPending}>
            {(createItem.isPending || updateItem.isPending) ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
