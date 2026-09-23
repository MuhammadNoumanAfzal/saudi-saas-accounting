import { PublicLayout } from '@/components/layout/public-layout';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Server, 
  CheckCircle2, 
  FileCheck, 
  Building2,
  Sparkles
} from 'lucide-react';

export function SecurityPage() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-20">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-4">
            <ShieldCheck size={14} className="text-[#d4af37]" />
            <span>Bank-Grade Data Protection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#071f19]">
            Security, Privacy & <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">Regulatory Compliance</span>
          </h1>
          <p className="mt-4 text-base text-[#485d56]">
            KHANBAS NEXUS is built with zero-trust architecture, TLS 1.3 in-transit encryption, and 256-bit AES at-rest encryption to protect your financial ledgers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#176752]/10 text-[#176752] flex items-center justify-center mb-6">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#071f19] mb-2">256-bit AES Encryption</h3>
            <p className="text-xs text-[#5c726a] leading-relaxed">
              All financial records, invoices, bank balances, and customer directory entries are encrypted at rest using military-grade AES-256 keys.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#d4af37]/15 text-[#b8800b] flex items-center justify-center mb-6">
              <Key size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#071f19] mb-2">ZATCA ECDSA Signing</h3>
            <p className="text-xs text-[#5c726a] leading-relaxed">
              Implements ZATCA cryptographic stamp signing (ECDSA secp256k1) and SHA-256 previous invoice hash (PIH) chain validation.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 text-[#10b981] flex items-center justify-center mb-6">
              <Server size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#071f19] mb-2">Daily Automated Backups</h3>
            <p className="text-xs text-[#5c726a] leading-relaxed">
              Nightly encrypted snapshot backups stored across geographically redundant Saudi cloud regions, guaranteeing 99.99% availability.
            </p>
          </div>

        </div>

      </section>
    </PublicLayout>
  );
}
