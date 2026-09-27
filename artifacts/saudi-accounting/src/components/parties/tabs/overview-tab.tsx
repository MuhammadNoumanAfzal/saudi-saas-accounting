import { useTranslation } from '@/lib/utils';
import type { PartyDetail } from '@workspace/api-client-react';
import { Building2, User, CreditCard, ShieldCheck, Phone, Mail, Globe, FileText, CheckCircle2 } from 'lucide-react';

export function OverviewTab({ data, orgId, isCustomer }: { data: PartyDetail, orgId: string, isCustomer: boolean }) {
  const { t } = useTranslation();
  const partyAny = data as any;
  const displayNameEn = partyAny.businessNameEnglish || partyAny.legalNameEnglish || data.displayName || '-';
  const displayNameAr = partyAny.businessNameArabic || partyAny.legalNameArabic || partyAny.arabicName || '';

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Business Information Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-foreground">{t('Business Information', 'معلومات المنشأة')}</h3>
          </div>

          <div className="space-y-3.5 text-xs font-medium">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('Legal Name (En)', 'الاسم القانوني (إنجليزي)')}</span>
              <span className="col-span-2 font-bold text-foreground text-sm">{displayNameEn}</span>
            </div>
            {displayNameAr && (
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-muted-foreground font-semibold">{t('Legal Name (Ar)', 'الاسم القانوني (عربي)')}</span>
                <span className="col-span-2 font-bold text-foreground text-sm arabic" dir="rtl">{displayNameAr}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('Type', 'النوع')}</span>
              <span className="col-span-2 font-bold text-foreground inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {data.partyType === 'organization' ? t('Organization', 'منشأة تجارية') : t('Individual', 'فرد')}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('City', 'المدينة')}</span>
              <span className="col-span-2 font-bold text-foreground">{data.city || partyAny.city || partyAny.addresses?.[0]?.city || partyAny.addresses?.find((a: any) => a.city)?.city || '-'}</span>
            </div>
          </div>
        </div>

        {/* Tax & ZATCA Registration Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-foreground">{t('Tax & Registration', 'الضريبة والسجل التجاري')}</h3>
          </div>

          <div className="space-y-3.5 text-xs font-medium">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('VAT Number', 'الرقم الضريبي')}</span>
              <span className="col-span-2 font-mono font-black text-sm text-foreground">
                {data.vatNumber ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    <CheckCircle2 size={13} className="text-indigo-600" />
                    {data.vatNumber}
                  </span>
                ) : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('CR Number', 'السجل التجاري')}</span>
              <span className="col-span-2 font-mono font-bold text-foreground">
                {partyAny.commercialRegistrationNumber ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground border border-border">
                    {partyAny.commercialRegistrationNumber}
                  </span>
                ) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contact Information Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-foreground">{t('Contact Information', 'معلومات الاتصال')}</h3>
          </div>

          <div className="space-y-3.5 text-xs font-medium">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('Email', 'البريد الإلكتروني')}</span>
              <span className="col-span-2 font-bold text-foreground truncate">
                {data.primaryEmail ? (
                  <a href={`mailto:${data.primaryEmail}`} className="text-primary hover:underline flex items-center gap-1">
                    <Mail size={13} />
                    <span>{data.primaryEmail}</span>
                  </a>
                ) : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('Phone', 'الهاتف')}</span>
              <span className="col-span-2 font-mono font-bold text-foreground">
                {data.primaryPhone ? (
                  <a href={`tel:${data.primaryPhone}`} className="hover:text-primary flex items-center gap-1">
                    <Phone size={13} />
                    <span>{data.primaryPhone}</span>
                  </a>
                ) : '-'}
              </span>
            </div>
            {partyAny.website && (
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-muted-foreground font-semibold">{t('Website', 'الموقع الإلكتروني')}</span>
                <a href={partyAny.website} target="_blank" rel="noreferrer" className="col-span-2 font-bold text-primary hover:underline truncate flex items-center gap-1">
                  <Globe size={13} />
                  <span>{partyAny.website}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Commercial Terms Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-foreground">{t('Commercial Terms', 'الشروط التجارية والائتمان')}</h3>
          </div>

          <div className="space-y-3.5 text-xs font-medium">
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('Payment Terms', 'شروط الدفع')}</span>
              <span className="col-span-2 font-bold text-foreground">
                <span className="px-2.5 py-1 rounded-lg bg-muted border border-border text-foreground font-mono font-bold">
                  {data.roles[0]?.paymentTerms || 'Net 30'}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-muted-foreground font-semibold">{t('Credit Limit', 'الحد الائتماني')}</span>
              <span className="col-span-2 font-mono font-bold text-foreground">
                {data.roles[0]?.creditLimit ? `SAR ${Number(data.roles[0].creditLimit).toLocaleString()}` : '-'}
              </span>
            </div>
          </div>
        </div>

        {partyAny.notes && (
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-2">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span>{t('Notes & Special Instructions', 'ملاحظات وتعليمات خاصة')}</span>
            </h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{partyAny.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
