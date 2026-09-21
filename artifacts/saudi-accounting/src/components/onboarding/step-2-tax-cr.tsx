import { Check, FileText, ShieldCheck, Landmark } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

interface Step2Props {
  form: Partial<OrganizationInput>;
  updateField: (key: keyof OrganizationInput, value: any) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isRtl: boolean;
  t: (en: string, ar: string) => string;
}

export function Step2TaxCr({ form, updateField, errors, setErrors, isRtl, t }: Step2Props) {
  return (
    <div className="space-y-6 fade-up max-w-2xl">
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-primary" />
          {t('Are you registered for Saudi VAT?', 'هل المنشأة مسجلة في ضريبة القيمة المضافة بالسعودية؟')}
        </label>
        <button
          type="button"
          className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${
            form.vatRegistered
              ? 'border-2 border-primary bg-primary/5 shadow-sm'
              : 'border border-border bg-card hover:border-primary/40'
          }`}
          onClick={() => updateField('vatRegistered', !form.vatRegistered)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.vatRegistered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {form.vatRegistered ? <Check size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">
                {form.vatRegistered ? t('Yes, VAT Registered (15% ZATCA Rate)', 'نعم، مسجل في ضريبة القيمة المضافة (15%)') : t('Not VAT Registered / Exempt', 'غير مسجل في الضريبة / معفى')}
              </div>
              <div className="text-xs text-muted-foreground">
                {form.vatRegistered ? t('Allows generating ZATCA Phase 2 E-Invoices with Tax QR code', 'يتيح إصدار الفواتير الإلكترونية المرحلة الثانية مع كود QR الضريبي') : t('Standard invoicing without tax breakdown', 'فواتير عادية بدون احتساب الضريبة')}
              </div>
            </div>
          </div>
          <div className={`h-6 w-11 rounded-full p-1 transition-colors ${form.vatRegistered ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
            <div className={`h-4 w-4 rounded-full bg-white transition-transform ${form.vatRegistered ? (isRtl ? '-translate-x-5' : 'translate-x-5') : ''}`} />
          </div>
        </button>
      </div>

      {form.vatRegistered && (
        <div className="space-y-2 fade-up">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText size={14} className="text-primary" />
              {t('ZATCA VAT Registration Number (TIN)', 'الرقم الضريبي لدى هيئة الزكاة والضريبة (TIN)')}
            </label>
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              15 Digits (3...3)
            </span>
          </div>
          <input
            className={`field focus:ring-2 focus:ring-primary/20 transition-all tracking-wider font-mono ${
              errors.vatNumber ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''
            }`}
            value={form.vatNumber || ''}
            onChange={e => {
              updateField('vatNumber', e.target.value);
              if (errors.vatNumber) setErrors(prev => ({ ...prev, vatNumber: '' }));
            }}
            placeholder="310998877600003"
            maxLength={15}
          />
          {errors.vatNumber ? (
            <p className="text-[11px] text-destructive font-bold flex items-center gap-1 mt-1">
              ⚠️ {errors.vatNumber}
            </p>
          ) : form.vatNumber && !/^3\d{13}3$/.test(form.vatNumber) ? (
            <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1">
              ⚠️ {t('Must be 15 digits starting and ending with 3.', 'يجب أن يكون 15 رقماً ويبدأ وينتهي بالرقم 3.')}
            </p>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Landmark size={14} className="text-primary" />
            {t('Commercial Registration Number (CR)', 'رقم السجل التجاري (CR)')}
            <span className="text-destructive">*</span>
          </label>
          <span className="text-[10px] font-semibold text-muted-foreground">10 Digits</span>
        </div>
        <input
          className={`field focus:ring-2 focus:ring-primary/20 transition-all font-mono ${
            errors.commercialRegistrationNumber ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''
          }`}
          value={form.commercialRegistrationNumber || ''}
          onChange={e => {
            updateField('commercialRegistrationNumber', e.target.value);
            if (errors.commercialRegistrationNumber) setErrors(prev => ({ ...prev, commercialRegistrationNumber: '' }));
          }}
          placeholder="1010889922"
          maxLength={10}
        />
        {errors.commercialRegistrationNumber && (
          <p className="text-[11px] text-destructive font-bold flex items-center gap-1 mt-1">
            ⚠️ {errors.commercialRegistrationNumber}
          </p>
        )}
      </div>
    </div>
  );
}
