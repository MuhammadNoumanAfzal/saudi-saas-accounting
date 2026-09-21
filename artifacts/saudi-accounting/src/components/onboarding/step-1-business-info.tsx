import { Building2, Store, Briefcase } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

interface Step1Props {
  form: Partial<OrganizationInput>;
  updateField: (key: keyof OrganizationInput, value: any) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  t: (en: string, ar: string) => string;
}

export function Step1BusinessInfo({ form, updateField, errors, setErrors, t }: Step1Props) {
  return (
    <div className="space-y-6 fade-up max-w-2xl">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Building2 size={14} className="text-primary" />
            {t('Legal Name (English)', 'الاسم القانوني (إنجليزي)')}
            <span className="text-destructive">*</span>
          </label>
          <input
            className={`field focus:ring-2 focus:ring-primary/20 transition-all ${
              errors.legalNameEnglish ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''
            }`}
            value={form.legalNameEnglish || ''}
            onChange={e => {
              updateField('legalNameEnglish', e.target.value);
              if (errors.legalNameEnglish) setErrors(prev => ({ ...prev, legalNameEnglish: '' }));
            }}
            placeholder="e.g. Nouman Trading & Technology Co."
          />
          {errors.legalNameEnglish && (
            <p className="text-[11px] text-destructive font-bold flex items-center gap-1 mt-1">
              ⚠️ {errors.legalNameEnglish}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Building2 size={14} className="text-primary" />
            {t('Legal Name (Arabic)', 'الاسم القانوني (عربي)')}
          </label>
          <input
            className="field arabic focus:ring-2 focus:ring-primary/20 transition-all text-right"
            value={form.legalNameArabic || ''}
            onChange={e => updateField('legalNameArabic', e.target.value)}
            placeholder="مثال: شركة نعمان للتجارة والتقنية"
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Store size={14} className="text-primary" />
            {t('Trading / Brand Name (English)', 'الاسم التجاري / العلامة (إنجليزي)')}
          </label>
          <input
            className="field focus:ring-2 focus:ring-primary/20 transition-all"
            value={form.tradingNameEnglish || ''}
            onChange={e => updateField('tradingNameEnglish', e.target.value)}
            placeholder="e.g. Nouman Tech & Supply"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Store size={14} className="text-primary" />
            {t('Trading / Brand Name (Arabic)', 'الاسم التجاري / العلامة (عربي)')}
          </label>
          <input
            className="field arabic focus:ring-2 focus:ring-primary/20 transition-all text-right"
            value={form.tradingNameArabic || ''}
            onChange={e => updateField('tradingNameArabic', e.target.value)}
            placeholder="مثال: نعمان للتقنية والتوريدات"
            dir="rtl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Briefcase size={14} className="text-primary" />
          {t('Business Type / Entity Structure', 'نوع الكيان / الهيكل التجاري')}
        </label>
        <select
          className="field focus:ring-2 focus:ring-primary/20 transition-all"
          value={form.businessType || ''}
          onChange={e => updateField('businessType', e.target.value)}
        >
          <option value="establishment">{t('Sole Establishment (مؤسسة فردية)', 'مؤسسة فردية')}</option>
          <option value="limited_liability_company">{t('Limited Liability Company - LLC (شركة ذات مسؤولية محدودة)', 'شركة ذات مسؤولية محدودة')}</option>
          <option value="joint_stock_company">{t('Joint Stock Company (شركة مساهمة)', 'شركة مساهمة')}</option>
          <option value="professional_company">{t('Professional Company (شركة مهنية)', 'شركة مهنية')}</option>
          <option value="non_profit">{t('Non-Profit Organization (منظمة غير ربحية)', 'منظمة غير ربحية')}</option>
        </select>
      </div>
    </div>
  );
}
