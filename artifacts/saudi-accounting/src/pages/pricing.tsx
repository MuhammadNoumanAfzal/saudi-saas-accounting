import { useState } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Link } from 'wouter';
import { useTranslation } from '@/lib/utils';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  ArrowRight,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

export function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const { isRtl, t } = useTranslation();

  const plans = [
    {
      name: t("Starter", "الباقة الأساسية"),
      description: t("Ideal for freelancers, small stores, and single-proprietorship businesses.", "مثالية للمحلات الصغيرة والأنشطة التجارية الفردية والمؤسسات الناشئة."),
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        t("1 Organization User", "مستخدم واحد للمنشأة"),
        t("Up to 100 Invoices / Month", "حتى 100 فاتورة شهرياً"),
        t("ZATCA Phase 1 TLV QR Code", "رمز QR المعتمد لـ ZATCA المرحلة 1"),
        t("15% Saudi VAT Calculation", "احتساب ضريبة القيمة المضافة 15%"),
        t("Customers & Suppliers Directory", "دليل العملاء والموردين الكامل"),
        t("Standard Double-Entry Ledger", "دفتر الأستاذ المزدوج"),
        t("Email & Chat Support", "دعم فني عبر البريد والدردشة")
      ],
      popular: false,
      cta: t("Start Free Trial", "ابدأ التجربة المجانية")
    },
    {
      name: t("Professional", "الباقة الاحترافية"),
      description: t("Designed for growing Saudi SMEs, multi-staff businesses & VAT registrants.", "مصممة للشركات المتوسطة والمنشآت المسجلة في الضريبة متعددة الموظفين."),
      monthlyPrice: 299,
      annualPrice: 239,
      features: [
        t("Up to 5 Team Members", "حتى 5 مستخدمين للمنشأة"),
        t("Unlimited Invoices & Quotes", "فواتير وعروض أسعار غير محدودة"),
        t("ZATCA Phase 2 Fatoora API Sync", "الربط المباشر مع هيئة الزكاة (ZATCA Phase 2)"),
        t("Official Form 21 VAT Declaration", "الإقرار الضريبي المعتمد (نموذج 21)"),
        t("SOCPA Double-Entry Accounting", "المحاسبة المزدوجة وفق معايير SOCPA"),
        t("Profit & Loss + Balance Sheet", "تقارير الأرباح والخسائر والميزانية العمومية"),
        t("Audit Log & Activity History", "سجل مراجعة كامل وتتبع العمليات"),
        t("24/7 Priority Support", "دعم فني أولوية على مدار 24/7")
      ],
      popular: true,
      cta: t("Get Started Now", "اشترك بالباقة الاحترافية")
    },
    {
      name: t("Enterprise", "باقة المؤسسات والفروع"),
      description: t("Full multi-branch suite for corporate companies & high-volume trading.", "حلول شاملة للمؤسسات المتعددة الفروع والتجارة الكبيرة."),
      monthlyPrice: 599,
      annualPrice: 479,
      features: [
        t("Unlimited Staff Members", "عدد غير محدود من الموظفين"),
        t("Multi-Branch & Location Support", "إدارة الفروع والسجلات التجارية المتعددة"),
        t("Real-Time ZATCA Clearance API", "تطهير واعتماد الفواتير الفوري مع الزكاة"),
        t("Automated Nightly Backups", "نسخ احتياطي آلي يومي وضمان 99.99%"),
        t("Custom Roles & Granular RBAC", "صلاحيات مخصصة ومتقدمة لكل موظف"),
        t("Dedicated Account Manager", "مدير حساب سعودي مخصص"),
        t("Custom API & Webhooks Access", "ربط API مخصص مع الأنظمة الأخرى"),
        t("SLA Guarantee (99.99%)", "تدريب كامل وضمان مستوى الخدمة SLA")
      ],
      popular: false,
      cta: t("Contact Enterprise Sales", "تواصل مع المبيعات")
    }
  ];

  return (
    <PublicLayout>
      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-20">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-4">
            <Sparkles size={14} className="text-[#d4af37]" />
            <span>{t("Simple, Transparent Saudi Pricing", "أسعار واضحة ومناسبة للمنشآت السعودية")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#071f19]">
            {t("Enterprise Accounting & ZATCA SaaS", "نظام المحاسبة والفوترة الإلكترونية")} <br />
            <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
              {t("Without Hidden Fees", "بأفضل الباقات وبدون أي رسوم خفية")}
            </span>
          </h1>
          <p className="mt-4 text-base text-[#485d56]">
            {t(
              "All plans include 15% Saudi VAT compliance, SOCPA double-entry accounting, and instant Base64 TLV QR code generation.",
              "جميع الباقات تشمل احتساب ضريبة القيمة المضافة 15%، المحاسبة المزدوجة بمعايير SOCPA، وإنشاء رموز QR المعتمدة فورياً."
            )}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-xs font-bold uppercase tracking-wider ${!annual ? 'text-[#176752]' : 'text-[#78938a]'}`}>
              {t("Monthly", "شهري")}
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative h-7 w-14 rounded-full bg-[#176752] p-1 transition-colors cursor-pointer"
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-transform ${annual ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${annual ? 'text-[#176752]' : 'text-[#78938a]'}`}>
                {t("Annual Billing", "سنوي")}
              </span>
              <span className="rounded-full bg-[#d4af37]/20 border border-[#d4af37] px-2 py-0.5 text-[10px] font-extrabold text-[#b8800b]">
                {t("Save 20%", "خصم 20%")}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={idx}
                className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 cursor-pointer ${
                  plan.popular
                    ? 'bg-[#071f19] text-white ring-2 ring-[#176752] shadow-2xl scale-[1.03] z-10'
                    : 'bg-white border border-[#e2dcce] text-[#0a2620] shadow-sm hover:shadow-xl hover:border-[#176752]/40'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#176752] to-[#d4af37] px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-md">
                    {t("Most Popular Choice", "الأكثر طلباً للمنشآت")}
                  </div>
                )}

                <div>
                  <h3 className={`text-2xl font-black ${plan.popular ? 'text-white' : 'text-[#071f19]'}`}>{plan.name}</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${plan.popular ? 'text-[#a3b8b0]' : 'text-[#5c726a]'}`}>{plan.description}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black font-mono">{price}</span>
                    <span className={`text-xs font-bold ${plan.popular ? 'text-[#6ee7b7]' : 'text-[#176752]'}`}>
                      {t("SAR / month", "ر.س / شهرياً")}
                    </span>
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${plan.popular ? 'text-[#78938a]' : 'text-[#94a3b8]'}`}>
                    {annual ? t("Billed annually (12 months)", "مفوترة سنوياً (خصم 20%)") : t("Billed monthly", "مفوترة شهرياً")}
                  </div>

                  <hr className={`my-6 ${plan.popular ? 'border-white/10' : 'border-[#e2dcce]'}`} />

                  <ul className="space-y-3 text-xs">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5">
                        <Check size={16} className={plan.popular ? 'text-[#6ee7b7] shrink-0' : 'text-[#176752] shrink-0'} />
                        <span className={plan.popular ? 'text-[#e2e8f0]' : 'text-[#334155]'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    href="/sign-up"
                    className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      plan.popular
                        ? 'btn-primary text-white shadow-[#176752]/40 hover:scale-[1.02]'
                        : 'bg-[#f0ece1] text-[#0a2620] hover:bg-[#176752] hover:text-white'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </section>
    </PublicLayout>
  );
}
