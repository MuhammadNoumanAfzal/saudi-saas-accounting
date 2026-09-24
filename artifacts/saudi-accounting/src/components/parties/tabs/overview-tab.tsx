import { useTranslation } from '@/lib/utils';
import type { PartyDetail } from '@workspace/api-client-react';

export function OverviewTab({ data, orgId, isCustomer }: { data: PartyDetail, orgId: string, isCustomer: boolean }) {
  const { t } = useTranslation();
  const partyAny = data as any;
  const displayNameEn = partyAny.businessNameEnglish || partyAny.legalNameEnglish || data.displayName || '-';
  const displayNameAr = partyAny.businessNameArabic || partyAny.legalNameArabic || partyAny.arabicName || '';

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="soft-card p-5">
          <h3 className="font-bold text-lg mb-4">{t('Business Information', 'معلومات المنشأة')}</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Legal Name (En)', 'الاسم القانوني (إنجليزي)')}</span>
              <span className="col-span-2 font-medium">{displayNameEn}</span>
            </div>
            {displayNameAr && (
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t('Legal Name (Ar)', 'الاسم القانوني (عربي)')}</span>
                <span className="col-span-2 font-medium arabic" dir="rtl">{displayNameAr}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Type', 'النوع')}</span>
              <span className="col-span-2 font-medium">{data.partyType === 'organization' ? t('Organization', 'منشأة') : t('Individual', 'فرد')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('City', 'المدينة')}</span>
              <span className="col-span-2 font-medium">{data.city || partyAny.city || partyAny.addresses?.[0]?.city || partyAny.addresses?.find((a: any) => a.city)?.city || '-'}</span>
            </div>
          </div>
        </div>

        <div className="soft-card p-5">
          <h3 className="font-bold text-lg mb-4">{t('Tax & Registration', 'الضريبة والتسجيل')}</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('VAT Number', 'الرقم الضريبي')}</span>
              <span className="col-span-2 font-medium font-mono">{data.vatNumber || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('CR Number', 'السجل التجاري')}</span>
              <span className="col-span-2 font-medium font-mono">{partyAny.commercialRegistrationNumber || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="soft-card p-5">
          <h3 className="font-bold text-lg mb-4">{t('Contact Information', 'معلومات الاتصال')}</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Email', 'البريد الإلكتروني')}</span>
              <span className="col-span-2 font-medium">{data.primaryEmail || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Phone', 'الهاتف')}</span>
              <span className="col-span-2 font-medium">{data.primaryPhone || '-'}</span>
            </div>
            {partyAny.website && (
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t('Website', 'الموقع')}</span>
                <a href={partyAny.website} target="_blank" rel="noreferrer" className="col-span-2 font-medium text-primary hover:underline truncate">
                  {partyAny.website}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="soft-card p-5">
          <h3 className="font-bold text-lg mb-4">{t('Commercial Terms', 'الشروط التجارية')}</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Payment Terms', 'شروط الدفع')}</span>
              <span className="col-span-2 font-medium">{data.roles[0]?.paymentTerms || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Credit Limit', 'الحد الائتماني')}</span>
              <span className="col-span-2 font-medium">{data.roles[0]?.creditLimit || '-'}</span>
            </div>
          </div>
        </div>

        {partyAny.notes && (
          <div className="soft-card p-5">
            <h3 className="font-bold text-lg mb-2">{t('Notes', 'ملاحظات')}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{partyAny.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
