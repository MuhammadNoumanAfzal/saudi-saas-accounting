import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetCurrentSession, useCreateOrganization, useUpdateOrganization, useUpdateUserPreferences } from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { Button, useTranslation } from '@/lib/utils';
import { Check, ArrowRight, ArrowLeft, Building2, Globe2, Landmark } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

export function Onboarding() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const create = useCreateOrganization();
  const update = useUpdateOrganization();
  const updatePreferences = useUpdateUserPreferences();
  const createNew = new URLSearchParams(window.location.search).get('new') === '1';
  const selectedOrganization =
    session?.organizations?.find(
      item => item.organization.id === session.preferences.currentOrganizationId,
    )?.organization ?? session?.organizations?.[0]?.organization;
  const [createdOrganizationId, setCreatedOrganizationId] = useState<string>();
  
  const existingOrgId = createNew ? createdOrganizationId : (createdOrganizationId || selectedOrganization?.id);
  const existingOrg = createNew ? undefined : selectedOrganization;

  const [form, setForm] = useState<Partial<OrganizationInput>>({
    legalNameEnglish: '',
    legalNameArabic: '',
    tradingNameEnglish: '',
    tradingNameArabic: '',
    businessType: 'limited_liability_company',
    country: 'Saudi Arabia',
    city: '',
    vatRegistered: false,
    currency: 'SAR',
    defaultLanguage: 'en',
    timezone: 'Asia/Riyadh',
    fiscalYearStart: '01-01',
    numberFormat: 'western',
    invoiceLanguage: 'bilingual'
  });

  useEffect(() => {
    if (existingOrg && step === 1 && !createNew) {
      setForm({ ...existingOrg });
    }
  }, [existingOrg, createNew, step]);

  const updateField = (key: keyof OrganizationInput, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (step === 1 && !existingOrgId) {
      create.mutate({ data: { legalNameEnglish: form.legalNameEnglish || '', ...form } as OrganizationInput }, {
        onSuccess: (org) => {
          setCreatedOrganizationId(org.id);
          updatePreferences.mutate(
            { data: { currentOrganizationId: org.id } },
            {
              onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
                setStep(2);
              },
            },
          );
        }
      });
    } else if (existingOrgId) {
      // Background save step data
      update.mutate({ organizationId: existingOrgId, data: { ...form, legalNameEnglish: form.legalNameEnglish || existingOrg!.legalNameEnglish } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
          setStep(step + 1);
        }
      });
    } else {
      setStep(step + 1);
    }
  };

  const submitFinal = () => {
    if (!existingOrgId) return;
    update.mutate({ organizationId: existingOrgId, data: { ...form, legalNameEnglish: form.legalNameEnglish || existingOrg?.legalNameEnglish || '', onboardingCompleted: true } }, {
      onSuccess: () => {
        updatePreferences.mutate(
          {
            data: {
              currentOrganizationId: existingOrgId,
              language: form.defaultLanguage ?? 'en',
            },
          },
          {
            onSuccess: async () => {
              await queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
              setLocation('/dashboard');
            },
          },
        );
      }
    });
  };

  const progress = (step / 5) * 100;

  return (
    <div className={`min-h-[100dvh] bg-background flex flex-col ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="px-6 py-6 flex justify-between items-center max-w-[960px] w-full mx-auto">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Mizan" className="w-8 h-8 rounded-lg" />
          <span className="font-bold tracking-tight text-xl">mizan<span className="text-accent">.</span></span>
        </div>
        <div className="text-xs font-semibold text-muted-foreground">
          {t(`Step ${step} of 5`, `الخطوة ${step} من 5`)}
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-[700px] w-full mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-8">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            {step === 1 && t('Tell us about the business.', 'أخبرنا عن المنشأة.')}
            {step === 2 && t('Tax & Registration.', 'الضرائب والتسجيل.')}
            {step === 3 && t('National Address.', 'العنوان الوطني.')}
            {step === 4 && t('Accounting Preferences.', 'تفضيلات المحاسبة.')}
            {step === 5 && t('Ready to begin.', 'جاهز للبدء.')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 1 && t('Start with the names that make your organization official.', 'ابدأ بالأسماء التي تجعل منشأتك رسمية.')}
            {step === 2 && t('Your tax information will appear on applicable invoices and tax documents.', 'ستظهر معلوماتك الضريبية في الفواتير والمستندات الضريبية ذات الصلة.')}
            {step === 3 && t('Your official address for billing and compliance.', 'عنوانك الرسمي للفوترة والامتثال.')}
            {step === 4 && t('Set your working region and currency rules.', 'قم بتعيين منطقة عملك وقواعد العملة.')}
            {step === 5 && t('Review your settings before we generate your workspace.', 'راجع إعداداتك قبل أن نقوم بإنشاء مساحة العمل الخاصة بك.')}
          </p>
        </div>

        <div className="flex-1">
          {step === 1 && (
            <div className="space-y-6 fade-up">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Legal name (English)', 'الاسم القانوني (إنجليزي)')} <span className="text-accent">*</span></span>
                  <input className="field" value={form.legalNameEnglish || ''} onChange={e => updateField('legalNameEnglish', e.target.value)} placeholder="Company LLC" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Legal name (Arabic)', 'الاسم القانوني (عربي)')}</span>
                  <input className="field arabic" value={form.legalNameArabic || ''} onChange={e => updateField('legalNameArabic', e.target.value)} placeholder="شركة ذ.م.م" dir="rtl" />
                </label>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Trading name (English)', 'الاسم التجاري (إنجليزي)')}</span>
                  <input className="field" value={form.tradingNameEnglish || ''} onChange={e => updateField('tradingNameEnglish', e.target.value)} placeholder="Store Name" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Trading name (Arabic)', 'الاسم التجاري (عربي)')}</span>
                  <input className="field arabic" value={form.tradingNameArabic || ''} onChange={e => updateField('tradingNameArabic', e.target.value)} placeholder="اسم المتجر" dir="rtl" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Business Type', 'نوع الكيان')}</span>
                <select className="field" value={form.businessType || ''} onChange={e => updateField('businessType', e.target.value)}>
                  <option value="establishment">{t('Establishment', 'مؤسسة')}</option>
                  <option value="limited_liability_company">{t('Limited Liability Company (LLC)', 'شركة ذات مسؤولية محدودة')}</option>
                  <option value="joint_stock_company">{t('Joint Stock Company', 'شركة مساهمة')}</option>
                  <option value="professional_company">{t('Professional Company', 'شركة مهنية')}</option>
                  <option value="non_profit">{t('Non-Profit', 'غير ربحية')}</option>
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 fade-up">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('VAT registered?', 'مسجل في ضريبة القيمة المضافة؟')}</span>
                <button type="button" className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-colors ${form.vatRegistered ? 'border-primary bg-primary/5' : 'border-border bg-card'}`} onClick={() => updateField('vatRegistered', !form.vatRegistered)}>
                  <span>{form.vatRegistered ? t('Yes, registered', 'نعم، مسجل') : t('Not yet / not applicable', 'ليس بعد / غير مطبق')}</span>
                  <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${form.vatRegistered ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${form.vatRegistered ? (isRtl ? '-translate-x-4' : 'translate-x-4') : ''}`} />
                  </span>
                </button>
              </label>

              {form.vatRegistered && (
                <label className="block fade-up">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('VAT Number', 'الرقم الضريبي')}</span>
                  <input className="field" value={form.vatNumber || ''} onChange={e => updateField('vatNumber', e.target.value)} placeholder="15 digits starting with 3" maxLength={15} />
                   {form.vatNumber && !/^3\d{13}3$/.test(form.vatNumber) && <span className="text-[10px] text-destructive mt-1 block">{t('Enter 15 digits beginning and ending with 3.', 'أدخل 15 رقماً تبدأ وتنتهي بالرقم 3.')}</span>}
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Commercial Registration (CR)', 'السجل التجاري')}</span>
                <input className="field" value={form.commercialRegistrationNumber || ''} onChange={e => updateField('commercialRegistrationNumber', e.target.value)} placeholder="10 digits" maxLength={10} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 fade-up">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('City', 'المدينة')}</span>
                  <input className="field" value={form.city || ''} onChange={e => updateField('city', e.target.value)} placeholder={t('Riyadh', 'الرياض')} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('District', 'الحي')}</span>
                  <input className="field" value={form.district || ''} onChange={e => updateField('district', e.target.value)} placeholder={t('Al Olaya', 'العليا')} />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Street Name', 'اسم الشارع')}</span>
                <input className="field" value={form.streetName || ''} onChange={e => updateField('streetName', e.target.value)} placeholder={t('King Fahd Road', 'طريق الملك فهد')} />
              </label>
              <div className="grid gap-6 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Building', 'رقم المبنى')}</span>
                  <input className="field" value={form.buildingNumber || ''} onChange={e => updateField('buildingNumber', e.target.value)} placeholder="1234" maxLength={4} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Additional', 'الرقم الإضافي')}</span>
                  <input className="field" value={form.additionalNumber || ''} onChange={e => updateField('additionalNumber', e.target.value)} placeholder="1234" maxLength={4} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Postal Code', 'الرمز البريدي')}</span>
                  <input className="field" value={form.postalCode || ''} onChange={e => updateField('postalCode', e.target.value)} placeholder="12345" maxLength={5} />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 fade-up">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Base Currency', 'العملة الأساسية')}</span>
                  <select className="field bg-muted cursor-not-allowed" value={form.currency} disabled>
                    <option value="SAR">SAR — Saudi Riyal</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Workspace Language', 'لغة مساحة العمل')}</span>
                  <select className="field" value={form.defaultLanguage} onChange={e => updateField('defaultLanguage', e.target.value)}>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Number Format', 'تنسيق الأرقام')}</span>
                  <select className="field" value={form.numberFormat} onChange={e => updateField('numberFormat', e.target.value)}>
                    <option value="western">1,234,567.89</option>
                    <option value="arabic">١٬٢٣٤٬٥٦٧٫٨٩</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Timezone', 'المنطقة الزمنية')}</span>
                  <select className="field bg-muted cursor-not-allowed" value={form.timezone} disabled>
                    <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Invoice Language', 'لغة الفاتورة')}</span>
                  <select className="field" value={form.invoiceLanguage} onChange={e => updateField('invoiceLanguage', e.target.value)}>
                    <option value="bilingual">{t('Bilingual (Arabic & English)', 'ثنائية (عربي وإنجليزي)')}</option>
                    <option value="ar">{t('Arabic Only', 'عربي فقط')}</option>
                    <option value="en">{t('English Only', 'إنجليزي فقط')}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">{t('Fiscal Year Start', 'بداية السنة المالية')}</span>
                  <select className="field" value={form.fiscalYearStart} onChange={e => updateField('fiscalYearStart', e.target.value)}>
                    <option value="01-01">{t('January 1st', '1 يناير')}</option>
                    <option value="04-01">{t('April 1st', '1 أبريل')}</option>
                    <option value="07-01">{t('July 1st', '1 يوليو')}</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 fade-up">
              <div className="soft-card p-6 border border-border">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{isRtl ? (form.legalNameArabic || form.legalNameEnglish) : form.legalNameEnglish}</div>
                    <div className="text-sm text-muted-foreground">{form.businessType?.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">{t('VAT Status', 'حالة الضريبة')}</span>
                    <span className="font-medium">{form.vatRegistered ? form.vatNumber : t('Not registered', 'غير مسجل')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">{t('Commercial Registration', 'السجل التجاري')}</span>
                    <span className="font-medium">{form.commercialRegistrationNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">{t('Location', 'الموقع')}</span>
                    <span className="font-medium">{form.city || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">{t('Accounting', 'المحاسبة')}</span>
                    <span className="font-medium">{form.currency} • {form.invoiceLanguage}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              {isRtl ? <><ArrowRight size={16} /> {t('Back', 'السابق')}</> : <><ArrowLeft size={16} /> {t('Back', 'السابق')}</>}
            </Button>
          ) : <div />}

          {step < 5 ? (
            <Button onClick={handleNext} disabled={(step === 1 && !form.legalNameEnglish) || (step === 2 && !!form.vatRegistered && !/^3\d{13}3$/.test(form.vatNumber || '')) || create.isPending || update.isPending || updatePreferences.isPending}>
              {create.isPending || update.isPending ? t('Saving...', 'جاري الحفظ...') : t('Continue', 'متابعة')}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Button>
          ) : (
            <Button onClick={submitFinal} disabled={update.isPending}>
              {update.isPending ? t('Finishing...', 'جاري الإنهاء...') : t('Complete Setup', 'إكمال الإعداد')}
              <Check size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
