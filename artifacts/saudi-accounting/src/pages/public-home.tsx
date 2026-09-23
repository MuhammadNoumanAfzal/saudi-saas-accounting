import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { Redirect, Link } from 'wouter';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Scale, 
  Zap,
  TrendingUp,
  Layers,
  ChevronRight,
  CheckCircle2,
  Receipt,
  FileCheck,
  WalletCards,
  Clock3,
  Building2,
  BarChart3,
  Check,
  Globe2,
  Sliders,
  ArrowUpRight,
  Activity
} from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group" data-testid="link-brand">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#176752] via-[#0d3d31] to-[#071f19] p-2 shadow-md shadow-[#176752]/25 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105">
        <img src={`${basePath}/logo.svg`} className="h-full w-full object-contain drop-shadow" alt="KHANBAS NEXUS" data-testid="img-brand-logo" />
      </div>
      <div className="flex flex-col">
        <span className={`text-[17px] font-black tracking-tight uppercase ${dark ? 'text-[#f9f5e9]' : 'text-[#0a2620]'}`}>
          KHANBAS <span className="text-[#d4af37]">NEXUS</span>
        </span>
        <span className="text-[9px] font-bold tracking-widest text-[#5c726a] uppercase -mt-1">Saudi Enterprise SaaS</span>
      </div>
    </Link>
  );
}

