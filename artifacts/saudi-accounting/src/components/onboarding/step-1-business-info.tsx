import { Building2, Store, Briefcase, Mail, Phone, Globe2, Image } from 'lucide-react';
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

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Mail size={14} className="text-primary" />
            {t('Business Email', 'البريد الإلكتروني للمنشأة')}
            <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            className={`field focus:ring-2 focus:ring-primary/20 transition-all ${
              errors.email ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''
            }`}
            value={form.email || ''}
            onChange={e => {
              updateField('email', e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
            placeholder="finance@company.sa"
          />
          {errors.email && <p className="text-[11px] text-destructive font-bold">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Phone size={14} className="text-primary" />
            {t('Business Phone', 'هاتف المنشأة')}
            <span className="text-destructive">*</span>
          </label>
          <input
            type="tel"
            className={`field focus:ring-2 focus:ring-primary/20 transition-all ${
              errors.phone ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''
            }`}
            value={form.phone || ''}
            onChange={e => {
              updateField('phone', e.target.value);
              if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
            }}
            placeholder="+966 50 000 0000"
          />
          {errors.phone && <p className="text-[11px] text-destructive font-bold">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Globe2 size={14} className="text-primary" />
            {t('Website', 'الموقع الإلكتروني')}
          </label>
          <input
            type="url"
            className={`field focus:ring-2 focus:ring-primary/20 transition-all ${
              errors.website ? 'border-destructive ring-2 ring-destructive/30 bg-destructive/5' : ''
            }`}
            value={form.website || ''}
            onChange={e => {
              updateField('website', e.target.value);
              if (errors.website) setErrors(prev => ({ ...prev, website: '' }));
            }}
            placeholder="https://company.sa"
          />
          {errors.website && <p className="text-[11px] text-destructive font-bold">{errors.website}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Image size={14} className="text-primary" />
            {t('Company Logo File', 'شعار المنشأة (ملف الصورة)')}
          </label>
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              <div className="relative group w-14 h-14 rounded-xl border border-border p-1 bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                <img src={form.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                <button
                  type="button"
                  onClick={() => updateField('logoUrl', '')}
                  className="absolute inset-0 bg-black/60 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {t('Remove', 'حذف')}
                </button>
              </div>
            ) : null}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                id="company-logo-file"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setErrors(prev => ({ ...prev, logoUrl: t('Image file size must be less than 5MB', 'حجم ملف الصورة يجب أن يكون أقل من 5 ميجابايت') }));
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      updateField('logoUrl', event.target?.result as string);
                      if (errors.logoUrl) setErrors(prev => ({ ...prev, logoUrl: '' }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label
                htmlFor="company-logo-file"
                className="field flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all"
              >
                <span className="text-xs text-muted-foreground truncate">
                  {form.logoUrl ? t('Change Logo File...', 'تغيير ملف الشعار...') : t('Select logo image from your computer...', 'اختر صورة الشعار من جهازك...')}
                </span>
                <span className="py-1 px-2.5 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {t('Browse File', 'اختر ملفاً')}
                </span>
              </label>
            </div>
          </div>
          {errors.logoUrl && <p className="text-[11px] text-destructive font-bold">{errors.logoUrl}</p>}
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
