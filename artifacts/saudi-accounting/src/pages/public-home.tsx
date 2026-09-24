import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from 'wouter';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { PublicLayout } from '@/components/layout/public-layout';
import { useTranslation } from '@/lib/utils';
import { 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Scale, 
  Zap,
  CheckCircle2,
  Receipt,
  Building2,
  BarChart3,
  Check,
  Globe2,
  Calculator,
  ChevronDown,
  RefreshCw,
  Server,
  Lock,
  FileSpreadsheet,
  Database,
  Cpu
} from 'lucide-react';

export function PublicHome() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isRtl, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'invoice' | 'ledger' | 'vat'>('invoice');
  const [annualBilling, setAnnualBilling] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live VAT Calculator State
  const [calcSubtotal, setCalcSubtotal] = useState<number>(5000);
  const vatAmount = calcSubtotal * 0.15;
  const grandTotal = calcSubtotal + vatAmount;

  if (!isLoaded) {
    return (
      <PlatformLoader
        fullScreen
        message="Verifying session security & cryptographic credentials..."
        messageAr="جاري التحقق من الهوية والصلوحية..."
      />
    );
  }

  const packages = [
    {
      id: "starter",
      name: "Starter Package",
      nameAr: "الباقة الأساسية",
      subtitle: "Ideal for freelancers, small shops & single stores.",
      subtitleAr: "مثالية للمحلات الصغيرة والأنشطة التجارية الفردية.",
      monthlyPrice: 99,
      annualPrice: 79,
      popular: false,
      ctaEn: "Start Free Account",
      ctaAr: "ابدأ مجاناً الآن",
      featuresEn: [
        "1 Organization User",
        "Up to 100 E-Invoices / Month",
        "ZATCA Phase 1 TLV QR Code",
        "Automatic 15% Saudi VAT",
        "Customer & Supplier Directory",
        "Double-Entry General Ledger",
        "Standard Email & Chat Support"
      ],
      featuresAr: [
        "مستخدم واحد للمنشأة",
        "حتى 100 فاتورة إلكترونية شهرياً",
        "رمز QR المعتمد لـ ZATCA المرحلة 1",
        "احتساب ضريبة القيمة المضافة 15%",
        "دليل العملاء والموردين الكامل",
        "دفتر الأستاذ العام المزدوج",
        "دعم فني عبر البريد والمحادثة"
      ]
    },
    {
      id: "professional",
      name: "Professional Package",
      nameAr: "الباقة الاحترافية",
      subtitle: "Designed for growing Saudi SMEs & VAT registrants.",
      subtitleAr: "مصممة للشركات المتوسطة والمنشآت المسجلة في الضريبة.",
      monthlyPrice: 299,
      annualPrice: 239,
      popular: true,
      ctaEn: "Get Started Now",
      ctaAr: "اشترك بالباقة الاحترافية",
      featuresEn: [
        "Up to 5 Team Members",
        "Unlimited Invoices & Quotations",
        "ZATCA Phase 2 Fatoora API Integration",
        "Official Form 21 VAT Declaration Report",
        "SOCPA Compliant Double-Entry Accounting",
        "Profit & Loss + Balance Sheet Reports",
        "Full Audit Log & History Tracking",
        "24/7 Priority Support & Setup Assistance"
      ],
      featuresAr: [
        "حتى 5 مستخدمين للمنشأة",
        "فواتير وعروض أسعار غير محدودة",
        "الربط المباشر مع هيئة الزكاة (ZATCA Phase 2)",
        "الإقرار الضريبي المعتمد (نموذج 21)",
        "المحاسبة المزدوجة وفق معايير SOCPA",
        "تقارير الأرباح والخسائر والميزانية العمومية",
        "سجل مراجعة كامل وتتبع العمليات",
        "دعم فني أولوية على مدار 24/7"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise Package",
      nameAr: "باقة المؤسسات والفروع",
      subtitle: "Full multi-branch suite for corporate & high-volume trading.",
      subtitleAr: "حلول شاملة للمؤسسات المتعددة الفروع والتجارة الكبيرة.",
      monthlyPrice: 599,
      annualPrice: 479,
      popular: false,
      ctaEn: "Contact Enterprise Sales",
      ctaAr: "تواصل مع المبيعات",
      featuresEn: [
        "Unlimited Team Members",
        "Multi-Branch & Multi-CR Support",
        "Real-Time ZATCA Clearance & Clearance API",
        "Automated Nightly Backups & 99.99% Uptime",
        "Custom Roles & Granular RBAC Permissions",
        "Dedicated Saudi Account Manager",
        "Custom API Integration & Webhooks",
        "SLA Guarantee & Onboarding Training"
      ],
      featuresAr: [
        "عدد غير محدود من الموظفين",
        "إدارة الفروع والسجلات التجارية المتعددة",
        "تطهير واعتماد الفواتير الفوري مع الزكاة",
        "نسخ احتياطي آلي يومي وضمان تشغيل 99.99%",
        "صلاحيات مخصصة ومتقدمة لكل موظف",
        "مدير حساب سعودي مخصص",
        "ربط API مخصص مع الأنظمة الأخرى",
        "تدريب كامل وضمان مستوى الخدمة SLA"
      ]
    }
  ];

  const migrationSources = [
    { name: "QuickBooks", descEn: "1-Click import of accounts, invoices, and clients", descAr: "استيراد الحسابات والفواتير والعملاء بضغطة زر واحدة", icon: "QB" },
    { name: "Excel & CSV", descEn: "Bulk upload using pre-formatted ready templates", descAr: "رفع جميع القوائم والأصناف عبر قوالب أكسل الجاهزة", icon: "XLS" },
    { name: "Odoo ERP", descEn: "Seamless transfer of Chart of Accounts and Sales", descAr: "نقل شجرة الحسابات ودليل المشتريات والمبيعات بسلاسة", icon: "ODOO" },
    { name: "Zoho Books", descEn: "Convert VAT logs and customer directories safely", descAr: "تحويل سجلات الضريبة والعملاء بدون أي فقدان للبيانات", icon: "ZOHO" },
    { name: "Legacy Desktop ERPs", descEn: "Modernize legacy systems into certified KSA Cloud", descAr: "تحديث الأنظمة القديمة إلى السحابة السعودية المعتمدة", icon: "ERP" }
  ];

  const faqs = [
    {
      qEn: "Is KHANBAS NEXUS certified for ZATCA E-Invoicing Phase 1 & 2?",
      qAr: "هل منصة نكسس معتمدة للفوترة الإلكترونية المرحلة الأولى والثانية؟",
      aEn: "Yes. Our platform generates 100% compliant Base64 TLV QR codes for Phase 1 and includes cryptographic ECDSA stamp signatures, SHA-256 previous invoice hash (PIH) chaining, and UBL 2.1 XML clearance APIs for ZATCA Phase 2.",
      aAr: "نعم بالكامل. المنصة تولد رموز QR بصيغة Base64 TLV المعتمدة للمرحلة الأولى، وتتضمن التوقيع الرقمي المشفر ECDSA، وسلسلة التشفير SHA-256، وملفات UBL 2.1 XML الجاهزة للربط المباشر مع منصة فاتورة (ZATCA Phase 2)."
    },
    {
      qEn: "How easy is it to migrate from our old accounting system (QuickBooks/Excel/Odoo)?",
      qAr: "كيف يمكنني الانتقال من نظامي المحاسبي القديم (كويك بوكس / أكسل / أودو)؟",
      aEn: "Migration is instant and seamless. You can upload your Chart of Accounts, Customers, Suppliers, and Products in 1 click using our pre-formatted Excel/CSV templates with zero downtime.",
      aAr: "الانتقال يتم بسهولة وبدون أي توقف للعمل. يمكنك استيراد شجرة الحسابات ودليل العملاء والموردين والمنتجات بضغطة زر واحدة باستخدام قوالب الأكسل الجاهزة لدينا."
    },
    {
      qEn: "Where is our business financial data hosted?",
      qAr: "أين يتم استضافة البيانات المالية لمنشأتنا؟",
      aEn: "Your data is strictly hosted in high-availability, bank-grade encrypted Saudi cloud data centers compliant with KSA cybersecurity laws, backed up nightly with 99.99% uptime guarantee.",
      aAr: "تستضيف المنصة بياناتك في مراكز بيانات سحابية سعودية عالية الأمان ومتوافقة مع أنظمة الأمن السيبراني بالمملكة، بتشفير 256-bit ونظام نسخ احتياطي يومي آلي."
    },
    {
      qEn: "Does the system calculate Saudi 15% VAT and Form 21 automatically?",
      qAr: "هل يقوم النظام بحساب ضريبة القيمة المضافة 15% وإعداد الإقرار الضريبي نموذج 21 تلقائياً؟",
      aEn: "Yes. All sales invoices, purchase bills, and operational expenses automatically compute Output VAT and Input VAT, generating an official ZATCA Form 21 Tax Return report ready for submission.",
      aAr: "نعم، جميع الفواتير والمشتريات والمصاريف تحسب ضريبة المخرجات والمدخلات تلقائياً، وتولد تقرير الإقرار الضريبي الرسمي (نموذج 21) الجاهز للتقديم لهيئة الزكاة."
    }
  ];

  return (
    <PublicLayout>
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-12 lg:grid-cols-[1fr_1fr] lg:px-10 lg:py-20">
        <div className="fade-up z-10">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#176752]/25 bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm badge-glow mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
            <Sparkles size={14} className="text-[#d4af37]" />
            <span>{t('KHANBAS NEXUS | Saudi Enterprise Accounting Platform', 'KHANBAS NEXUS | منصة نكسس المالية المحاسبية بالسعودية')}</span>
          </div>

          <h1 className="text-[clamp(2.3rem,4.2vw,4.2rem)] font-black leading-[1.08] tracking-tight text-[#071f19]">
            {t('Saudi Enterprise Accounting.', 'المحاسبة والفوترة الإلكترونية للمنشآت السعودية.')} <br />
            <span className="animated-gradient-text">
              {t('Smarter, Faster & ZATCA Compliant.', 'أسهل، أسرع، ومعتمدة من هيئة الزكاة (ZATCA).')}
            </span>
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[#485d56] max-w-[540px]">
            {t(
              'Unified double-entry financial ledger, instant Base64 TLV e-invoicing, automatic 15% VAT Form 21 reporting, and multi-branch operations designed strictly to SOCPA & ZATCA FATOORA standards.',
              'دفتر أستاذ محاسبي موحد، فوترة إلكترونية فورية بمعيار Base64 TLV، إقرار ضريبة القيمة المضافة 15% تلقائي (نموذج 21)، وتكامل الفروع وفق معايير SOCPA وZATCA.'
            )}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={isSignedIn ? "/home" : "/sign-up"} className="btn-primary flex items-center gap-2 px-7 py-3.5 text-sm font-bold shadow-xl shadow-[#176752]/25 hover:scale-[1.04] transition-all cursor-pointer" data-testid="link-hero-start">
              <span>{isSignedIn ? t("Go to Workspace", "الانتقال إلى مساحة العمل") : t("Start Free Account", "ابدأ حسابك المجاني")}</span>
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <a href="#packages" className="flex items-center gap-2 rounded-xl border border-[#d6cfbe] bg-white px-6 py-3.5 text-sm font-bold text-[#0a2620] hover:bg-[#ede7d8] hover:scale-[1.02] transition-all cursor-pointer">
              <Receipt size={16} className="text-[#176752]" />
              <span>{t('View Packages', 'مشاهدة باقات الأسعار')}</span>
            </a>
          </div>

          {/* Trust Pills */}
          <div className="mt-10 flex flex-wrap items-center gap-5 text-xs font-bold text-[#3e524b]">
            <span className="flex items-center gap-1.5 hover:text-[#176752] transition-colors"><CheckCircle2 size={16} className="text-[#176752]" /> {t('ZATCA Phase 1 & 2', 'الفوترة الإلكترونية المرحلة 1 و 2')}</span>
            <span className="flex items-center gap-1.5 hover:text-[#176752] transition-colors"><CheckCircle2 size={16} className="text-[#176752]" /> {t('SOCPA GAAP Compliant', 'معتمد وفق معايير SOCPA')}</span>
            <span className="flex items-center gap-1.5 hover:text-[#176752] transition-colors"><CheckCircle2 size={16} className="text-[#176752]" /> {t('Instant TLV QR Code', 'رمز QR المعتمد TLV')}</span>
          </div>
        </div>

        {/* DYNAMIC DUAL-MODE INTERACTIVE PREVIEW WIDGET */}
        <div id="preview" className="fade-up-2 animate-float relative mx-auto w-full max-w-[560px]">
          <div className="absolute -right-6 -top-6 h-44 w-44 rounded-full bg-gradient-to-br from-[#d4af37] via-[#10b981] to-[#176752] opacity-40 blur-2xl animate-pulse" />
          <div className="absolute -left-6 -bottom-6 h-48 w-48 rounded-full bg-[#176752]/30 blur-2xl animate-pulse" />

          <div className="relative overflow-hidden rounded-3xl border border-[#d8d2c2] bg-white/90 p-2.5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl bg-[#071f19] text-white p-6 shadow-2xl">
              
              {/* Header Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setActiveTab('invoice')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'invoice' ? 'bg-[#176752] text-white shadow-md' : 'text-[#8fa8a0] hover:text-white'
                    }`}
                  >
                    <QrCode size={13} />
                    <span>{t('E-Invoice', 'فاتورة إلكترونية')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'ledger' ? 'bg-[#176752] text-white shadow-md' : 'text-[#8fa8a0] hover:text-white'
                    }`}
                  >
                    <BarChart3 size={13} />
                    <span>{t('Ledger', 'دفتر الأستاذ')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('vat')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'vat' ? 'bg-[#176752] text-white shadow-md' : 'text-[#8fa8a0] hover:text-white'
                    }`}
                  >
                    <Receipt size={13} />
                    <span>{t('VAT Form 21', 'الإقرار الضريبي 21')}</span>
                  </button>
                </div>
                <span className="hidden sm:flex items-center gap-1 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#6ee7b7]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
                  {t('ZATCA Live', 'ربط فوري مفعّل')}
                </span>
              </div>

              {/* TAB 1: E-INVOICE PREVIEW */}
              {activeTab === 'invoice' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                        <QrCode size={22} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{t('Tax Invoice #INV-00091', 'فاتورة ضريبية #INV-00091')}</div>
                        <div className="text-[10px] text-[#9ab3a9]">{t('Al-Rashid Commercial Trading Co.', 'شركة الراشد للتجارة العمومية')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[#d4af37]">{t('SAR 6,900.00', '6,900.00 ر.س')}</div>
                      <div className="text-[10px] text-[#6ee7b7] font-semibold">{t('Incl. 15% VAT (SAR 900.00)', 'شاملة 15% ضريبة (900.00 ر.س)')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[10px] text-[#8fa8a0]">{t('TLV QR Spec', 'مواصفة ترميز TLV')}</div>
                      <div className="mt-1 font-bold text-white flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-[#34d399]" /> {t('Base64 Encoded', 'مشفر Base64')}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[10px] text-[#8fa8a0]">{t('ZATCA Status', 'حالة هيئة الزكاة')}</div>
                      <div className="mt-1 font-bold text-[#34d399] flex items-center gap-1">
                        <ShieldCheck size={12} /> {t('ECDSA Signed', 'موقّع رقمياً ECDSA')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LEDGER PREVIEW */}
              {activeTab === 'ledger' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#d4af37]">{t('Trial Balance Reconciliation', 'مطابقة ميزان المراجعة')}</span>
                      <span className="text-[10px] font-bold text-[#34d399] bg-[#34d399]/20 px-2 py-0.5 rounded">{t('100% Balanced', 'مطابق 100%')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                      <div>
                        <div className="text-[10px] text-[#8fa8a0]">{t('Total Debits', 'إجمالي المدين')}</div>
                        <div className="font-bold text-white">{t('SAR 73,000.00', '73,000.00 ر.س')}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8fa8a0]">{t('Total Credits', 'إجمالي الدائن')}</div>
                        <div className="font-bold text-white">{t('SAR 73,000.00', '73,000.00 ر.س')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VAT FORM 21 PREVIEW */}
              {activeTab === 'vat' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="rounded-xl border border-[#176752] bg-[#176752]/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#9ab3a9]">{t('Quarterly Net VAT', 'صافي الضريبة الربع سنوية')}</div>
                        <div className="text-lg font-extrabold text-[#ffffff] mt-0.5">{t('SAR 1,200.00 Refundable', '1,200.00 ر.س مستردة')}</div>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#176752] text-white">
                        <Receipt size={18} />
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-[#6ee7b7] border-t border-white/10 pt-2 flex justify-between">
                      <span>{t('Box 1 Output VAT: SAR 900.00', 'البند 1 ضريبة المخرجات: 900.00 ر.س')}</span>
                      <span>{t('Box 8 Input VAT: SAR 2,100.00', 'البند 8 ضريبة المدخلات: 2,100.00 ر.س')}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ULTRA-COMPACT METRICS BAR */}
      <section className="border-y border-[#e2dcce] bg-[#efeade]/80 py-6">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-6 overflow-x-auto text-xs font-extrabold text-[#071f19] lg:px-10">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <ShieldCheck size={16} className="text-[#176752]" />
            <span>{t('100% ZATCA Compliant', 'مطابق لمتطلبات هيئة الزكاة 100%')}</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Receipt size={16} className="text-[#b8800b]" />
            <span>{t('15% Saudi VAT Form 21', 'إقرار ضريبة القيمة المضافة 15% (نموذج 21)')}</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Scale size={16} className="text-[#176752]" />
            <span>{t('SOCPA Standard', 'معايير المحاسبة السعودية SOCPA')}</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Zap size={16} className="text-[#b8800b]" />
            <span>{t('Instant Base64 QR', 'رمز QR المعتمد الفوري')}</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Globe2 size={16} className="text-[#176752]" />
            <span>{t('Arabic & English', 'دعم كامل للغة العربية والإنجليزية')}</span>
          </div>
        </div>
      </section>

      {/* SYSTEM MIGRATION & EASY TRANSITION SECTION */}
      <section id="migration" className="py-20 lg:py-24 bg-white border-b border-[#e2dcce]">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#176752]/10 border border-[#176752]/20 px-3.5 py-1 text-xs font-bold text-[#176752]">
                <RefreshCw size={14} className="text-[#d4af37] animate-spin" />
                <span>{t('Seamless Data Migration', 'سهولة الانتقال من الأنظمة القديمة')}</span>
              </div>

              <h2 className="text-3xl font-black text-[#071f19] sm:text-4xl leading-tight">
                {t('Easily Upgrade from Legacy Systems to KHANBAS NEXUS', 'انتقل بسلاسة من برنامجك المحاسبي القديم إلى نكسس')}
              </h2>

              <p className="text-sm text-[#485d56] leading-relaxed">
                {t(
                  'Stuck on outdated desktop accounting software or manual Excel spreadsheets that don\'t support ZATCA Phase 2? Migrate your entire Chart of Accounts, Customers, Suppliers, and Inventory in minutes.',
                  'هل تعاني من البرامج القديمة أو ملفات الأكسل اليدوية التي لا تدعم الربط المباشر مع هيئة الزكاة؟ يمكنك نقل شجرة الحسابات والعملاء والموردين والمنتجات خلال دقائق.'
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-[#e2dcce] bg-[#fbf9f4] p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#176752]/10 text-[#176752]">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#071f19]">{t('1-Click Excel / CSV Import', 'استيراد الأكسل و CSV بضغطة زر')}</h4>
                    <p className="text-[11px] text-[#566861] mt-0.5">{t('Upload lists using ready-made templates', 'رفع القوائم والمنتجات بقوالب جاهزة')}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e2dcce] bg-[#fbf9f4] p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#176752]/10 text-[#176752]">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#071f19]">{t('Zero Data Loss Guarantee', 'ضمان عدم فقدان أي بيانات')}</h4>
                    <p className="text-[11px] text-[#566861] mt-0.5">{t('Complete balance & history retention', 'حفظ سجل الحسابات والأرصدة بالكامل')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#3e524b] mb-4">
                {t('Supported Legacy Platforms for Direct Import:', 'أنظمة المحاسبة المتاحة للاستيراد المباشر:')}
              </div>
              {migrationSources.map((src, idx) => (
                <div key={idx} className="glow-card flex items-center justify-between rounded-2xl border border-[#e2dcce] bg-[#fcfbfa] p-4 shadow-sm hover:border-[#176752] transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071f19] text-xs font-black text-[#d4af37] shadow-md">
                      {src.icon}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-[#071f19]">{src.name}</div>
                      <div className="text-xs text-[#566861]">{isRtl ? src.descAr : src.descEn}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#176752]/10 text-[#176752] text-[10px] font-bold px-3 py-1">
                    {t('Ready to Import', 'جاهز للاستيراد')}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* SAUDI DATA SOVEREIGNTY, SECURITY & RESILIENCY */}
      <section className="py-20 lg:py-24 bg-[#071f19] text-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#176752]/20 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 px-4 py-1 text-xs font-bold text-[#fde68a] badge-glow">
              <Server size={14} />
              <span>{t('Saudi Data Hosting & Enterprise Resiliency', 'مراكز بيانات سعودية وأمان عالي')}</span>
            </span>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              {t('Bank-Grade Security & Local Data Sovereignty', 'أمان بمستوى البنوك واستضافة بيانات داخل المملكة')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glow-card rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37] shadow-inner">
                <Server size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">{t('Local KSA Cloud Hosting', 'استضافة سحابية داخل السعودية')}</h3>
              <p className="text-xs font-semibold text-[#6ee7b7] mt-0.5">{t('NCA Cybersecurity Compliant', 'متوافق مع أنظمة الأمن السيبراني (NCA)')}</p>
              <p className="mt-3 text-xs leading-relaxed text-[#a4c0b6]">
                {t(
                  'Compliant with National Cybersecurity Authority regulations within Saudi Arabia.',
                  'تستضيف المنصة بياناتك في مراكز بيانات سحابية عالية الأمان داخل حدود المملكة العربية السعودية.'
                )}
              </p>
            </div>

            <div className="glow-card rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37] shadow-inner">
                <Lock size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">{t('256-Bit AES Encryption', 'تشفير كامل AES 256-Bit')}</h3>
              <p className="text-xs font-semibold text-[#6ee7b7] mt-0.5">{t('Military-Grade Encryption', 'تشفير عالي الأمان لحماية البيانات')}</p>
              <p className="mt-3 text-xs leading-relaxed text-[#a4c0b6]">
                {t(
                  'End-to-end 256-bit AES encryption at rest and TLS 1.3 in transit with automated nightly offsite database backups.',
                  'تشفير كامل للبيانات والسجلات المالية أثناء التخزين والنقل مع نسخ احتياطي آلي يومي.'
                )}
              </p>
            </div>

            <div className="glow-card rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37] shadow-inner">
                <Cpu size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">{t('99.99% Uptime Guarantee', 'ضمان تشغيل بنسبة 99.99%')}</h3>
              <p className="text-xs font-semibold text-[#6ee7b7] mt-0.5">{t('High-Availability Architecture', 'استقرار واستجابة مستمرة للأعمال')}</p>
              <p className="mt-3 text-xs leading-relaxed text-[#a4c0b6]">
                {t(
                  'High-resiliency architecture engineered to handle peak invoicing volumes during tax deadlines without slowdown.',
                  'بنية سحابية عالية الاعتمادية تضمن استمرار العمل وإصدار الفواتير بدون أي توقف.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BILINGUAL PACKAGES & PRICING SECTION */}
      <section id="packages" className="py-20 lg:py-24 bg-[#f8f5ee] border-b border-[#e2dcce]">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-4">
              <Sparkles size={14} className="text-[#d4af37]" />
              <span>{t('Packages & Subscription Plans', 'باقات الاشتراك والأسعار')}</span>
            </div>
            
            <h2 className="text-3xl font-black text-[#071f19] sm:text-4xl">
              {t('Choose the Right Package for Your Business', 'اختر الباقة المناسبة لمنشأتك بدون أي مصاريف خفية')}
            </h2>
            
            <p className="mt-4 text-sm text-[#485d56]">
              {t(
                'All packages include 15% Saudi VAT calculation, SOCPA double-entry accounting, Base64 TLV QR codes, and bilingual Arabic & English interface.',
                'جميع الباقات تشمل احتساب ضريبة 15%، المحاسبة المزدوجة بمعايير SOCPA، وإنشاء رموز QR المعتمدة فورياً.'
              )}
            </p>

            {/* Billing Cycle Toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${!annualBilling ? 'text-[#176752]' : 'text-[#78938a]'}`}>
                {t('Monthly', 'شهري')}
              </span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className="relative h-7 w-14 rounded-full bg-[#176752] p-1 transition-colors cursor-pointer"
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${annualBilling ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${annualBilling ? 'text-[#176752]' : 'text-[#78938a]'}`}>
                  {t('Annual Billing', 'سنوي')}
                </span>
                <span className="rounded-full bg-[#d4af37]/20 border border-[#d4af37] px-2.5 py-0.5 text-[10px] font-extrabold text-[#b8800b]">
                  {t('Save 20%', 'خصم 20%')}
                </span>
              </div>
            </div>
          </div>

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {packages.map((pkg) => {
              const price = annualBilling ? pkg.annualPrice : pkg.monthlyPrice;
              const pkgName = isRtl ? pkg.nameAr : pkg.name;
              const pkgSubtitle = isRtl ? pkg.subtitleAr : pkg.subtitle;
              const pkgFeatures = isRtl ? pkg.featuresAr : pkg.featuresEn;
              const pkgCta = isRtl ? pkg.ctaAr : pkg.ctaEn;

              return (
                <div
                  key={pkg.id}
                  className={`glow-card relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 cursor-pointer ${
                    pkg.popular
                      ? 'bg-[#071f19] text-white ring-2 ring-[#176752] shadow-2xl scale-[1.03] z-10'
                      : 'bg-white border border-[#e2dcce] text-[#0a2620] shadow-sm hover:border-[#176752]'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#176752] to-[#d4af37] px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-md flex items-center gap-1.5 badge-glow">
                      <Sparkles size={12} className="text-[#fde68a]" />
                      <span>{t('Most Popular', 'الأكثر طلباً للمنشآت')}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-2xl font-black ${pkg.popular ? 'text-white' : 'text-[#071f19]'}`}>{pkgName}</h3>
                    </div>

                    <p className={`mt-2 text-xs leading-relaxed ${pkg.popular ? 'text-[#a3b8b0]' : 'text-[#5c726a]'}`}>
                      {pkgSubtitle}
                    </p>

                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="text-4xl font-black font-mono">{price}</span>
                      <span className={`text-xs font-bold ${pkg.popular ? 'text-[#6ee7b7]' : 'text-[#176752]'}`}>
                        {t('SAR / Month', 'ر.س / شهرياً')}
                      </span>
                    </div>
                    <div className={`text-[10px] font-semibold mt-1 ${pkg.popular ? 'text-[#78938a]' : 'text-[#94a3b8]'}`}>
                      {annualBilling ? t('Billed annually (20% Off)', 'مفوترة سنوياً (خصم 20%)') : t('Billed monthly', 'مفوترة شهرياً')}
                    </div>

                    <hr className={`my-6 ${pkg.popular ? 'border-white/10' : 'border-[#e2dcce]'}`} />

                    <div className="space-y-3">
                      <div className="text-[10px] uppercase font-extrabold tracking-wider opacity-75">{t('Package Features:', 'مميزات الباقة:')}</div>
                      <ul className="space-y-2.5 text-xs">
                        {pkgFeatures.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5">
                            <Check size={15} className={pkg.popular ? 'text-[#6ee7b7] shrink-0 mt-0.5' : 'text-[#176752] shrink-0 mt-0.5'} />
                            <span className={pkg.popular ? 'text-[#e2e8f0] font-medium' : 'text-[#334155] font-medium'}>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link
                      href={isSignedIn ? "/home" : "/sign-up"}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        pkg.popular
                          ? 'btn-primary text-white shadow-[#176752]/40 hover:scale-[1.03]'
                          : 'bg-[#f0ece1] text-[#0a2620] hover:bg-[#176752] hover:text-white'
                      }`}
                    >
                      <span>{isSignedIn ? t("Go to Workspace", "الانتقال إلى مساحة العمل") : pkgCta}</span>
                      {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* CORE PLATFORM FEATURES */}
      <section id="features" className="py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="eyebrow">{t('Platform Capabilities', 'مميزات وإمكانيات النظام')}</div>
              <h2 className="mt-2 text-3xl font-black text-[#071f19] sm:text-4xl">
                {t('Engineered for Saudi business requirements.', 'مصمم خصيصاً لتلبية متطلبات الأعمال والأنظمة السعودية.')}
              </h2>
            </div>
            <Link href={isSignedIn ? "/home" : "/sign-up"} className="btn-primary inline-flex items-center gap-2 text-xs font-bold py-3 px-5 shadow-md cursor-pointer hover:scale-[1.04] transition-all">
              <span>{isSignedIn ? t("Go to Workspace", "الانتقال إلى مساحة العمل") : t("Explore Full Platform", "استكشف المنصة بالكامل")}</span>
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="glow-card group rounded-2xl border border-[#e0d9ca] bg-white p-8 shadow-sm hover:border-[#176752] transition-all duration-300 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                <QrCode size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#071f19]">{t('ZATCA E-Invoicing Phase 1 & 2', 'الفوترة الإلكترونية (ZATCA 1 & 2)')}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                {t(
                  'Generates Base64 TLV QR Codes, cryptographic signatures, XML formatting, and direct ZATCA FATOORA portal sync.',
                  'توليد رموز QR مشفرة بصيغة TLV Base64، والتوقيع الرقمي، وملفات XML، والربط المباشر مع منصة فاتورة.'
                )}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glow-card group rounded-2xl border border-[#e0d9ca] bg-white p-8 shadow-sm hover:border-[#176752] transition-all duration-300 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                <Scale size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#071f19]">{t('Double-Entry SOCPA Ledger', 'المحاسبة المزدوجة وفق معايير SOCPA')}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                {t(
                  'Complete Chart of Accounts, Journal Vouchers, Account Ledgers, Trial Balance, Profit & Loss, and Balance Sheet.',
                  'شجرة حسابات متكاملة، قيود يومية، دفاتر استاد، ميزان مراجعة، تقارير الأرباح والخسائر والميزانية العمومية.'
                )}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glow-card group rounded-2xl border border-[#e0d9ca] bg-white p-8 shadow-sm hover:border-[#176752] transition-all duration-300 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                <Building2 size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#071f19]">{t('Multi-Branch & Catalog', 'إدارة الفروع والسجلات التجارية')}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                {t(
                  'Manage multiple Saudi branches, CR numbers, commercial catalogs, VAT rates, customer and supplier directories.',
                  'إدارة الفروع والسجلات التجارية متعددة الأصناف، وقواعد الضريبة، ودليل العملاء والموردين الشامل.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE INTERACTIVE SAUDI VAT CALCULATOR */}
      <section id="zatca" className="border-t border-[#e2dcce] bg-[#f4f0e6] py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#176752]/10 border border-[#176752]/20 px-3.5 py-1 text-xs font-bold text-[#176752] badge-glow">
                <Calculator size={14} className="text-[#d4af37]" />
                <span>{t('Live Calculator Tool', 'حاسبة ضريبة القيمة المضافة الفورية')}</span>
              </div>

              <h2 className="text-3xl font-black text-[#071f19] sm:text-4xl">
                {t('Instant 15% Saudi VAT & Invoice Breakdown', 'حساب آلي فوري لضريبة 15% وتفاصيل الفاتورة')}
              </h2>
              <p className="text-sm text-[#485d56] leading-relaxed">
                {t(
                  'Test how KHANBAS NEXUS calculates tax subtotals and 15% output VAT according to ZATCA regulations.',
                  'تجربة حية لتأكيد احتساب المبالغ قبل الضريبة وضريبة المخرجات وفق اشتراطات هيئة الزكاة.'
                )}
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e524b] mb-2">
                    {t('Enter Invoice Subtotal (SAR)', 'أدخل المبلغ قبل الضريبة (ر.س)')}
                  </label>
                  <input
                    type="number"
                    value={calcSubtotal}
                    onChange={(e) => setCalcSubtotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full max-w-sm rounded-xl border border-[#d6cfbe] bg-white px-4 py-3 text-base font-mono font-bold text-[#071f19] focus:border-[#176752] focus:outline-none focus:ring-2 focus:ring-[#176752]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="glow-card lg:col-span-6 rounded-3xl border border-[#071f19] bg-[#071f19] text-white p-8 lg:p-10 shadow-2xl cursor-pointer">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">{t('ZATCA Compliant Breakdown', 'تفاصيل الفاتورة الضريبية')}</span>
                <span className="text-[10px] font-bold text-[#6ee7b7] bg-[#6ee7b7]/20 px-2.5 py-1 rounded-full">{t('15% Rate Applied', 'تطبيق نسبة 15%')}</span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#a3b8b0]">{t('Net Subtotal:', 'المبلغ قبل الضريبة:')}</span>
                  <span className="font-mono font-bold text-white text-base">{isRtl ? `${calcSubtotal.toFixed(2)} ر.س` : `SAR ${calcSubtotal.toFixed(2)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a3b8b0]">{t('15% Output VAT:', 'ضريبة القيمة المضافة 15%:')}</span>
                  <span className="font-mono font-bold text-[#6ee7b7] text-base">{isRtl ? `+ ${vatAmount.toFixed(2)} ر.س` : `+ SAR ${vatAmount.toFixed(2)}`}</span>
                </div>
                <hr className="border-white/10 my-4" />
                <div className="flex items-center justify-between">
                  <span className="font-black text-white">{t('Grand Total:', 'المبلغ الإجمالي النهائي:')}</span>
                  <span className="font-mono font-black text-[#d4af37] text-2xl">{isRtl ? `${grandTotal.toFixed(2)} ر.س` : `SAR ${grandTotal.toFixed(2)}`}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section id="faq" className="py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="eyebrow">{t('Got Questions?', 'الأسئلة الشائعة حول النظام والفوترة')}</div>
            <h2 className="mt-2 text-3xl font-black text-[#071f19] sm:text-4xl">
              {t('Frequently Asked Questions', 'الأسئلة الأكثر تكراراً عن الفوترة والمحاسبة')}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const qText = isRtl ? faq.qAr : faq.qEn;
              const aText = isRtl ? faq.aAr : faq.aEn;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#e2dcce] bg-white transition-all cursor-pointer overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-start cursor-pointer"
                  >
                    <div>
                      <div className="text-base font-bold text-[#071f19]">{qText}</div>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-[#176752] transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-6 text-xs leading-relaxed border-t border-[#f0ece1] pt-4 animate-in fade-in duration-200">
                      <p className="text-[#485d56] font-medium leading-relaxed">{aText}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* HIGH INTENT SEO KEYWORDS FOOTER HUB */}
      <section className="border-t border-[#e2dcce] bg-[#efeade] py-12 text-xs">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="text-center mb-6">
            <h3 className="font-bold text-[#071f19] uppercase tracking-wider text-[11px]">
              {t('KSA Enterprise Search Keywords & Compliance Index', 'دليل الكلمات والخدمات الأكثر بحثاً والامتثال بالمنشآت السعودية')}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-[#566861]">
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">{t('E-Invoicing & ZATCA', 'الفوترة والزكاة')}</strong>
              <span>{t('Certified E-Invoicing Software | ZATCA Phase 2 E-Invoicing | Base64 TLV QR Code', 'برنامج فوترة إلكترونية معتمد | ZATCA Phase 2 E-Invoicing | رمز كيو آر Base64 TLV | هيئة الزكاة والضريبة والجمارك')}</span>
            </div>
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">{t('Accounting & Reports', 'المحاسبة والإقرارات')}</strong>
              <span>{t('15% VAT Declaration | Form 21 | SOCPA GAAP | Balance Sheet & P&L', 'إقرار ضريبة القيمة المضافة 15% | نموذج 21 | معايير SOCPA | ميزانية عمومية وقائمة الأرباح والخسائر')}</span>
            </div>
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">{t('Migration & Transfer', 'التحول والنقل')}</strong>
              <span>{t('Import from QuickBooks | Excel Upload | Odoo ERP Migration | Cloud Accounting', 'الاستيراد من كويك بوكس | استيراد ملفات أكسل | نقل البيانات من أودو | برنامج محاسبة سحابي بديل')}</span>
            </div>
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">{t('Security & Branches', 'الأمان والفروع')}</strong>
              <span>{t('KSA Local Cloud Hosting | 256-Bit AES Encryption | Multi-CR Branch Management', 'استضافة سحابية داخل السعودية | تشفير 256-Bit AES | إدارة الفروع والسجلات التجارية | باقات أسعار اقتصادية')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative overflow-hidden bg-[#071f19] px-6 py-20 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 px-3.5 py-1 text-xs font-bold text-[#fde68a]">
            🇸🇦 {t('Saudi Arabia Enterprise SaaS Edition', 'المملكة العربية السعودية | إصدار المنشآت')}
          </span>

          <h2 className="mt-6 max-w-[680px] text-3xl font-black text-white sm:text-4xl">
            {t('Ready to Streamline Your Saudi Business Accounting?', 'جاهز لتطوير أعمالك ونظامك المحاسبي مع نكسس؟')}
          </h2>

          <p className="mt-3 text-sm text-[#a4c0b6] max-w-[520px]">
            {t(
              'Setup your organization, configure ZATCA e-invoicing, and generate SOCPA compliant reports in minutes.',
              'قم بإعداد منشأتك، تفعيل الفوترة الإلكترونية مع الزكاة، واستخراج التقارير المعتمدة خلال دقائق.'
            )}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link href={isSignedIn ? "/home" : "/sign-up"} className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-sm font-bold bg-[#d4af37] text-[#071f19] hover:bg-[#ebd074] transition-all shadow-xl hover:scale-[1.03] cursor-pointer">
              <span>{isSignedIn ? t("Go to Workspace", "الانتقال إلى مساحة العمل") : t("Start Free Trial", "ابدأ التجربة المجانية الآن")}</span>
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
