import { Building2, CheckCircle2 } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

interface Step5Props {
  form: Partial<OrganizationInput>;
  isRtl: boolean;
  t: (en: string, ar: string) => string;
}

export function Step5Review({ form, isRtl, t }: Step5Props) {
  return (
    <div className="space-y-6 fade-up max-w-2xl">
      <div className="p-6 rounded-2xl bg-card border border-primary/30 shadow-md relative overflow-hidden">
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-foreground">
                {isRtl ? (form.legalNameArabic || form.legalNameEnglish) : form.legalNameEnglish}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {form.businessType?.replace(/_/g, ' ')} • {form.city || 'Riyadh'}, Saudi Arabia
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <CheckCircle2 size={14} /> Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-background/60 border border-border">
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase mb-1">{t('VAT TIN', 'الرقم الضريبي')}</span>
            <span className="font-bold text-foreground font-mono">{form.vatRegistered ? form.vatNumber : t('Exempt', 'معفى')}</span>
          </div>

          <div className="p-3 rounded-xl bg-background/60 border border-border">
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase mb-1">{t('CR Number', 'السجل التجاري')}</span>
            <span className="font-bold text-foreground font-mono">{form.commercialRegistrationNumber || '—'}</span>
          </div>

          <div className="p-3 rounded-xl bg-background/60 border border-border">
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase mb-1">{t('Currency', 'العملة')}</span>
            <span className="font-bold text-foreground font-mono">{form.currency} (﷼)</span>
          </div>

          <div className="p-3 rounded-xl bg-background/60 border border-border">
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase mb-1">{t('Invoicing', 'الفواتير')}</span>
            <span className="font-bold text-foreground capitalize">{form.invoiceLanguage}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
