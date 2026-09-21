import { Lock, Globe2, FileText, Calendar, Layers } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

interface Step4Props {
  form: Partial<OrganizationInput>;
  updateField: (key: keyof OrganizationInput, value: any) => void;
  t: (en: string, ar: string) => string;
}

export function Step4Accounting({ form, updateField, t }: Step4Props) {
  return (
    <div className="space-y-5 fade-up max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>{t('Base Currency', 'العملة الأساسية')}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Lock size={10} /> Fixed</span>
          </label>
          <div className="field bg-muted/60 text-muted-foreground flex items-center justify-between cursor-not-allowed">
            <span className="font-semibold text-foreground">SAR — Saudi Riyal (﷼)</span>
            <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border border-border">KSA</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Globe2 size={14} className="text-primary" />
            {t('Workspace Primary Language', 'لغة مساحة العمل')}
          </label>
          <select className="field" value={form.defaultLanguage} onChange={e => updateField('defaultLanguage', e.target.value)}>
            <option value="en">English (US / UK)</option>
            <option value="ar">العربية (Saudi Arabia)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileText size={14} className="text-primary" />
            {t('Invoice Layout & Language', 'لغة وقالب الفاتورة')}
          </label>
          <select className="field" value={form.invoiceLanguage} onChange={e => updateField('invoiceLanguage', e.target.value)}>
            <option value="bilingual">{t('Bilingual (Arabic & English - ZATCA Recommended)', 'ثنائية (عربي وإنجليزي - موصى بها)')}</option>
            <option value="ar">{t('Arabic Only (عربي فقط)', 'عربي فقط')}</option>
            <option value="en">{t('English Only (إنجليزي فقط)', 'إنجليزي فقط')}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Calendar size={14} className="text-primary" />
            {t('Fiscal Year Opening Month', 'بداية السنة المالية')}
          </label>
          <select className="field" value={form.fiscalYearStart} onChange={e => updateField('fiscalYearStart', e.target.value)}>
            <option value="01-01">{t('January 1st (1 يناير)', '1 يناير')}</option>
            <option value="04-01">{t('April 1st (1 أبريل)', '1 أبريل')}</option>
            <option value="07-01">{t('July 1st (1 يوليو)', '1 يوليو')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Layers size={14} className="text-primary" />
          {t('Number Formatting Style', 'تنسيق أرقام المبالغ')}
        </label>
        <select className="field" value={form.numberFormat} onChange={e => updateField('numberFormat', e.target.value)}>
          <option value="western">Western Digits: 1,234,567.89</option>
          <option value="arabic">Eastern Arabic Digits: ١٬٢٣٤٬٥٦٧٫٨٩</option>
        </select>
      </div>
    </div>
  );
}
