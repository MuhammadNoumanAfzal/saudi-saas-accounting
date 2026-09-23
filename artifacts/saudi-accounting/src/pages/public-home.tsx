import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { Redirect, Link } from 'wouter';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { PublicLayout } from '@/components/layout/public-layout';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Scale, 
  Zap,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Receipt,
  WalletCards,
  Clock3,
  Building2,
  BarChart3,
  Check,
  Globe2,
  Activity,
  Calculator,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

export function PublicHome() {
  const { isSignedIn, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoice' | 'ledger' | 'vat'>('invoice');
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

  if (isSignedIn) return <Redirect to="/home" />;

  const faqs = [
    {
      q: "Is KHANBAS NEXUS fully certified for ZATCA Phase 2 E-Invoicing?",
      a: "Yes. Our platform generates 100% compliant Base64 TLV QR codes for Phase 1 and includes cryptographic ECDSA stamp signatures, SHA-256 previous invoice hash (PIH) chaining, and UBL 2.1 XML clearance APIs for ZATCA Phase 2."
    },
    {
      q: "Can I manage multiple Saudi business branches under one account?",
      a: "Absolutely. You can add multiple branches, commercial registration (CR) numbers, and location profiles under a single organization session and switch between them instantly."
    },
    {
      q: "Does the system calculate Saudi 15% VAT and Form 21 automatically?",
      a: "Yes. All sales invoices, purchase bills, and operational expenses automatically compute Output VAT and Input VAT, generating an official ZATCA Form 21 Tax Return report ready for submission."
    },
    {
      q: "Is my financial data stored securely in accordance with KSA regulations?",
      a: "Your data is stored in bank-grade encrypted Saudi cloud servers with 256-bit AES encryption at rest and TLS 1.3 in transit, backed up nightly with 99.99% uptime guarantee."
    }
  ];

  return (
    <PublicLayout>
      
      {/* HERO SECTION */}
      <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 py-12 lg:grid-cols-[1fr_1fr] lg:px-10 lg:py-20">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
            <Sparkles size={14} className="text-[#d4af37]" />
            <span>Saudi Enterprise Accounting Platform</span>
          </div>

          <h1 className="text-[clamp(2.5rem,4.5vw,4.5rem)] font-black leading-[1.04] tracking-tight text-[#071f19]">
            Saudi Enterprise Accounting. <br />
            <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
              Smarter, Faster & ZATCA Compliant.
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-[#485d56] max-w-[540px]">
            Unified double-entry financial ledger, instant Base64 TLV e-invoicing, automatic 15% VAT Form 21 reporting, and multi-branch operations designed strictly to SOCPA & ZATCA FATOORA standards.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/sign-up" className="btn-primary flex items-center gap-2 px-7 py-3.5 text-sm font-bold shadow-xl shadow-[#176752]/25 hover:scale-[1.03] transition-all cursor-pointer" data-testid="link-hero-start">
              <span>Start Free Account</span>
              <ArrowRight size={16} />
            </Link>
            <a href="#preview" className="flex items-center gap-2 rounded-xl border border-[#d6cfbe] bg-white px-6 py-3.5 text-sm font-bold text-[#0a2620] hover:bg-[#ede7d8] transition-colors cursor-pointer">
              <Activity size={16} className="text-[#176752]" />
              <span>Interactive Live Demo</span>
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
            <span>100% ZATCA Compliant</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Receipt size={16} className="text-[#b8800b]" />
            <span>Automated 15% VAT Form 21</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Scale size={16} className="text-[#176752]" />
            <span>SOCPA GAAP Standard</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Zap size={16} className="text-[#b8800b]" />
            <span>Instant TLV Base64 QR</span>
          </div>
          <span className="text-[#c5bea9]">|</span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Globe2 size={16} className="text-[#176752]" />
            <span>Arabic & English Bilingual</span>
          </div>
        </div>
      </section>

      {/* CORE PLATFORM FEATURES */}
      <section id="features" className="py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="eyebrow">Platform Capabilities</div>
              <h2 className="mt-2 text-3xl font-black text-[#071f19] sm:text-4xl">
                Engineered for Saudi business requirements.
              </h2>
            </div>
            <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 text-xs font-bold py-3 px-5 shadow-md cursor-pointer hover:scale-[1.03] transition-all">
              <span>Explore Full Platform</span>
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
                <span>Live Calculator Tool</span>
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
                    Enter Invoice Subtotal (SAR)
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
            <div className="eyebrow">Got Questions?</div>
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
                  <span className="text-base font-bold text-[#071f19]">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-[#176752] transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs leading-relaxed text-[#5c726a] border-t border-[#f0ece1] pt-4 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative overflow-hidden bg-[#071f19] px-6 py-20 text-white lg:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 px-3.5 py-1 text-xs font-bold text-[#fde68a]">
            🇸🇦 Saudi Arabia Business Edition
          </span>

          <h2 className="mt-6 max-w-[640px] text-3xl font-black text-white sm:text-4xl">
            Ready to Streamline Your Saudi Business Accounting?
          </h2>

          <p className="mt-3 text-sm text-[#a4c0b6] max-w-[480px]">
            Setup your organization, configure ZATCA e-invoicing, and generate SOCPA compliant reports in minutes.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-sm font-bold bg-[#d4af37] text-[#071f19] hover:bg-[#ebd074] transition-all shadow-xl hover:scale-[1.03] cursor-pointer">
              <span>Start Free Trial</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