export function PublicHome() {
  const { isSignedIn, isLoaded } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoice' | 'ledger' | 'vat'>('invoice');

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

  return (
    <div className="app-noise relative min-h-[100dvh] bg-[#f8f6f0] text-[#0a2620] selection:bg-[#176752] selection:text-white overflow-x-hidden">
      
      {/* Radiant Background Lighting */}
      <div className="pointer-events-none absolute left-1/2 -top-24 -z-10 h-[550px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#176752]/18 via-[#d4af37]/12 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-96 -z-10 h-[450px] w-[450px] rounded-full bg-[#10b981]/10 blur-[130px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#f8f6f0]/85 border-b border-[#e2dcce]/70 transition-all">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-3.5 lg:px-10">
          <Logo />
          
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#485b54] md:flex">
            <a href="#preview" className="hover:text-[#176752] transition-colors">Live Preview</a>
            <a href="#features" className="hover:text-[#176752] transition-colors">Core Features</a>
            <a href="#modules" className="hover:text-[#176752] transition-colors">Modules</a>
            <a href="#trust" className="hover:text-[#176752] transition-colors">Compliance</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0a2620] hover:bg-[#eadecc]/50 sm:block transition">
              Sign In
            </Link>
            <Link href="/sign-up" className="btn-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2.5 shadow-md shadow-[#176752]/20 hover:shadow-lg hover:shadow-[#176752]/30 transition-all">
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* COMPACT LUXURY HERO SECTION */}
        <section className="mx-auto grid max-w-[1240px] items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_1fr] lg:px-10 lg:py-14">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#176752] shadow-sm mb-5">
              <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-ping" />
              <Sparkles size={13} className="text-[#d4af37]" />
              <span>Saudi Enterprise Accounting Platform</span>
            </div>

            <h1 className="text-[clamp(2.5rem,4.5vw,4.5rem)] font-black leading-[1.04] tracking-tight text-[#071f19]">
              Saudi Enterprise Accounting. <br />
              <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
                Smarter, Faster & Compliant.
              </span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-[#485d56] max-w-[520px]">
              Unified double-entry financial ledger, instant Base64 TLV e-invoicing, automatic 15% VAT Form 21 reporting, and multi-branch operations designed strictly to SOCPA & ZATCA FATOORA standards.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="btn-primary flex items-center gap-2 px-6 py-3 text-sm shadow-lg shadow-[#176752]/25 hover:scale-[1.02] transition-all" data-testid="link-hero-start">
                <span>Start Free Account</span>
                <ArrowRight size={16} />
              </Link>
              <a href="#preview" className="flex items-center gap-2 rounded-xl border border-[#d6cfbe] bg-white px-5 py-3 text-sm font-bold text-[#0a2620] hover:bg-[#ede7d8] transition-colors">
                <Activity size={16} className="text-[#176752]" />
                <span>Interactive Live Demo</span>
              </a>
            </div>

            {/* Compact Trust Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-bold text-[#3e524b]">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#176752]" /> ZATCA Phase 1 & 2</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#176752]" /> SOCPA GAAP Compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-[#176752]" /> Instant TLV QR Code</span>
            </div>
          </div>

          {/* DYNAMIC DUAL-MODE INTERACTIVE PREVIEW WIDGET */}
          <div id="preview" className="fade-up-2 relative mx-auto w-full max-w-[540px]">
            {/* Background Glow Ring */}
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-[#d4af37] to-[#10b981] opacity-60 blur-xl" />
            <div className="absolute -left-6 -bottom-6 h-36 w-36 rounded-full bg-[#176752]/20 blur-xl" />

            <div className="relative overflow-hidden rounded-2xl border border-[#d8d2c2] bg-white/90 p-2 shadow-2xl backdrop-blur-xl">
              <div className="rounded-xl bg-[#071f19] text-white p-5 shadow-2xl">
                
                {/* Header Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setActiveTab('invoice')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        activeTab === 'invoice' ? 'bg-[#176752] text-white shadow' : 'text-[#8fa8a0] hover:text-white'
                      }`}
                    >
                      <QrCode size={13} />
                      <span>E-Invoice</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('ledger')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        activeTab === 'ledger' ? 'bg-[#176752] text-white shadow' : 'text-[#8fa8a0] hover:text-white'
                      }`}
                    >
                      <BarChart3 size={13} />
                      <span>Ledger</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('vat')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        activeTab === 'vat' ? 'bg-[#176752] text-white shadow' : 'text-[#8fa8a0] hover:text-white'
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
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                          <QrCode size={20} />
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
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#d4af37]">Trial Balance Reconciliation</span>
                        <span className="text-[10px] font-bold text-[#34d399] bg-[#34d399]/20 px-2 py-0.5 rounded">100% Balanced</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/10">
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
                    <div className="rounded-xl border border-[#176752] bg-[#176752]/30 p-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-[#9ab3a9]">Quarterly Net VAT</div>
                          <div className="text-lg font-extrabold text-[#ffffff] mt-0.5">SAR 1,200.00 Refundable</div>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#176752] text-white">
                          <Receipt size={18} />
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-[#6ee7b7] border-t border-white/10 pt-2 flex justify-between">
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

        {/* ULTRA-COMPACT GLASS METRICS BAR */}
        <section className="border-y border-[#e2dcce] bg-[#efeade]/80 py-6">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 overflow-x-auto text-xs font-extrabold text-[#071f19] lg:px-10">
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

        {/* CORE PLATFORM FEATURES (COMPACT SPLIT LAYOUT) */}
        <section id="features" className="py-16 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="eyebrow">Platform Capabilities</div>
                <h2 className="mt-2 text-2xl font-black text-[#071f19] sm:text-3xl">
                  Built specifically for Saudi business requirements.
                </h2>
              </div>
              <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 text-xs py-2.5 px-4 shadow-sm">
                <span>Explore Full Engine</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group rounded-xl border border-[#e0d9ca] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#176752]/40 transition-all">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                  <QrCode size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#071f19]">ZATCA E-Invoicing Phase 1 & 2</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                  Generates Base64 TLV QR Codes, cryptographic signatures, XML formatting, and direct ZATCA FATOORA portal sync.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group rounded-xl border border-[#e0d9ca] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#176752]/40 transition-all">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                  <Scale size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#071f19]">Double-Entry SOCPA Ledger</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                  Complete Chart of Accounts, Journal Vouchers, Account Ledgers, Trial Balance, Profit & Loss, and Balance Sheet.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group rounded-xl border border-[#e0d9ca] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#176752]/40 transition-all">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176752]/10 text-[#176752] group-hover:bg-[#176752] group-hover:text-white transition-colors">
                  <Building2 size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#071f19]">Multi-Branch & Catalog</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#566861]">
                  Manage multiple Saudi branches, CR numbers, commercial catalogs, VAT rates, customer and supplier directories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MODULES SHOWCASE */}
        <section id="modules" className="border-t border-[#e2dcce] bg-[#f3efe4] py-16 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
            <div className="text-center max-w-[500px] mx-auto mb-10">
              <div className="eyebrow">Modular Architecture</div>
              <h2 className="mt-2 text-2xl font-black text-[#071f19] sm:text-3xl">
                One unified platform. Connect as you grow.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Active Module: Nexus Finance */}
              <div className="rounded-xl border-2 border-[#176752] bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#176752] text-white">
                    <WalletCards size={18} />
                  </div>
                  <span className="rounded bg-[#176752]/15 px-2 py-0.5 text-[9px] font-bold text-[#176752] uppercase">
                    Available Now
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#071f19]">Nexus Finance</h3>
                <p className="mt-1 text-[11px] text-[#5c6e67] leading-relaxed">
                  Invoices, Bills, Ledger, ZATCA Phase 2 & VAT Form 21.
                </p>
              </div>

              {/* Coming Soon: Fleet */}
              <div className="rounded-xl border border-[#ded8c7] bg-[#f9f7f0] p-5 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 text-[#6d7f78]">
                    <Clock3 size={18} />
                  </div>
                  <span className="rounded bg-black/5 px-2 py-0.5 text-[9px] font-bold text-[#6d7f78] uppercase">
                    Coming Soon
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#071f19]">Nexus Fleet</h3>
                <p className="mt-1 text-[11px] text-[#5c6e67] leading-relaxed">
                  Logistics, vehicles, fuel logs & driver maintenance.
                </p>
              </div>

              {/* Coming Soon: Projects */}
              <div className="rounded-xl border border-[#ded8c7] bg-[#f9f7f0] p-5 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 text-[#6d7f78]">
                    <Clock3 size={18} />
                  </div>
                  <span className="rounded bg-black/5 px-2 py-0.5 text-[9px] font-bold text-[#6d7f78] uppercase">
                    Coming Soon
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#071f19]">Nexus Projects</h3>
                <p className="mt-1 text-[11px] text-[#5c6e67] leading-relaxed">
                  Project costing, delivery milestones & profitability.
                </p>
              </div>

              {/* Coming Soon: HR */}
              <div className="rounded-xl border border-[#ded8c7] bg-[#f9f7f0] p-5 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 text-[#6d7f78]">
                    <Clock3 size={18} />
                  </div>
                  <span className="rounded bg-black/5 px-2 py-0.5 text-[9px] font-bold text-[#6d7f78] uppercase">
                    Coming Soon
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#071f19]">Nexus HR & Payroll</h3>
                <p className="mt-1 text-[11px] text-[#5c6e67] leading-relaxed">
                  Saudi Labor Law EOSB & GOSI calculations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPACT LUXURY CTA FOOTER BANNER */}
        <section id="trust" className="relative overflow-hidden bg-[#071f19] px-6 py-16 text-white lg:px-10">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/30 px-3 py-1 text-xs font-bold text-[#fde68a]">
              🇸🇦 Saudi Arabia Business Edition
            </span>

            <h2 className="mt-4 max-w-[600px] text-2xl font-black text-white sm:text-4xl">
              Get Started with KHANBAS NEXUS Today.
            </h2>

            <p className="mt-2 text-sm text-[#a4c0b6] max-w-[460px]">
              Setup your organization, configure ZATCA e-invoicing, and generate SOCPA compliant reports in minutes.
            </p>

            <div className="mt-6">
              <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 px-7 py-3 text-sm font-bold bg-[#d4af37] text-[#071f19] hover:bg-[#ebd074] transition-all shadow-lg">
                <span>Start Free Trial</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e2dcce] bg-[#eadecc]/40 py-6">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-6 text-xs text-[#5c7069] sm:flex-row lg:px-10">
          <Logo />
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} KHANBAS NEXUS. All rights reserved.</span>
            <span className="text-[#176752] font-bold">ZATCA Compliant 🇸🇦</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
