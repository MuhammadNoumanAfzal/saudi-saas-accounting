import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
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
    if (!nameEn) newErrors.nameEn = t('Name in English is required', 'الاسم باللغة الإنجليزية مطلوب');
    if (!nameAr) newErrors.nameAr = t('Name in Arabic is required', 'الاسم باللغة العربية مطلوب');
    if (!unitId && units?.length) newErrors.unitId = t('Unit is required', 'الوحدة مطلوبة');
    
    if (salesPrice && isNaN(Number(salesPrice))) newErrors.salesPrice = t('Must be a valid number', 'يجب أن يكون رقماً صالحاً');
    if (purchasePrice && isNaN(Number(purchasePrice))) newErrors.purchasePrice = t('Must be a valid number', 'يجب أن يكون رقماً صالحاً');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      type,
      name: nameEn,
      nameAr,
      unitId: unitId || (units?.length ? units[0].id : 'default'), // Fallback if no units returned
      salesPrice: salesPrice || '0.00',
      purchasePrice: purchasePrice || '0.00',
      taxCategory,
      taxRate: taxCategory === 'STANDARD' ? '15.00' : '0.00',
      description: descriptionEn || null,
      descriptionAr: descriptionAr || null,
      sku: sku || null,
      barcode: barcode || null,
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
          onSuccess(initialData.id);
        },
        onError: (err: any) => {
          setErrors({ submit: err?.message || t('Something went wrong', 'حدث خطأ ما') });
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
          onSuccess(data.id);
        },
        onError: (err: any) => {
          setErrors({ submit: err?.message || t('Something went wrong', 'حدث خطأ ما') });
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

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="item-form" onSubmit={handleSubmit} className="space-y-5">
            {errors.submit && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 font-medium">
                {errors.submit}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('Type', 'النوع')}</label>
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
              <label className="text-sm font-semibold">{t('Name (English) *', 'الاسم (إنجليزي) *')}</label>
              <input className={`field ${errors.nameEn ? 'border-destructive' : ''}`} value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Consulting Services" />
              {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('Name (Arabic) *', 'الاسم (عربي) *')}</label>
              <input className={`field arabic ${errors.nameAr ? 'border-destructive' : ''}`} value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" placeholder="مثال: خدمات استشارية" />
              {errors.nameAr && <p className="text-xs text-destructive">{errors.nameAr}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('Unit', 'الوحدة')}</label>
              <select className={`field ${errors.unitId ? 'border-destructive' : ''}`} value={unitId} onChange={e => setUnitId(e.target.value)}>
                {units?.map(u => (
                  <option key={u.id} value={u.id}>{isRtl ? u.nameAr : u.name}</option>
                ))}
                {!units?.length && <option value="default">{t('Default Unit', 'الوحدة الافتراضية')}</option>}
              </select>
              {errors.unitId && <p className="text-xs text-destructive">{errors.unitId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Sales Price', 'سعر البيع')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium rtl:left-auto rtl:right-3">SAR</span>
                  <input type="text" className={`field pl-12 rtl:pl-3 rtl:pr-12 ${errors.salesPrice ? 'border-destructive' : ''}`} value={salesPrice} onChange={e => setSalesPrice(e.target.value)} placeholder="0.00" />
                </div>
                {errors.salesPrice && <p className="text-xs text-destructive">{errors.salesPrice}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Purchase Price', 'سعر الشراء')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium rtl:left-auto rtl:right-3">SAR</span>
                  <input type="text" className={`field pl-12 rtl:pl-3 rtl:pr-12 ${errors.purchasePrice ? 'border-destructive' : ''}`} value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0.00" />
                </div>
                {errors.purchasePrice && <p className="text-xs text-destructive">{errors.purchasePrice}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{t('VAT Treatment', 'المعاملة الضريبية')}</label>
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
                      <input className="field" value={sku} onChange={e => setSku(e.target.value)} />
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
          <Button type="submit" form="item-form" variant="primary" className="flex-1" disabled={createItem.isPending}>
            {createItem.isPending ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
