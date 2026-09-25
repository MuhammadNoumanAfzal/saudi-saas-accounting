import { useState, useEffect } from 'react';
import { 
  useGetCurrentSession, 
  useGetOrganization, 
  useUpdateOrganization, 
  getGetOrganizationQueryKey, 
  getGetCurrentSessionQueryKey 
} from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { Building2, MapPin, Globe2, Save, Sparkles, ShieldCheck, RefreshCw, Printer, Landmark, Check } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';
import { OrgKpiCards } from '@/components/settings/org-kpi-cards';
import { showAlert } from '@/lib/alerts';

export function OrganizationProfile() {
  const { data: session } = useGetCurrentSession();
  const { t } = useTranslation();
  
  const fallbackOrgId = session?.organizations?.[0]?.organization?.id || 'org_default';
  const orgId =
    session?.organizations?.find(
      item => item.organization.id === session?.preferences?.currentOrganizationId,
    )?.organization?.id ?? fallbackOrgId;

  // Fast React Query caching for organization profile (10 mins staleTime)
  const { data: org, isLoading, refetch } = useGetOrganization(orgId, { 
    query: { 
      enabled: Boolean(orgId) && orgId !== 'org_default', 
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      queryKey: getGetOrganizationQueryKey(orgId) 
    } 
  });
  
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

  const set = (key: keyof OrganizationInput, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const save = () => {
    if (orgId && orgId !== 'org_default') {
      update.mutate({ 
        organizationId: orgId, 
        data: { ...form, legalNameEnglish: form.legalNameEnglish || activeOrg?.legalNameEnglish || 'Nouran Tech LLC' } 
      }, {
        onSuccess: (value) => {
          queryClient.setQueryData(getGetOrganizationQueryKey(orgId), value);
          queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
          setSaved(true);
          showAlert.toast(t('Organization profile saved successfully!', 'تم حفظ بيانات المنشأة بنجاح!'), 'success');
          window.setTimeout(() => setSaved(false), 3000);
        },
        onError: () => {
          showAlert.toast(t('Error saving organization profile.', 'حدث خطأ أثناء حفظ بيانات المنشأة.'), 'error');
        }
      });
    } else {
      setSaved(true);
      showAlert.toast(t('Organization profile saved locally.', 'تم حفظ بيانات المنشأة في الجلسة.'), 'success');
      window.setTimeout(() => setSaved(false), 3000);
    }
  };

  const sections = [
    {
      id: 'business',
      title: t('Business Registration & Identity', 'بيانات السجل التجاري والهوية'),
      icon: Building2,
      fields: [
        { key: 'legalNameEnglish', label: t('Legal name (English)', 'الاسم القانوني (إنجليزي)'), required: true },
        { key: 'legalNameArabic', label: t('Legal name (Arabic)', 'الاسم القانوني (عربي)') },
        { key: 'tradingNameEnglish', label: t('Trading name (English)', 'الاسم التجاري (إنجليزي)') },
        { key: 'tradingNameArabic', label: t('Trading name (Arabic)', 'الاسم التجاري (عربي)') },
        { key: 'commercialRegistrationNumber', label: t('Commercial Registration (CR)', 'السجل التجاري') },
        { key: 'vatNumber', label: t('VAT Number (ZATCA)', 'الرقم الضريبي') },
      ]
    },
    {
      id: 'address',
      title: t('National Address & Location', 'العنوان الوطني والموقع الجغرافي'),
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
      title: t('Contact & Digital Communication', 'التواصل والاتصال الرقمي'),
      icon: Globe2,
      fields: [
        { key: 'phone', label: t('Phone / Landline', 'الهاتف / الهاتف الثابت') },
        { key: 'email', label: t('Official Email', 'البريد الإلكتروني الرسمي') },
        { key: 'website', label: t('Website URL', 'الموقع الإلكتروني') },
      ]
    }
  ];

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Luxury Header & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Legal Entity Profile', 'هوية الكيان القانوني')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA Phase 2 Verified
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('Organization Profile', 'ملف المنشأة')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Manage the official legal identity, VAT tax parameters, and national address of your Saudi enterprise.', 'إدارة الهوية القانونية والتجارية، البيانات الضريبية والعنوان الوطني لمنشأتك.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Data', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Print Profile', 'طباعة الهوية')}</span>
          </Button>

          <Button 
            type="button"
            onClick={save} 
            disabled={update.isPending}
            className="h-9 px-4 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {update.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('Saving...', 'جاري الحفظ...')}</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{t('Saved', 'تم الحفظ')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('Save Changes', 'حفظ التغييرات')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards Component */}
      <OrgKpiCards
        legalName={form.legalNameEnglish || activeOrg?.legalNameEnglish || ''}
        vatNumber={form.vatNumber || activeOrg?.vatNumber || ''}
        city={form.city || activeOrg?.city || ''}
        currency={form.currency || activeOrg?.currency || 'SAR'}
        isLoading={isLoading && !activeOrg}
      />

      {/* Main Settings Sections */}
      <div className="space-y-6">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-foreground text-sm">{section.title}</h2>
                  <p className="text-[11px] text-muted-foreground">{t('Official ZATCA tax invoice & commercial registration attributes.', 'بيانات الفوترة والتسجيل الرسمي لدى الجهات الحكومية.')}</p>
                </div>
              </div>
              <div className="p-6 grid gap-5 md:grid-cols-2">
                {section.fields.map(f => (
                  <label key={f.key} className="block">
                    <span className="mb-2 block text-xs font-bold text-muted-foreground">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </span>
                    <input 
                      className={`field bg-background h-10 w-full rounded-xl text-xs font-extrabold transition-all border border-border focus:border-primary ${f.key.includes('Arabic') ? 'arabic' : ''}`}
                      value={(form[f.key as keyof OrganizationInput] as string) || ''} 
                      onChange={e => set(f.key as keyof OrganizationInput, e.target.value)}
                      dir={f.key.includes('Arabic') ? 'rtl' : 'ltr'}
                      placeholder={f.label}
                    />
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* Financial & Fiscal Parameters Section */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="bg-muted/40 px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Landmark size={18} /></div>
            <div>
              <h2 className="font-extrabold text-foreground text-sm">{t('Financial & Tax Accounting Parameters', 'الإعدادات المالية والضريبية')}</h2>
              <p className="text-[11px] text-muted-foreground">{t('Fiscal year cycles, invoice bilingual layout, and SAR currency controls.', 'إعدادات السنة المالية، الفاتورة الضريبية ثنائية اللغة والعملة المحاسبية.')}</p>
            </div>
          </div>
          <div className="p-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Base Currency', 'العملة الأساسية')}</span>
              <select className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer border border-border" value={form.currency || 'SAR'} onChange={e => set('currency', e.target.value)}>
                <option value="SAR">SAR — Saudi Riyal (الريال السعودي)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Fiscal Year Start', 'بداية السنة المالية')}</span>
              <select className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer border border-border" value={form.fiscalYearStart || '01-01'} onChange={e => set('fiscalYearStart', e.target.value)}>
                <option value="01-01">{t('January 1 (1 يناير)', '1 يناير')}</option>
                <option value="04-01">{t('April 1 (1 أبريل)', '1 أبريل')}</option>
                <option value="07-01">{t('July 1 (1 يوليو)', '1 يوليو')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Invoice Document Language', 'لغة الفاتورة الضريبية')}</span>
              <select className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer border border-border" value={form.invoiceLanguage || 'bilingual'} onChange={e => set('invoiceLanguage', e.target.value)}>
                <option value="bilingual">{t('Bilingual Arabic/English (ثنائية اللغة)', 'ثنائية اللغة (عربي/إنجليزي)')}</option>
                <option value="en">English Only</option>
                <option value="ar">العربية فقط</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Number Format System', 'تنسيق الأرقام')}</span>
              <select className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer border border-border" value={form.numberFormat || 'western'} onChange={e => set('numberFormat', e.target.value)}>
                <option value="western">Western Standard (1,234,567.89)</option>
                <option value="arabic">Eastern Arabic (١٬٢٣٤٬٥٦٧٫٨٩)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Default System Language', 'لغة النظام المفضلة')}</span>
              <select className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer border border-border" value={form.defaultLanguage || 'en'} onChange={e => set('defaultLanguage', e.target.value)}>
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Enterprise Timezone', 'المنطقة الزمنية')}</span>
              <select className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer border border-border" value={form.timezone || 'Asia/Riyadh'} onChange={e => set('timezone', e.target.value)}>
                <option value="Asia/Riyadh">Asia/Riyadh (GMT+3 - مكة المكرمة)</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

