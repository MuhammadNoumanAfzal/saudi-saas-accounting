import { MapPin } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

interface Step3Props {
  form: Partial<OrganizationInput>;
  updateField: (key: keyof OrganizationInput, value: any) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  t: (en: string, ar: string) => string;
}

export function Step3NationalAddress({ form, updateField, errors, setErrors, t }: Step3Props) {
  return (
    <div className="space-y-5 fade-up max-w-2xl">
      <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs text-foreground mb-2">
        <MapPin size={20} className="text-primary shrink-0" />
        <span>{t('Saudi Post (SPL) National Address parameters will be rendered on your ZATCA e-invoices.', 'عنوان البريد السعودي (سبل) سيتم طباعته على الفواتير الإلكترونية.')}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            {t('City', 'المدينة')} <span className="text-destructive">*</span>
          </label>
          <input
            className={`field ${errors.city ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''}`}
            value={form.city || ''}
            onChange={e => {
              updateField('city', e.target.value);
              if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
            }}
            placeholder="Riyadh / الرياض"
          />
          {errors.city && <p className="text-[11px] text-destructive font-bold">⚠️ {errors.city}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            {t('District', 'الحي')} <span className="text-destructive">*</span>
          </label>
          <input
            className={`field ${errors.district ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''}`}
            value={form.district || ''}
            onChange={e => {
              updateField('district', e.target.value);
              if (errors.district) setErrors(prev => ({ ...prev, district: '' }));
            }}
            placeholder="Al Olaya / العليا"
          />
          {errors.district && <p className="text-[11px] text-destructive font-bold">⚠️ {errors.district}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          {t('Street Name', 'اسم الشارع')} <span className="text-destructive">*</span>
        </label>
        <input
          className={`field ${errors.streetName ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''}`}
          value={form.streetName || ''}
          onChange={e => {
            updateField('streetName', e.target.value);
            if (errors.streetName) setErrors(prev => ({ ...prev, streetName: '' }));
          }}
          placeholder="King Fahd Road / طريق الملك فهد"
        />
        {errors.streetName && <p className="text-[11px] text-destructive font-bold">⚠️ {errors.streetName}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            {t('Building No.', 'رقم المبنى')} <span className="text-destructive">*</span>
          </label>
          <input
            className={`field font-mono ${errors.buildingNumber ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''}`}
            value={form.buildingNumber || ''}
            onChange={e => {
              updateField('buildingNumber', e.target.value);
              if (errors.buildingNumber) setErrors(prev => ({ ...prev, buildingNumber: '' }));
            }}
            placeholder="7240"
            maxLength={4}
          />
          {errors.buildingNumber && <p className="text-[11px] text-destructive font-bold">⚠️ {errors.buildingNumber}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">{t('Additional No.', 'الرقم الإضافي')}</label>
          <input className="field font-mono" value={form.additionalNumber || ''} onChange={e => updateField('additionalNumber', e.target.value)} placeholder="3190" maxLength={4} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            {t('Postal Code', 'الرمز البريدي')} <span className="text-destructive">*</span>
          </label>
          <input
            className={`field font-mono ${errors.postalCode ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''}`}
            value={form.postalCode || ''}
            onChange={e => {
              updateField('postalCode', e.target.value);
              if (errors.postalCode) setErrors(prev => ({ ...prev, postalCode: '' }));
            }}
            placeholder="12211"
            maxLength={5}
          />
          {errors.postalCode && <p className="text-[11px] text-destructive font-bold">⚠️ {errors.postalCode}</p>}
        </div>
      </div>
    </div>
  );
}
