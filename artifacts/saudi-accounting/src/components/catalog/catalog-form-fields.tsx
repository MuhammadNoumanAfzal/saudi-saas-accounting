import { useTranslation } from '@/lib/utils';
import { Tag, DollarSign, Percent } from 'lucide-react';

interface CatalogFormFieldsProps {
  salesPrice: string;
  setSalesPrice: (val: string) => void;
  purchasePrice: string;
  setPurchasePrice: (val: string) => void;
  taxCategory: string;
  setTaxCategory: (val: string) => void;
  taxRate: string;
  setTaxRate: (val: string) => void;
  unitId: string;
  setUnitId: (val: string) => void;
  units?: Array<{ id: string; code: string; name: string }>;
  errors: Record<string, string>;
}

export function CatalogFormFields({
  salesPrice,
  setSalesPrice,
  purchasePrice,
  setPurchasePrice,
  taxCategory,
  setTaxCategory,
  taxRate,
  setTaxRate,
  unitId,
  setUnitId,
  units = [],
  errors
}: CatalogFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Unit of Measure */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-foreground flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{t('Unit of Measure', 'وحدة القياس')} <span className="text-red-500">*</span></span>
        </label>
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className={`w-full px-3 py-2 bg-background border ${errors.unitId ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
        >
          <option value="">-- {t('Select Unit', 'اختر الوحدة')} --</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.code})
            </option>
          ))}
        </select>
        {errors.unitId && <p className="text-xs font-medium text-red-500 mt-1">{errors.unitId}</p>}
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Selling Price (Excl. VAT)', 'سعر البيع (غير شامل الضريبة)')} <span className="text-red-500">*</span></span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={salesPrice}
            onChange={(e) => setSalesPrice(e.target.value)}
            placeholder="0.00"
            className={`w-full px-3 py-2 bg-background border ${errors.salesPrice ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
          />
          {errors.salesPrice && <p className="text-xs font-medium text-red-500 mt-1">{errors.salesPrice}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t('Purchase Price (Excl. VAT)', 'سعر الشراء (غير شامل الضريبة)')}</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0.00"
            className={`w-full px-3 py-2 bg-background border ${errors.purchasePrice ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
          />
          {errors.purchasePrice && <p className="text-xs font-medium text-red-500 mt-1">{errors.purchasePrice}</p>}
        </div>
      </div>

      {/* VAT Category & Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{t('ZATCA VAT Treatment', 'المعاملة الضريبية ZATCA')}</span>
          </label>
          <select
            value={taxCategory}
            onChange={(e) => {
              const cat = e.target.value;
              setTaxCategory(cat);
              if (cat === 'STANDARD') setTaxRate('15.00');
              else setTaxRate('0.00');
            }}
            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="STANDARD">Standard Rate (15%)</option>
            <option value="ZERO">Zero Rated (0%)</option>
            <option value="EXEMPT">Exempt</option>
            <option value="OUT_OF_SCOPE">Out of Scope</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            {t('VAT Rate (%)', 'نسبة الضريبة (%)')}
          </label>
          <input
            type="text"
            readOnly
            value={`${taxRate}%`}
            className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-sm font-mono font-bold text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
