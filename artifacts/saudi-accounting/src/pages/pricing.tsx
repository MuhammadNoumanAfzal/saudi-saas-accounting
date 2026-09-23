import { useState } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Link } from 'wouter';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export function PricingPage() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      nameAr: "الباقة الأساسية",
      description: "Ideal for freelancers, small stores, and single-proprietorship businesses.",
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        "1 Organization User",
        "Up to 100 Invoices / Month",
        "ZATCA Phase 1 TLV QR Code",
        "15% Saudi VAT Calculation",
        "Customers & Suppliers Directory",
        "Standard Double-Entry Ledger",
        "Email Support"
      ],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      nameAr: "الباقة الاحترافية",
      description: "Designed for growing Saudi SMEs, multi-staff businesses & VAT registrants.",
      monthlyPrice: 299,
      annualPrice: 239,
      features: [
        "Up to 5 Team Members",
        "Unlimited Invoices & Quotes",
        "ZATCA Phase 2 Fatoora API Sync",
        "Official Form 21 VAT Declaration",
        "SOCPA Double-Entry Accounting",
        "Profit & Loss + Balance Sheet",
        "Audit Log & Activity History",
        "24/7 Priority Support"
      ],
      popular: true,
      cta: "Get Started Now"
    },
    {
      name: "Enterprise",
      nameAr: "باقة المؤسسات",
      description: "Full multi-branch suite for corporate companies & high-volume trading.",
      monthlyPrice: 599,
      annualPrice: 479,
      features: [
        "Unlimited Staff Members",
        "Multi-Branch & Location Support",
        "Real-Time ZATCA Clearance API",
        "Automated Nightly Backups",
        "Custom Roles & Granular RBAC",
        "Dedicated Account Manager",
        "Custom API & Webhooks Access",
        "SLA Guarantee (99.99%)"
      ],
      popular: false,
      cta: "Contact Enterprise Sales"
    }
  ];

  return (
    <PublicLayout>
      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-20">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-4">
            <Sparkles size={14} className="text-[#d4af37]" />
            <span>Simple, Transparent Saudi Pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#071f19]">
            Enterprise Accounting & ZATCA SaaS <br />
            <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
              Without Hidden Fees
            </span>
          </h1>
          <p className="mt-4 text-base text-[#485d56]">
            All plans include 15% Saudi VAT compliance, SOCPA double-entry accounting, and instant Base64 TLV QR code generation.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-xs font-bold uppercase tracking-wider ${!annual ? 'text-[#176752]' : 'text-[#78938a]'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative h-7 w-14 rounded-full bg-[#176752] p-1 transition-colors cursor-pointer"
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-transform ${annual ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider ${annual ? 'text-[#176752]' : 'text-[#78938a]'}`}>Annual Billing</span>
              <span className="rounded-full bg-[#d4af37]/20 border border-[#d4af37] px-2 py-0.5 text-[10px] font-extrabold text-[#b8800b]">Save 20%</span>
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
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <h3 className={`text-2xl font-black ${plan.popular ? 'text-white' : 'text-[#071f19]'}`}>{plan.name}</h3>
                  <p className={`mt-2 text-xs leading-relaxed ${plan.popular ? 'text-[#a3b8b0]' : 'text-[#5c726a]'}`}>{plan.description}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black font-mono">{price}</span>
                    <span className={`text-xs font-bold ${plan.popular ? 'text-[#6ee7b7]' : 'text-[#176752]'}`}>SAR / month</span>
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${plan.popular ? 'text-[#78938a]' : 'text-[#94a3b8]'}`}>
                    {annual ? 'Billed annually (12 months)' : 'Billed monthly'}
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
                    <ArrowRight size={14} />
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
