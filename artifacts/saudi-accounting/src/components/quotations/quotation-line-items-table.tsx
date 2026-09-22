import { useTranslation, Button } from '@/lib/utils';
import { Calculator, Plus, Trash2, Tag, Percent } from 'lucide-react';

interface QuotationItemInput {
  catalogItemId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount?: string;
  taxCategory?: string;
  taxRate?: string;
}

interface QuotationLineItemsTableProps {
  items: QuotationItemInput[];
  addItemRow: () => void;
  removeItemRow: (index: number) => void;
  updateItemRow: (index: number, field: keyof QuotationItemInput, val: any) => void;
  selectCatalogItem: (index: number, catalogId: string) => void;
  catalogItems?: Array<{ id: string; code: string; name: string }>;
  errors: Record<string, string>;
}

export function QuotationLineItemsTable({
  items,
  addItemRow,
  removeItemRow,
  updateItemRow,
  selectCatalogItem,
  catalogItems = [],
  errors
}: QuotationLineItemsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Calculator size={16} className="text-primary" />
          <span>{t('Line Items & Services', 'بنود عرض السعر والخدمات')} <span className="text-red-500">*</span></span>
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
                  {catalogItems.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  value={item.taxCategory || 'STANDARD'}
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
  );
}
