import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetCurrentSession, useCreateOrganization, useUpdateOrganization, useUpdateUserPreferences } from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { Button, useTranslation } from '@/lib/utils';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Globe2, 
  Landmark, 
  ShieldCheck, 
  MapPin, 
  Sliders, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Store,
  Briefcase,
  Layers,
  Calendar,
  Lock,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import type { OrganizationInput } from '@workspace/api-client-react';

export function Onboarding() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl, language, setLanguage } = useTranslation();
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
    if (existingOrg && !createNew) {
      setForm(prev => ({ ...existingOrg, ...prev }));
    }
  }, [existingOrg, createNew]);

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
                queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
                setStep(2);
              },
            },
          );
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

  const steps = [
    { id: 1, title: t('Business Info', 'معلومات الكيان'), desc: t('Legal & Trading Names', 'الأسماء الرسمية والتجارية'), icon: Building2 },
    { id: 2, title: t('Tax & CR', 'الضرائب والسجل'), desc: t('ZATCA VAT & Commercial Reg.', 'الرقم الضريبي والسجل التجاري'), icon: ShieldCheck },
    { id: 3, title: t('National Address', 'العنوان الوطني'), desc: t('Saudi Post SPL Address', 'عنوان البريد السعودي (سبل)'), icon: MapPin },
    { id: 4, title: t('Accounting', 'المحاسبة'), desc: t('SAR Currency & Defaults', 'عملة SAR وقواعد الفواتير'), icon: Sliders },
    { id: 5, title: t('Ready to Launch', 'جاهز للإطلاق'), desc: t('Review & Setup Workspace', 'مراجعة وتفعيل مساحة العمل'), icon: Sparkles },
  ];

  return (
    <div className={`min-h-screen w-full bg-background flex flex-col lg:flex-row text-foreground ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Left Brand & Stepper Timeline Side Panel */}
      <aside className="w-full lg:w-96 xl:w-[420px] sidebar-bg text-white p-6 sm:p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-500/10 via-transparent to-black/30 pointer-events-none" />

        <div className="relative z-10">
          {/* Logo & Platform Header */}
          <div className="flex items-center gap-3.5 mb-10">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shadow-lg">
              <img src="/logo.svg" alt="NEXUS" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-xl uppercase text-white">NEXUS</div>
              <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                <span>🇸🇦 Saudi Arabia ERP</span>
              </div>
            </div>
          </div>

          {/* Stepper Vertical Timeline */}
          <div className="space-y-6 relative">
            <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-white/15 z-0" dir="ltr" />

            {steps.map((s) => {
              const Icon = s.icon;
              const isCompleted = s.id < step;
              const isActive = s.id === step;

              return (
                <button
                  key={s.id}
                  onClick={() => s.id < step && setStep(s.id)}
                  disabled={s.id > step}
                  className={`w-full flex items-start gap-4 group text-left relative z-10 transition-all ${s.id < step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                      isActive
                        ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/30 ring-4 ring-emerald-400/20 scale-110'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 border border-white/15 text-white/50'
                    }`}
                  >
                    {isCompleted ? <Check size={16} className="stroke-[3]" /> : <Icon size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold transition-colors ${isActive ? 'text-white font-extrabold' : isCompleted ? 'text-emerald-200' : 'text-white/60'}`}>
                        {s.title}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50 truncate mt-0.5">
                      {s.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Compliance Badge */}
        <div className="relative z-10 mt-10 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white">ZATCA Phase 2 & SOCPA Ready</div>
            <div className="text-white/60 text-[11px]">Cryptographic Stamps & 15% VAT Compliant</div>
          </div>
        </div>
      </aside>

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
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-3.5 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-2"
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

          {/* Form Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6 fade-up max-w-2xl">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 size={14} className="text-primary" />
                    {t('Legal Name (English)', 'الاسم القانوني (إنجليزي)')}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    className="field focus:ring-2 focus:ring-primary/20 transition-all"
                    value={form.legalNameEnglish || ''}
                    onChange={e => updateField('legalNameEnglish', e.target.value)}
                    placeholder="e.g. Nouman Trading & Technology Co."
                  />
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
          )}

          {/* Form Step 2: Tax & CR */}
          {step === 2 && (
            <div className="space-y-6 fade-up max-w-2xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-primary" />
                  {t('Are you registered for Saudi VAT?', 'هل المنشأة مسجلة في ضريبة القيمة المضافة بالسعودية؟')}
                </label>
                <button
                  type="button"
                  className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${
                    form.vatRegistered
                      ? 'border-2 border-primary bg-primary/5 shadow-sm'
                      : 'border border-border bg-card hover:border-primary/40'
                  }`}
                  onClick={() => updateField('vatRegistered', !form.vatRegistered)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.vatRegistered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {form.vatRegistered ? <Check size={18} /> : <FileText size={18} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {form.vatRegistered ? t('Yes, VAT Registered (15% ZATCA Rate)', 'نعم، مسجل في ضريبة القيمة المضافة (15%)') : t('Not VAT Registered / Exempt', 'غير مسجل في الضريبة / معفى')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {form.vatRegistered ? t('Allows generating ZATCA Phase 2 E-Invoices with Tax QR code', 'يتيح إصدار الفواتير الإلكترونية المرحلة الثانية مع كود QR الضريبي') : t('Standard invoicing without tax breakdown', 'فواتير عادية بدون احتساب الضريبة')}
                      </div>
                    </div>
                  </div>
                  <div className={`h-6 w-11 rounded-full p-1 transition-colors ${form.vatRegistered ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform ${form.vatRegistered ? (isRtl ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                  </div>
                </button>
              </div>

              {form.vatRegistered && (
                <div className="space-y-2 fade-up">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText size={14} className="text-primary" />
                      {t('ZATCA VAT Registration Number (TIN)', 'الرقم الضريبي لدى هيئة الزكاة والضريبة (TIN)')}
                    </label>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      15 Digits (3...3)
                    </span>
                  </div>
                  <input
                    className="field focus:ring-2 focus:ring-primary/20 transition-all tracking-wider font-mono"
                    value={form.vatNumber || ''}
                    onChange={e => updateField('vatNumber', e.target.value)}
                    placeholder="310998877600003"
                    maxLength={15}
                  />
                  {form.vatNumber && !/^3\d{13}3$/.test(form.vatNumber) && (
                    <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1">
                      ⚠️ {t('Must be 15 digits starting and ending with 3.', 'يجب أن يكون 15 رقماً ويبدأ وينتهي بالرقم 3.')}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Landmark size={14} className="text-primary" />
                    {t('Commercial Registration Number (CR)', 'رقم السجل التجاري (CR)')}
                  </label>
                  <span className="text-[10px] font-semibold text-muted-foreground">10 Digits</span>
                </div>
                <input
                  className="field focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  value={form.commercialRegistrationNumber || ''}
                  onChange={e => updateField('commercialRegistrationNumber', e.target.value)}
                  placeholder="1010889922"
                  maxLength={10}
                />
              </div>
            </div>
          )}

          {/* Form Step 3: National Address */}
          {step === 3 && (
            <div className="space-y-5 fade-up max-w-2xl">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs text-foreground mb-2">
                <MapPin size={20} className="text-primary shrink-0" />
                <span>{t('Saudi Post (SPL) National Address parameters will be rendered on your ZATCA e-invoices.', 'عنوان البريد السعودي (سبل) سيتم طباعته على الفواتير الإلكترونية.')}</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t('City', 'المدينة')}</label>
                  <input className="field" value={form.city || ''} onChange={e => updateField('city', e.target.value)} placeholder="Riyadh / الرياض" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t('District', 'الحي')}</label>
                  <input className="field" value={form.district || ''} onChange={e => updateField('district', e.target.value)} placeholder="Al Olaya / العليا" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">{t('Street Name', 'اسم الشارع')}</label>
                <input className="field" value={form.streetName || ''} onChange={e => updateField('streetName', e.target.value)} placeholder="King Fahd Road / طريق الملك فهد" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t('Building No.', 'رقم المبنى')}</label>
                  <input className="field font-mono" value={form.buildingNumber || ''} onChange={e => updateField('buildingNumber', e.target.value)} placeholder="7240" maxLength={4} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t('Additional No.', 'الرقم الإضافي')}</label>
                  <input className="field font-mono" value={form.additionalNumber || ''} onChange={e => updateField('additionalNumber', e.target.value)} placeholder="3190" maxLength={4} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">{t('Postal Code', 'الرمز البريدي')}</label>
                  <input className="field font-mono" value={form.postalCode || ''} onChange={e => updateField('postalCode', e.target.value)} placeholder="12211" maxLength={5} />
                </div>
              </div>
            </div>
          )}

          {/* Form Step 4: Accounting Preferences */}
          {step === 4 && (
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
          )}

          {/* Form Step 5: Review & Launch */}
          {step === 5 && (
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <span>ZATCA Phase 2 E-Invoice QR Generator</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <span>SOCPA Double-Entry Chart of Accounts</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-primary shrink-0" />
                  <span>ZATCA Tax Return Form 21 Pre-built</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
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
              disabled={(step === 1 && !form.legalNameEnglish) || (step === 2 && !!form.vatRegistered && !/^3\d{13}3$/.test(form.vatNumber || '')) || create.isPending || update.isPending || updatePreferences.isPending}
              className="btn-primary text-xs font-bold px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
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
