import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  useGetCurrentSession,
  useCreateOrganization,
  useUpdateOrganization,
  useUpdateUserPreferences,
  getGetCurrentSessionQueryKey,
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { useTranslation } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Globe2, ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

import { OnboardingSidebar } from '@/components/onboarding/onboarding-sidebar';
import { Step1BusinessInfo } from '@/components/onboarding/step-1-business-info';
import { Step2TaxCr } from '@/components/onboarding/step-2-tax-cr';
import { Step3NationalAddress } from '@/components/onboarding/step-3-national-address';
import { Step4Accounting } from '@/components/onboarding/step-4-accounting';
import { Step5Review } from '@/components/onboarding/step-5-review';

export function Onboarding() {
  const { data: session } = useGetCurrentSession();
  const { lang: initialLang } = useTranslation();
  const [language, setLanguage] = useState(initialLang || 'en');
  const isRtl = language === 'ar';
  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_onboarding_step');
    return saved ? Math.min(Math.max(parseInt(saved, 10), 1), 5) : 1;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateOrganization();
  const update = useUpdateOrganization();
  const updatePreferences = useUpdateUserPreferences();
  const createNew = new URLSearchParams(window.location.search).get('new') === '1';

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ar' : 'en';
    setLanguage(nextLang);
    setForm(prev => ({ ...prev, defaultLanguage: nextLang }));
    updatePreferences.mutate({ data: { language: nextLang } });
  };

  const selectedOrganization =
    session?.organizations?.find(
      item => item.organization.id === session.preferences.currentOrganizationId,
    )?.organization ?? session?.organizations?.[0]?.organization;

  const [createdOrganizationId, setCreatedOrganizationId] = useState<string>(() => {
    return localStorage.getItem('nexus_onboarding_org_id') || '';
  });

  const existingOrgId = createNew ? createdOrganizationId : (createdOrganizationId || selectedOrganization?.id);
  const existingOrg = createNew ? undefined : selectedOrganization;

  const [form, setForm] = useState<Partial<OrganizationInput>>(() => {
    const saved = localStorage.getItem('nexus_onboarding_form');
    let parsed = {};
    if (saved) {
      try { parsed = JSON.parse(saved); } catch {}
    }
    return {
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
      invoiceLanguage: 'bilingual',
      ...parsed
    };
  });

  useEffect(() => {
    localStorage.setItem('nexus_onboarding_step', step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem('nexus_onboarding_form', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (existingOrg && !createNew) {
      setForm(prev => ({ ...existingOrg, ...prev }));
    }
  }, [existingOrg, createNew]);

  const updateField = (key: keyof OrganizationInput, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (step === 1) {
      if (!form.legalNameEnglish?.trim()) {
        const errMsg = t('Company Legal Name (English) is required.', 'الاسم القانوني للمنشأة (إنجليزي) مطلوب.');
        setErrors({ legalNameEnglish: errMsg });
        showAlert.error(
          t('Required Field Missing', 'حقل مطلوب ناقص'),
          t('Please enter your Company Legal Name (English) before continuing.', 'يرجى إدخال الاسم القانوني للمنشأة باللغة الإنجليزية للمتابعة.')
        );
        return;
      }
      setErrors({});
    } else if (step === 2) {
      if (!form.commercialRegistrationNumber?.trim() || !/^\d{10}$/.test(form.commercialRegistrationNumber || '')) {
        const errMsg = t('Commercial Registration (CR) must be 10 digits.', 'رقم السجل التجاري يجب أن يكون 10 أرقام.');
        setErrors({ commercialRegistrationNumber: errMsg });
        showAlert.error(
          t('Invalid CR Number', 'سجل تجاري غير صحيح'),
          t('Commercial Registration Number (CR) is required and must be 10 digits (e.g. 1010123456).', 'رقم السجل التجاري مطلوب ويجب أن يكون 10 أرقام (مثال: 1010123456).')
        );
        return;
      }
      if (form.vatRegistered && !/^3\d{13}3$/.test(form.vatNumber || '')) {
        const errMsg = t('ZATCA VAT TIN must be 15 digits starting & ending with 3.', 'الرقم الضريبي لـ ZATCA يجب أن يكون 15 رقماً يبدأ وينتهي بـ 3.');
        setErrors({ vatNumber: errMsg });
        showAlert.error(
          t('Invalid VAT Number', 'الرقم الضريبي غير صحيح'),
          t('ZATCA Tax Identification Number must be 15 digits starting and ending with 3 (e.g. 300123456700003).', 'الرقم الضريبي يجب أن يكون 15 رقماً يبدأ وينتهي بالرقم 3 (مثال: 300123456700003).')
        );
        return;
      }
      setErrors({});
    } else if (step === 3) {
      const step3Errors: Record<string, string> = {};
      if (!form.city?.trim()) step3Errors.city = t('City is required', 'المدينة مطلوبة');
      if (!form.district?.trim()) step3Errors.district = t('District is required', 'الحي مطلوب');
      if (!form.streetName?.trim()) step3Errors.streetName = t('Street Name is required', 'اسم الشارع مطلوب');
      if (!form.buildingNumber?.trim()) step3Errors.buildingNumber = t('Building No. is required', 'رقم المبنى مطلوب');
      if (!form.postalCode?.trim()) step3Errors.postalCode = t('Postal Code is required', 'الرمز البريدي مطلوب');

      if (Object.keys(step3Errors).length > 0) {
        setErrors(step3Errors);
        showAlert.error(
          t('National Address Incomplete', 'العنوان الوطني غير مكتمل'),
          t('Please fill out all required Saudi National Address fields (City, District, Street Name, Building No., and Postal Code) before continuing.', 'يرجى إكمال جميع بيانات العنوان الوطني المطلوب (المدينة، الحي، اسم الشارع، رقم المبنى، والرمز البريدي) للمتابعة.')
        );
        return;
      }
      setErrors({});
    }

    if (step === 1 && !existingOrgId) {
      create.mutate({ data: { legalNameEnglish: form.legalNameEnglish || '', ...form } as OrganizationInput }, {
        onSuccess: (org) => {
          setCreatedOrganizationId(org.id);
          localStorage.setItem('nexus_onboarding_org_id', org.id);
          updatePreferences.mutate(
            { data: { currentOrganizationId: org.id } },
            {
              onSuccess: async () => {
                queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
                setStep(2);
              },
            },
          );
        },
        onError: (err: any) => {
          showAlert.error(t('Creation Failed', 'فشل الإنشـاء'), err?.message || 'Failed to create organization');
        }
      });
    } else if (existingOrgId) {
      setStep(prev => Math.min(prev + 1, 5));
      update.mutate({ organizationId: existingOrgId, data: { ...form, legalNameEnglish: form.legalNameEnglish || existingOrg?.legalNameEnglish || 'Organization' } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
        }
      });
    } else {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const submitFinal = () => {
    if (!existingOrgId) return;
    update.mutate({ organizationId: existingOrgId, data: { ...form, legalNameEnglish: form.legalNameEnglish || existingOrg?.legalNameEnglish || 'Organization', onboardingCompleted: true } }, {
      onSuccess: () => {
        localStorage.removeItem('nexus_onboarding_step');
        localStorage.removeItem('nexus_onboarding_form');
        localStorage.removeItem('nexus_onboarding_org_id');
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
              setLocation('/finance');
            },
          },
        );
      }
    });
  };

  return (
    <div className={`min-h-screen w-full bg-background flex flex-col lg:flex-row text-foreground ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left Stepper Sidebar Sub-Component */}
      <OnboardingSidebar step={step} setStep={setStep} isRtl={isRtl} t={t} />

      {/* Right Active Form Area */}
      <main className="flex-1 flex flex-col justify-between bg-card p-6 sm:p-12 overflow-y-auto">
        <div>
          {/* Top Header Controls */}
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-xs font-bold text-primary tracking-wider uppercase">
                {t(`Step 0${step} of 05`, `الخطوة 0${step} من 05`)}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleLanguage}
              className="px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Globe2 size={14} className="text-primary" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {step === 1 && t('Tell us about your business', 'أخبرنا عن المنشأة التجارية')}
              {step === 2 && t('Tax & Commercial Registration', 'الضرائب بالسعودية والسجل التجاري')}
              {step === 3 && t('Saudi National Address', 'العنوان الوطني الرسمي بالسعودية')}
              {step === 4 && t('Accounting & Compliance Preferences', 'تفضيلات المحاسبة والفوترة')}
              {step === 5 && t('Ready to Launch Workspace', 'إعداد مساحة العمل جاهز للبدء')}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {step === 1 && t('Enter your official company names as registered with the Saudi Ministry of Commerce.', 'أدخل الأسماء الرسمية لمنشأتك كما هي مسجلة لدى وزارة التجارة السعودية.')}
              {step === 2 && t('Your VAT TIN and CR numbers are required for ZATCA Phase 2 e-invoicing compliance.', 'الرقم الضريبي والسجل التجاري متطلبان للفواتير الإلكترونية المرحلة الثانية.')}
              {step === 3 && t('Provide your official Saudi Post (SPL) registered national address details.', 'أدخل العنوان الوطني المسجل في البريد السعودي للفوترة والامتثال.')}
              {step === 4 && t('Set your base currency, fiscal calendar opening month, and default invoice layout.', 'حدد العملة الأساسية والسنة المالية ولغة الفواتير افتراضياً.')}
              {step === 5 && t('Review your registered information before initializing your accounting workspace.', 'راجع جميع التفاصيل قبل بدء إنشاء قاعدة بيانات المحاسبة.')}
            </p>
          </div>

          {/* Render Active Step Sub-Component */}
          {step === 1 && <Step1BusinessInfo form={form} updateField={updateField} errors={errors} setErrors={setErrors} t={t} />}
          {step === 2 && <Step2TaxCr form={form} updateField={updateField} errors={errors} setErrors={setErrors} isRtl={isRtl} t={t} />}
          {step === 3 && <Step3NationalAddress form={form} updateField={updateField} errors={errors} setErrors={setErrors} t={t} />}
          {step === 4 && <Step4Accounting form={form} updateField={updateField} t={t} />}
          {step === 5 && <Step5Review form={form} isRtl={isRtl} t={t} />}
        </div>

        {/* Footer Navigation Bar */}
        <div className="mt-10 pt-6 pb-6 border-t border-border flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-2"
            >
              {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
              <span>{t('Back', 'السابق')}</span>
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={create.isPending || update.isPending || updatePreferences.isPending}
              className="btn-primary text-xs font-bold px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer"
            >
              <span>{create.isPending || update.isPending ? t('Saving...', 'جاري الحفظ...') : t('Continue to Next Step', 'المتابعة للخطوة التالية')}</span>
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={submitFinal}
              disabled={update.isPending}
              className="btn-primary text-sm font-extrabold px-8 py-3 flex items-center gap-2.5 shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              <span>{update.isPending ? t('Initializing Workspace...', 'جاري تهيئة مساحة العمل...') : t('Launch Organization Workspace', 'إطلاق مساحة عمل المنشأة')}</span>
              <ArrowUpRight size={18} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
