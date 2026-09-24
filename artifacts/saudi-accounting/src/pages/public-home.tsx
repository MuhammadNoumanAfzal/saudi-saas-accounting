import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { Redirect, Link } from 'wouter';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { PublicLayout } from '@/components/layout/public-layout';
import { useTranslation } from '@/lib/utils';
import { 
  ArrowRight, 
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
  Activity,
  Calculator,
  ChevronDown,
  RefreshCw,
  Server,
  Lock,
  DollarSign,
  FileSpreadsheet,
  Download,
  Database,
  Cpu
} from 'lucide-react';

export function PublicHome() {
  const { isSignedIn, isLoaded } = useAuth();
  const { lang, isRtl, toggleLanguage, t } = useTranslation();
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
        "دليل العملاء والموردين",
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
        "تقارير الأرباح والخسائر والميزانية",
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
    { name: "QuickBooks", desc: "استيراد الحسابات والفواتير والعملاء بضغطة زر واحدة", icon: "QB" },
    { name: "Excel & CSV", desc: "رفع جميع القوائم والأصناف عبر قوالب أكسل الجاهزة", icon: "XLS" },
    { name: "Odoo ERP", desc: "نقل شجرة الحسابات ودليل المشتريات والمبيعات بسلاسة", icon: "ODOO" },
    { name: "Zoho Books", desc: "تحويل سجلات الضريبة والعملاء بدون أي فقدان للبيانات", icon: "ZOHO" },
    { name: "Legacy Desktop ERPs", desc: "تحديث الأنظمة القديمة إلى السحابة السعودية المعتمدة", icon: "ERP" }
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
      aAr: "تستضيف المنصة بياناتك في مراكز بيانات سحابية سعودية عالية الأمان ومتوافقة مع أنظمة الأمن السيبراني بالمملكة، بتشفيير 256-bit ونظام نسخ احتياطي يومي آلي."
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
      <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-12 lg:grid-cols-[1fr_1fr] lg:px-10 lg:py-20">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#176752]/25 bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
            <Sparkles size={14} className="text-[#d4af37]" />
            <span>KHANBAS NEXUS | منصة نكسس المالية المحاسبية</span>
          </div>

          <h1 className="text-[clamp(2.3rem,4.2vw,4.2rem)] font-black leading-[1.08] tracking-tight text-[#071f19]">
            Saudi Enterprise Accounting. <br />
            <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
              Smarter, Faster & ZATCA Compliant.
            </span>
          </h1>

          <h2 className="mt-3 text-lg font-extrabold text-[#176752] dir-rtl font-arabic">
            المنصة السحابية المعتمدة للمحاسبة والفوترة الإلكترونية في المملكة العربية السعودية (ZATCA & SOCPA)
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-[#485d56] max-w-[540px]">
            Unified double-entry financial ledger, instant Base64 TLV e-invoicing, automatic 15% VAT Form 21 reporting, and multi-branch operations designed strictly to SOCPA & ZATCA FATOORA standards.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={isSignedIn ? "/home" : "/sign-up"} className="btn-primary flex items-center gap-2 px-7 py-3.5 text-sm font-bold shadow-xl shadow-[#176752]/25 hover:scale-[1.03] transition-all cursor-pointer" data-testid="link-hero-start">
              <span>{isSignedIn ? "Go to Workspace / مساحة العمل" : "Start Free Account / ابدأ مجاناً"}</span>
              <ArrowRight size={16} />
            </Link>
            <a href="#packages" className="flex items-center gap-2 rounded-xl border border-[#d6cfbe] bg-white px-6 py-3.5 text-sm font-bold text-[#0a2620] hover:bg-[#ede7d8] transition-colors cursor-pointer">
              <Receipt size={16} className="text-[#176752]" />
              <span>View Packages / باقات الأسعار</span>
            </a>
          </div>

          {/* Trust Pills */}
          <div className="mt-10 flex flex-wrap items-center gap-5 text-xs font-bold text-[#3e524b]">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#176752]" /> ZATCA Phase 1 & 2</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#176752]" /> SOCPA GAAP Compliant</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#176752]" /> Instant TLV QR Code</span>
          </div>
        </div>

        {/* DYNAMIC DUAL-MODE INTERACTIVE PREVIEW WIDGET */}
        <div id="preview" className="fade-up-2 relative mx-auto w-full max-w-[560px]">
          <div className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-gradient-to-br from-[#d4af37] to-[#10b981] opacity-50 blur-xl" />
          <div className="absolute -left-6 -bottom-6 h-40 w-40 rounded-full bg-[#176752]/20 blur-xl" />

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
                    <span>E-Invoice</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'ledger' ? 'bg-[#176752] text-white shadow-md' : 'text-[#8fa8a0] hover:text-white'
                    }`}
                  >
                    <BarChart3 size={13} />
                    <span>Ledger</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('vat')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'vat' ? 'bg-[#176752] text-white shadow-md' : 'text-[#8fa8a0] hover:text-white'
                    }`}
                  >
                    <Receipt size={13} />
                    <span>VAT Form 21</span>
                  </button>
                </div>
                <span className="hidden sm:flex items-center gap-1 rounded-full bg-[#10b981]/20 border border-[#10b981]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#6ee7b7]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
                  ZATCA Live
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
                        <div className="text-xs font-bold text-white">Tax Invoice #INV-00091</div>
                        <div className="text-[10px] text-[#9ab3a9]">Al-Rashid Commercial Trading Co.</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[#d4af37]">SAR 6,900.00</div>
                      <div className="text-[10px] text-[#6ee7b7] font-semibold">Incl. 15% VAT (SAR 900.00)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[10px] text-[#8fa8a0]">TLV QR Spec</div>
                      <div className="mt-1 font-bold text-white flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-[#34d399]" /> Base64 Encoded
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-[10px] text-[#8fa8a0]">ZATCA Status</div>
                      <div className="mt-1 font-bold text-[#34d399] flex items-center gap-1">
                        <ShieldCheck size={12} /> ECDSA Signed
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
                      <span className="text-xs font-bold text-[#d4af37]">Trial Balance Reconciliation</span>
                      <span className="text-[10px] font-bold text-[#34d399] bg-[#34d399]/20 px-2 py-0.5 rounded">100% Balanced</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                      <div>
                        <div className="text-[10px] text-[#8fa8a0]">Total Debits</div>
                        <div className="font-bold text-white">SAR 73,000.00</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#8fa8a0]">Total Credits</div>
                        <div className="font-bold text-white">SAR 73,000.00</div>
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
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#9ab3a9]">Quarterly Net VAT</div>
                        <div className="text-lg font-extrabold text-[#ffffff] mt-0.5">SAR 1,200.00 Refundable</div>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#176752] text-white">
                        <Receipt size={18} />
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-[#6ee7b7] border-t border-white/10 pt-2 flex justify-between">
                      <span>Box 1 Output VAT: SAR 900.00</span>
                      <span>Box 8 Input VAT: SAR 2,100.00</span>
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
            <span>100% ZATCA Compliant / هيئة الزكاة والضريبة</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Receipt size={16} className="text-[#b8800b]" />
            <span>15% Saudi VAT Form 21 / الإقرار الضريبي</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Scale size={16} className="text-[#176752]" />
            <span>SOCPA Standard / معايير المحاسبة السعودية</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Zap size={16} className="text-[#b8800b]" />
            <span>Instant Base64 QR / رمز كيو آر الفوري</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Globe2 size={16} className="text-[#176752]" />
            <span>Arabic & English / دعم اللغة العربية والإنجليزية</span>
          </div>
        </div>
      </section>

      {/* SYSTEM MIGRATION & EASY TRANSITION SECTION (SEO SEO SEO) */}
      <section id="migration" className="py-20 lg:py-24 bg-white border-b border-[#e2dcce]">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#176752]/10 border border-[#176752]/20 px-3.5 py-1 text-xs font-bold text-[#176752]">
                <RefreshCw size={14} className="text-[#d4af37] animate-spin" />
                <span>Seamless Migration | سهولة الانتقال من الأنظمة القديمة</span>
              </div>

              <h2 className="text-3xl font-black text-[#071f19] sm:text-4xl leading-tight">
                Easily Upgrade from Legacy Systems to KHANBAS NEXUS <br />
                <span className="text-[#176752] text-2xl font-bold">انتقل بلمسة واحدة من برنامجك المحاسبي القديم بدون فقدان للبيانات</span>
              </h2>

              <p className="text-sm text-[#485d56] leading-relaxed">
                Stuck on outdated desktop accounting software or manual Excel spreadsheets that don't support ZATCA Phase 2? Migrate your entire Chart of Accounts, Customers, Suppliers, and Inventory in minutes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-[#e2dcce] bg-[#fbf9f4] p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#176752]/10 text-[#176752]">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#071f19]">1-Click Excel / CSV Import</h4>
                    <p className="text-[11px] text-[#566861] mt-0.5">رفع القوائم والمنتجات بقوالب جاهزة</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e2dcce] bg-[#fbf9f4] p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#176752]/10 text-[#176752]">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#071f19]">Zero Data Loss Guarantee</h4>
                    <p className="text-[11px] text-[#566861] mt-0.5">حفظ تاريخ الأرصدة والعملاء بالكامل</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#3e524b] mb-4">Supported Legacy Platforms for Direct Import:</div>
              {migrationSources.map((src, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl border border-[#e2dcce] bg-[#fcfbfa] p-4 shadow-sm hover:border-[#176752] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071f19] text-xs font-black text-[#d4af37]">
                      {src.icon}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-[#071f19]">{src.name}</div>
                      <div className="text-xs text-[#566861]">{src.desc}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#176752]/10 text-[#176752] text-[10px] font-bold px-3 py-1">
                    Ready to Import
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* SAUDI DATA SOVEREIGNTY, SECURITY & RESILIENCY */}
      <section className="py-20 lg:py-24 bg-[#071f19] text-white">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 px-4 py-1 text-xs font-bold text-[#fde68a]">
              <Server size={14} />
              <span>Saudi Data Hosting & Enterprise Resiliency | مراكز بيانات سعودية وأمان عالي</span>
            </span>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              Bank-Grade Security & Local Data Sovereignty <br />
              <span className="text-[#d4af37]">بياناتك المالية محمية وفق أعلى المعايير الأمنية داخل المملكة</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                <Server size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">Local KSA Cloud Hosting</h3>
              <p className="text-xs font-semibold text-[#6ee7b7] mt-0.5">استضافة سحابية داخل المملكة</p>
              <p className="mt-3 text-xs leading-relaxed text-[#a4c0b6]">
                Compliant with National Cybersecurity Authority (NCA) regulations. Financial data remains strictly within Saudi Arabian borders.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                <Lock size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">256-Bit AES Encryption</h3>
              <p className="text-xs font-semibold text-[#6ee7b7] mt-0.5">تشفير كامل للأمان والحماية</p>
              <p className="mt-3 text-xs leading-relaxed text-[#a4c0b6]">
                End-to-end 256-bit AES encryption at rest and TLS 1.3 in transit with automated nightly offsite database backups.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                <Cpu size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">99.99% Uptime Guarantee</h3>
              <p className="text-xs font-semibold text-[#6ee7b7] mt-0.5">استقرار وتشغيل مستمر بنسبة 99.99%</p>
              <p className="mt-3 text-xs leading-relaxed text-[#a4c0b6]">
                High-resiliency architecture engineered to handle peak invoicing volumes during tax deadlines without slowdown.
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
              <span>Packages & Subscription Plans | باقات الاشتراك والأسعار</span>
            </div>
            
            <h2 className="text-3xl font-black text-[#071f19] sm:text-4xl">
              Choose the Right Package for Your Business <br />
              <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
                اختر الباقة المناسبة لمنشأتك بدون مصاريف خفية
              </span>
            </h2>
            
            <p className="mt-4 text-sm text-[#485d56]">
              All packages include 15% Saudi VAT calculation, SOCPA double-entry accounting, Base64 TLV QR codes, and bilingual Arabic & English interface.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-xs font-bold uppercase tracking-wider ${!annualBilling ? 'text-[#176752]' : 'text-[#78938a]'}`}>
                Monthly / شهري
              </span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className="relative h-7 w-14 rounded-full bg-[#176752] p-1 transition-colors cursor-pointer"
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${annualBilling ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${annualBilling ? 'text-[#176752]' : 'text-[#78938a]'}`}>
                  Annual Billing / سنوي
                </span>
                <span className="rounded-full bg-[#d4af37]/20 border border-[#d4af37] px-2.5 py-0.5 text-[10px] font-extrabold text-[#b8800b]">
                  Save 20% / خصم 20%
                </span>
              </div>
            </div>
          </div>

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {packages.map((pkg) => {
              const price = annualBilling ? pkg.annualPrice : pkg.monthlyPrice;
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 cursor-pointer ${
                    pkg.popular
                      ? 'bg-[#071f19] text-white ring-2 ring-[#176752] shadow-2xl scale-[1.03] z-10'
                      : 'bg-white border border-[#e2dcce] text-[#0a2620] shadow-sm hover:shadow-xl hover:border-[#176752]/40'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#176752] to-[#d4af37] px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-md flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#fde68a]" />
                      <span>Most Popular / الأكثر طلباً</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-2xl font-black ${pkg.popular ? 'text-white' : 'text-[#071f19]'}`}>{pkg.name}</h3>
                      <span className={`text-xs font-bold ${pkg.popular ? 'text-[#d4af37]' : 'text-[#176752]'}`}>{pkg.nameAr}</span>
                    </div>

                    <p className={`mt-2 text-xs leading-relaxed ${pkg.popular ? 'text-[#a3b8b0]' : 'text-[#5c726a]'}`}>
                      {pkg.subtitle}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${pkg.popular ? 'text-[#6ee7b7]' : 'text-[#176752]'}`}>
                      {pkg.subtitleAr}
                    </p>

                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="text-4xl font-black font-mono">{price}</span>
                      <span className={`text-xs font-bold ${pkg.popular ? 'text-[#6ee7b7]' : 'text-[#176752]'}`}>
                        SAR / Month (ر.س / شهرياً)
                      </span>
                    </div>
                    <div className={`text-[10px] font-semibold mt-1 ${pkg.popular ? 'text-[#78938a]' : 'text-[#94a3b8]'}`}>
                      {annualBilling ? 'Billed annually (خصم الفوترة السنوية)' : 'Billed monthly (مفوترة شهرياً)'}
                    </div>

                    <hr className={`my-6 ${pkg.popular ? 'border-white/10' : 'border-[#e2dcce]'}`} />

                    <div className="space-y-3">
                      <div className="text-[10px] uppercase font-extrabold tracking-wider opacity-75">Package Features / مميزات الباقة:</div>
                      <ul className="space-y-2.5 text-xs">
                        {pkg.featuresEn.map((featEn, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5">
                            <Check size={15} className={pkg.popular ? 'text-[#6ee7b7] shrink-0 mt-0.5' : 'text-[#176752] shrink-0 mt-0.5'} />
                            <div>
                              <div className={pkg.popular ? 'text-[#e2e8f0] font-medium' : 'text-[#334155] font-medium'}>{featEn}</div>
                              <div className={pkg.popular ? 'text-[#6ee7b7] text-[10px]' : 'text-[#176752] text-[10px]'}>{pkg.featuresAr[fIdx]}</div>
                            </div>
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
                          ? 'btn-primary text-white shadow-[#176752]/40 hover:scale-[1.02]'
                          : 'bg-[#f0ece1] text-[#0a2620] hover:bg-[#176752] hover:text-white'
                      }`}
                    >
                      <span>{isSignedIn ? "Go to Workspace / مساحة العمل" : `${pkg.ctaEn} / ${pkg.ctaAr}`}</span>
                      <ArrowRight size={14} />
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
              <div className="eyebrow">Platform Capabilities | مميزات النظام</div>
              <h2 className="mt-2 text-3xl font-black text-[#071f19] sm:text-4xl">
                Engineered for Saudi business requirements. <br />
                <span className="text-[#176752] font-bold text-2xl">مصمم خصيصاً لتلبية متطلبات الأعمال في المملكة</span>
              </h2>
            </div>
            <Link href={isSignedIn ? "/home" : "/sign-up"} className="btn-primary inline-flex items-center gap-2 text-xs font-bold py-3 px-5 shadow-md cursor-pointer hover:scale-[1.03] transition-all">
              <span>{isSignedIn ? "Go to Workspace / مساحة العمل" : "Explore Full Platform"}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-[#e0d9ca] bg-white p-8 shadow-sm hover:shadow-xl hover:border-[#176752]/40 transition-all duration-300 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                <QrCode size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#071f19]">ZATCA E-Invoicing Phase 1 & 2</h3>
              <p className="text-xs font-bold text-[#176752] mt-0.5">الفوترة الإلكترونية المرحلة الأولى والثانية</p>
              <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                Generates Base64 TLV QR Codes, cryptographic signatures, XML formatting, and direct ZATCA FATOORA portal sync.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-[#e0d9ca] bg-white p-8 shadow-sm hover:shadow-xl hover:border-[#176752]/40 transition-all duration-300 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                <Scale size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#071f19]">Double-Entry SOCPA Ledger</h3>
              <p className="text-xs font-bold text-[#176752] mt-0.5">المحاسبة المزدوجة وفق معايير SOCPA</p>
              <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                Complete Chart of Accounts, Journal Vouchers, Account Ledgers, Trial Balance, Profit & Loss, and Balance Sheet.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-[#e0d9ca] bg-white p-8 shadow-sm hover:shadow-xl hover:border-[#176752]/40 transition-all duration-300 cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                <Building2 size={24} />
              </div>
              <h3 className="mt-6 text-lg font-bold text-[#071f19]">Multi-Branch & Catalog</h3>
              <p className="text-xs font-bold text-[#176752] mt-0.5">إدارة الفروع والسجلات التجارية المتعددة</p>
              <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                Manage multiple Saudi branches, CR numbers, commercial catalogs, VAT rates, customer and supplier directories.
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
              <div className="inline-flex items-center gap-2 rounded-full bg-[#176752]/10 border border-[#176752]/20 px-3.5 py-1 text-xs font-bold text-[#176752]">
                <Calculator size={14} className="text-[#d4af37]" />
                <span>Live Calculator Tool | حاسبة ضريبة القيمة المضافة</span>
              </div>

              <h2 className="text-3xl font-black text-[#071f19] sm:text-4xl">
                Instant 15% Saudi VAT & Invoice Breakdown
              </h2>
              <p className="text-sm text-[#485d56] leading-relaxed">
                Test how KHANBAS NEXUS calculates tax subtotals and 15% output VAT according to ZATCA regulations.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e524b] mb-2">
                    Enter Invoice Subtotal (SAR) / أدخل المبلغ قبل الضريبة
                  </label>
                  <input
                    type="number"
                    value={calcSubtotal}
                    onChange={(e) => setCalcSubtotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full max-w-sm rounded-xl border border-[#d6cfbe] bg-white px-4 py-3 text-base font-mono font-bold text-[#071f19] focus:border-[#176752] focus:outline-none focus:ring-2 focus:ring-[#176752]/20"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-3xl border border-[#071f19] bg-[#071f19] text-white p-8 lg:p-10 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">ZATCA Compliant Breakdown</span>
                <span className="text-[10px] font-bold text-[#6ee7b7] bg-[#6ee7b7]/20 px-2.5 py-1 rounded-full">15% Rate Applied</span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#a3b8b0]">Net Subtotal (قبل الضريبة):</span>
                  <span className="font-mono font-bold text-white text-base">SAR {calcSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a3b8b0]">15% Output VAT (ضريبة القيمة المضافة):</span>
                  <span className="font-mono font-bold text-[#6ee7b7] text-base">+ SAR {vatAmount.toFixed(2)}</span>
                </div>
                <hr className="border-white/10 my-4" />
                <div className="flex items-center justify-between">
                  <span className="font-black text-white">Grand Total (المبلغ الإجمالي):</span>
                  <span className="font-mono font-black text-[#d4af37] text-2xl">SAR {grandTotal.toFixed(2)}</span>
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
            <div className="eyebrow">Got Questions? | الأسئلة الشائعة</div>
            <h2 className="mt-2 text-3xl font-black text-[#071f19] sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#e2dcce] bg-white transition-all cursor-pointer overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
                >
                  <div>
                    <div className="text-base font-bold text-[#071f19]">{faq.qEn}</div>
                    <div className="text-xs font-bold text-[#176752] mt-0.5">{faq.qAr}</div>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-[#176752] transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs leading-relaxed border-t border-[#f0ece1] pt-4 animate-in fade-in duration-200 space-y-2">
                    <p className="text-[#5c726a]">{faq.aEn}</p>
                    <p className="text-[#176752] font-semibold">{faq.aAr}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* HIGH INTENT SEO KEYWORDS FOOTER HUB */}
      <section className="border-t border-[#e2dcce] bg-[#efeade] py-12 text-xs">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="text-center mb-6">
            <h3 className="font-bold text-[#071f19] uppercase tracking-wider text-[11px]">
              KSA Enterprise Search Keywords & Compliance Index | دليل الكلمات والخدمات الأكثر بحثاً في السعودية
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-[#566861]">
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">الفوترة والزكاة</strong>
              <span>برنامج فوترة إلكترونية معتمد | ZATCA Phase 2 E-Invoicing | رمز كيو آر Base64 TLV | هيئة الزكاة والضريبة والجمارك</span>
            </div>
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">المحاسبة والإقرارات</strong>
              <span>إقرار ضريبة القيمة المضافة 15% | نموذج 21 | معايير SOCPA | ميزانية عمومية وقائمة الأرباح والخسائر</span>
            </div>
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">التحول والنقل</strong>
              <span>الاستيراد من كويك بوكس | استيراد ملفات أكسل | نقل البيانات من أودو | برنامج محاسبة سحابي بديل</span>
            </div>
            <div className="rounded-xl border border-[#dcd6c8] bg-white/60 p-3">
              <strong className="block text-[#071f19] font-bold mb-1">الأمان والفروع</strong>
              <span>استضافة سحابية داخل السعودية | تشفير 256-Bit AES | إدارة الفروع والسجلات التجارية | باقات أسعار اقتصادية</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative overflow-hidden bg-[#071f19] px-6 py-20 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 px-3.5 py-1 text-xs font-bold text-[#fde68a]">
            🇸🇦 Saudi Arabia Enterprise SaaS Edition | المملكة العربية السعودية
          </span>

          <h2 className="mt-6 max-w-[680px] text-3xl font-black text-white sm:text-4xl">
            Ready to Streamline Your Saudi Business Accounting? <br />
            <span className="text-[#d4af37]">جاهز لتطوير أعمالك ونظامك المحاسبي مع نكسس؟</span>
          </h2>

          <p className="mt-3 text-sm text-[#a4c0b6] max-w-[520px]">
            Setup your organization, configure ZATCA e-invoicing, and generate SOCPA compliant reports in minutes.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link href={isSignedIn ? "/home" : "/sign-up"} className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-sm font-bold bg-[#d4af37] text-[#071f19] hover:bg-[#ebd074] transition-all shadow-xl hover:scale-[1.03] cursor-pointer">
              <span>{isSignedIn ? "Go to Workspace / مساحة العمل" : "Start Free Trial / ابدأ التجربة المجانية"}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
