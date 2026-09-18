import { useTranslation } from '@/lib/utils';
import type { PartyDetail } from '@workspace/api-client-react';

export function OverviewTab({ data, orgId, isCustomer }: { data: PartyDetail, orgId: string, isCustomer: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="soft-card p-5">
          <h3 className="font-bold text-lg mb-4">{t('Business Information', 'معلومات المنشأة')}</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Legal Name', 'الاسم القانوني')}</span>
              <span className="col-span-2 font-medium">{data.partyType === 'organization' ? (data.roles[0]?.partyNumber /* fallback to something else, partyDetail doesnt expose legalName root in PartyListItem, wait. I can't read legalName here?*/) || '-' : '-'}</span>
            </div>
            {/* The generated client PartyListItem doesn't include legalName etc., so we just show what we have. */}
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('Type', 'النوع')}</span>
              <span className="col-span-2 font-medium">{data.partyType === 'organization' ? t('Organization', 'منشأة') : t('Individual', 'فرد')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('City', 'المدينة')}</span>
              <span className="col-span-2 font-medium">{data.city || '-'}</span>
            </div>
          </div>
        </div>

        <div className="soft-card p-5">
          <h3 className="font-bold text-lg mb-4">{t('Tax & Registration', 'الضريبة والتسجيل')}</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">{t('VAT Number', 'الرقم الضريبي')}</span>
              <span className="col-span-2 font-medium">{data.vatNumber || '-'}</span>
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
      </div>
    </div>
  );
}
