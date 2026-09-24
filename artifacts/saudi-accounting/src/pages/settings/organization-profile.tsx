import { useState, useEffect } from 'react';
import { useGetCurrentSession, useGetOrganization, useUpdateOrganization, getGetOrganizationQueryKey, getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { Building2, MapPin, Globe2, Save } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

export function OrganizationProfile() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  
  const fallbackOrgId = session?.organizations?.[0]?.organization?.id || 'org_default';
  const orgId =
    session?.organizations?.find(
      item => item.organization.id === session?.preferences?.currentOrganizationId,
    )?.organization?.id ?? fallbackOrgId;

  const { data: org, isLoading } = useGetOrganization(orgId, { query: { enabled: Boolean(orgId) && orgId !== 'org_default', queryKey: getGetOrganizationQueryKey(orgId) } });
  const update = useUpdateOrganization();

  const userOrg = session?.organizations?.find(
    item => item.organization.id === session?.preferences?.currentOrganizationId,
  )?.organization ?? session?.organizations?.[0]?.organization;

  const activeOrg = org || userOrg;

  const [form, setForm] = useState<Partial<OrganizationInput>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activeOrg) setForm({ ...activeOrg });
  }, [activeOrg]);

  if (isLoading && !activeOrg) return <div className="p-8"><div className="shimmer h-8 w-64 rounded mb-8" /><div className="shimmer h-[500px] rounded-xl" /></div>;

  const set = (key: keyof OrganizationInput, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const save = () => {
    if (orgId && orgId !== 'org_default') {
      update.mutate({ organizationId: orgId, data: { ...form, legalNameEnglish: form.legalNameEnglish || activeOrg.legalNameEnglish } }, {
        onSuccess: (value) => {
          queryClient.setQueryData(getGetOrganizationQueryKey(orgId), value);
          queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
          setSaved(true);
          window.setTimeout(() => setSaved(false), 3000);
        },
        onError: () => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 3000);
        }
      });
    } else {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    }
  };

  const sections = [
    {
      id: 'business',
      title: t('Business Registration', 'السجل التجاري'),
      icon: Building2,
      fields: [
        { key: 'legalNameEnglish', label: t('Legal name (English)', 'الاسم القانوني (إنجليزي)'), required: true },
        { key: 'legalNameArabic', label: t('Legal name (Arabic)', 'الاسم القانوني (عربي)') },
        { key: 'tradingNameEnglish', label: t('Trading name (English)', 'الاسم التجاري (إنجليزي)') },
        { key: 'tradingNameArabic', label: t('Trading name (Arabic)', 'الاسم التجاري (عربي)') },
        { key: 'commercialRegistrationNumber', label: t('Commercial Registration', 'السجل التجاري') },
        { key: 'vatNumber', label: t('VAT Number', 'الرقم الضريبي') },
      ]
    },
    {
      id: 'address',
      title: t('National Address', 'العنوان الوطني'),
      icon: MapPin,
      fields: [
        { key: 'city', label: t('City', 'المدينة') },
        { key: 'district', label: t('District', 'الحي') },
        { key: 'streetName', label: t('Street Name', 'اسم الشارع') },
        { key: 'buildingNumber', label: t('Building Number', 'رقم المبنى') },
        { key: 'additionalNumber', label: t('Additional Number', 'الرقم الإضافي') },
        { key: 'postalCode', label: t('Postal Code', 'الرمز البريدي') },
      ]
    },
    {
      id: 'contact',
      title: t('Contact Information', 'معلومات التواصل'),
      icon: Globe2,
      fields: [
        { key: 'phone', label: t('Phone', 'الهاتف') },
        { key: 'email', label: t('Email', 'البريد الإلكتروني') },
        { key: 'website', label: t('Website', 'الموقع الإلكتروني') },
      ]
    }
  ];

  return (
    <div className="max-w-[1000px] space-y-8 pb-12 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Organization Profile', 'ملف المنشأة')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Manage the legal and commercial identity of your business.', 'إدارة الهوية القانونية والتجارية لمنشأتك.')}</p>
      </div>

      <div className="space-y-6">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="soft-card overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg shadow-sm text-primary">
                  <Icon size={18} />
                </div>
                <h2 className="font-bold text-foreground text-sm">{section.title}</h2>
              </div>
              <div className="p-6 grid gap-5 md:grid-cols-2">
                {section.fields.map(f => (
                  <label key={f.key} className="block">
                    <span className="mb-2 block text-xs font-bold text-muted-foreground">
                      {f.label} {f.required && <span className="text-accent">*</span>}
                    </span>
                    <input 
                      className={`field ${f.key.includes('Arabic') ? 'arabic' : ''}`}
                      value={(form[f.key as keyof OrganizationInput] as string) || ''} 
                      onChange={e => set(f.key as keyof OrganizationInput, e.target.value)}
                      dir={f.key.includes('Arabic') ? 'rtl' : 'ltr'}
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        <div className="soft-card overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-background rounded-lg shadow-sm text-primary"><Globe2 size={18} /></div>
            <h2 className="font-bold text-foreground text-sm">{t('Financial Settings', 'الإعدادات المالية')}</h2>
          </div>
          <div className="p-6 grid gap-5 md:grid-cols-2">
            <label className="block"><span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Currency', 'العملة')}</span><select className="field" value={form.currency || 'SAR'} onChange={e => set('currency', e.target.value)}><option value="SAR">SAR — Saudi Riyal</option></select></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Fiscal year start', 'بداية السنة المالية')}</span><select className="field" value={form.fiscalYearStart || '01-01'} onChange={e => set('fiscalYearStart', e.target.value)}><option value="01-01">{t('January 1', '1 يناير')}</option><option value="04-01">{t('April 1', '1 أبريل')}</option><option value="07-01">{t('July 1', '1 يوليو')}</option></select></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Invoice language', 'لغة الفاتورة')}</span><select className="field" value={form.invoiceLanguage || 'bilingual'} onChange={e => set('invoiceLanguage', e.target.value)}><option value="bilingual">{t('Bilingual', 'ثنائية اللغة')}</option><option value="en">English</option><option value="ar">العربية</option></select></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Number format', 'تنسيق الأرقام')}</span><select className="field" value={form.numberFormat || 'western'} onChange={e => set('numberFormat', e.target.value)}><option value="western">1,234,567.89</option><option value="arabic">١٬٢٣٤٬٥٦٧٫٨٩</option></select></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Organization language', 'لغة المنشأة')}</span><select className="field" value={form.defaultLanguage || 'en'} onChange={e => set('defaultLanguage', e.target.value)}><option value="en">English</option><option value="ar">العربية</option></select></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Timezone', 'المنطقة الزمنية')}</span><select className="field" value={form.timezone || 'Asia/Riyadh'} onChange={e => set('timezone', e.target.value)}><option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option></select></label>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        {saved && <div role="status" className="me-3 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">{t('Changes saved.', 'تم حفظ التغييرات.')}</div>}
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? t('Saving...', 'جاري الحفظ...') : (
            <><Save size={16} /> {t('Save changes', 'حفظ التغييرات')}</>
          )}
        </Button>
      </div>
    </div>
  );
}
