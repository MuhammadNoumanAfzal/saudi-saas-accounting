import { useTranslation } from '@/lib/utils';
import { ShieldCheck, Building2 } from 'lucide-react';

interface PartyTaxCrFieldsProps {
  vatRegistered: boolean;
  setVatRegistered: (val: boolean) => void;
  vatNumber: string;
  setVatNumber: (val: string) => void;
  crNumber: string;
  setCrNumber: (val: string) => void;
  errors: Record<string, string>;
}

export function PartyTaxCrFields({
  vatRegistered,
  setVatRegistered,
  vatNumber,
  setVatNumber,
  crNumber,
  setCrNumber,
  errors
}: PartyTaxCrFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 bg-muted/20 rounded-xl border border-border/70 space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={vatRegistered}
            onChange={(e) => setVatRegistered(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t('VAT Registered (ZATCA Taxable Person)', 'مسجل في ضريبة القيمة المضافة (خاضع للضريبة)')}</span>
        </label>
      </div>

      {vatRegistered && (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            {t('15-Digit ZATCA VAT Number', 'الرقم الضريبي 15 رقم')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={15}
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder="300000000000003"
            className={`w-full px-3 py-2 bg-background border ${errors.vatNumber ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
          />
          {errors.vatNumber ? (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.vatNumber}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">{t('Must be 15 digits starting and ending with 3.', 'يجب أن يتكون من 15 رقم يبدأ وينتهي بالرقم 3.')}</p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-xs font-medium text-foreground flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{t('Commercial Registration (CR) Number', 'رقم السجل التجاري (CR)')}</span>
        </label>
        <input
          type="text"
          maxLength={10}
          value={crNumber}
          onChange={(e) => setCrNumber(e.target.value)}
          placeholder="1010000000"
          className={`w-full px-3 py-2 bg-background border ${errors.crNumber ? 'border-red-500 bg-red-500/5' : 'border-input'} rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20`}
        />
        {errors.crNumber && <p className="text-xs font-medium text-red-500 mt-1">{errors.crNumber}</p>}
      </div>
    </div>
  );
}
