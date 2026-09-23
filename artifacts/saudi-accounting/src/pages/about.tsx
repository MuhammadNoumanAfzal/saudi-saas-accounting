import { PublicLayout } from '@/components/layout/public-layout';
import { Link } from 'wouter';
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  Target, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Globe2,
  Lock
} from 'lucide-react';

export function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-6">
          <Sparkles size={14} className="text-[#d4af37]" />
          <span>Aligned with Saudi Vision 2030</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#071f19] max-w-4xl mx-auto leading-tight">
          Empowering Saudi Businesses with Next-Generation <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">Fintech & ZATCA SaaS</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-[#485d56] max-w-3xl mx-auto leading-relaxed">
          KHANBAS NEXUS was founded in Riyadh with a single mission: to revolutionize financial accounting for Saudi Arabian enterprises through ultra-fast, double-entry ledgers and 100% ZATCA Phase 2 compliant e-invoicing.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/sign-up" className="btn-primary flex items-center gap-2 px-7 py-3.5 text-sm font-bold shadow-xl shadow-[#176752]/25 hover:scale-[1.03] transition-all cursor-pointer">
            <span>Explore Enterprise SaaS</span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/contact" className="flex items-center gap-2 rounded-xl border border-[#d6cfbe] bg-white px-6 py-3.5 text-sm font-bold text-[#0a2620] hover:bg-[#ede7d8] transition-colors cursor-pointer">
            <span>Contact Saudi HQ</span>
          </Link>
        </div>
      </section>

      {/* Core Mission Pillars */}
      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 shadow-sm hover:shadow-xl hover:border-[#176752]/40 transition-all duration-300 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-[#176752]/10 text-[#176752] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#071f19] mb-3">Our Mission</h3>
            <p className="text-sm text-[#485d56] leading-relaxed">
              To provide every Saudi business owner, accountant, and auditor with an instantaneous, cloud-native financial engine that automates ZATCA compliance and eliminates tax filing errors.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 shadow-sm hover:shadow-xl hover:border-[#176752]/40 transition-all duration-300 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-[#d4af37]/15 text-[#b8800b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#071f19] mb-3">100% ZATCA & SOCPA</h3>
            <p className="text-sm text-[#485d56] leading-relaxed">
              Engineered strictly to Saudi Organization for Certified Public Accountants (SOCPA) double-entry standards and ZATCA Phase 1 & 2 cryptographic hash specifications.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 shadow-sm hover:shadow-xl hover:border-[#176752]/40 transition-all duration-300 cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#071f19] mb-3">Sub-5ms Execution</h3>
            <p className="text-sm text-[#485d56] leading-relaxed">
              Built on sub-millisecond database architecture and React Query edge memory caching, rendering financial reports and VAT Form 21 declarations instantly with 0ms delay.
            </p>
          </div>

        </div>
      </section>

      {/* Saudi Vision 2030 Feature Banner */}
      <section className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-[#071f19] text-white p-10 lg:p-16 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#6ee7b7] mb-4">
              <span>🇸🇦 Kingdom of Saudi Arabia</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white mb-4">
              Driving Digital Transformation for KSA Enterprises
            </h2>
            <p className="text-sm leading-relaxed text-[#a3b8b0] mb-8">
              Whether you run a sole-proprietorship in Jeddah, a commercial trading branch in Dammam, or a corporate enterprise in Riyadh, KHANBAS NEXUS provides instant bilingual financial control.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10">
              <div>
                <div className="text-3xl font-black text-[#d4af37]">100%</div>
                <div className="text-xs text-[#a3b8b0] mt-1">ZATCA Compliant</div>
              </div>
              <div>
                <div className="text-3xl font-black text-[#6ee7b7]">&lt; 5ms</div>
                <div className="text-xs text-[#a3b8b0] mt-1">Query Speed</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">256-bit</div>
                <div className="text-xs text-[#a3b8b0] mt-1">AES Encryption</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
