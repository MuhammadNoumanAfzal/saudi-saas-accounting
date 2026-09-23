import { PublicLayout } from '@/components/layout/public-layout';
import { 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck, 
  Zap, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'wouter';

export function ZatcaGuidePage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-20">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-4">
            <QrCode size={14} className="text-[#d4af37]" />
            <span>ZATCA Fatoora Compliance Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#071f19]">
            Everything You Need to Know About <br />
            <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
              ZATCA Phase 1 & Phase 2
            </span>
          </h1>
          <p className="mt-4 text-base text-[#485d56]">
            Understand how KHANBAS NEXUS automates 100% of Saudi ZATCA e-invoicing compliance, clearance APIs, and Base64 TLV QR codes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          
          {/* Phase 1 Box */}
          <div className="rounded-3xl border border-[#e2dcce] bg-white p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all cursor-pointer">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#176752]/10 border border-[#176752]/30 px-3.5 py-1 text-xs font-bold text-[#176752] mb-6">
              <span>Phase 1: Generation Phase (مرحلة الإصدار)</span>
            </div>
            <h3 className="text-2xl font-bold text-[#071f19] mb-4">Base64 TLV QR Codes & Immutable Records</h3>
            <p className="text-xs text-[#5c726a] leading-relaxed mb-6">
              Mandated since December 4, 2021. All Saudi businesses must issue electronic invoices with structured data and TLV Base64 QR codes containing 5 mandatory fields.
            </p>

            <ul className="space-y-3 text-xs text-[#3e524b]">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> 5-Tag TLV Base64 QR Code Generation</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> Prohibition of manual or edited invoices</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> Dual Arabic / English invoice headers</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> Automatic 15% Saudi VAT calculation</li>
            </ul>
          </div>

          {/* Phase 2 Box */}
          <div className="rounded-3xl border border-[#071f19] bg-[#071f19] text-white p-8 lg:p-10 shadow-xl cursor-pointer">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/20 border border-[#d4af37] px-3.5 py-1 text-xs font-bold text-[#fef08a] mb-6">
              <span>Phase 2: Integration Phase (مرحلة الربط)</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Direct ZATCA Fatoora Portal API Sync</h3>
            <p className="text-xs text-[#a3b8b0] leading-relaxed mb-6">
              Rolled out in progressive revenue waves. Mandates direct API clearance for B2B tax invoices and 24-hour reporting for B2C simplified invoices.
            </p>

            <ul className="space-y-3 text-xs text-[#c3d4cd]">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> Real-Time B2B Clearance API</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> B2C 24-Hour Reporting API</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> Cryptographic ECDSA Stamp Signatures</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> Previous Invoice Hash (PIH) SHA-256 Chain</li>
            </ul>
          </div>

        </div>

        <div className="mt-16 text-center">
          <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-sm font-bold shadow-xl shadow-[#176752]/25 hover:scale-[1.03] transition-all cursor-pointer">
            <span>Start Issuing ZATCA Invoices Free</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </section>
    </PublicLayout>
  );
}
