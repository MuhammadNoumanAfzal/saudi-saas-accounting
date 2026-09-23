import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@clerk/react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Globe2, 
  FileText, 
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group cursor-pointer" data-testid="link-brand">
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

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { isSignedIn } = useAuth();
  const [location, setLocation] = useLocation();

  // Automatic smooth scroll to top on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (location === '/') {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${targetId}`);
      }
    } else {
      setLocation('/');
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <div className="app-noise relative min-h-[100dvh] bg-[#f8f6f0] text-[#0a2620] selection:bg-[#176752] selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      {/* Radiant Background Lighting */}
      <div className="pointer-events-none absolute left-1/2 -top-24 -z-10 h-[550px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#176752]/18 via-[#d4af37]/12 to-transparent blur-[140px]" />

      {/* Global Public Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#f8f6f0]/90 border-b border-[#e2dcce]/70 transition-all shadow-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3.5 lg:px-10">
          <Logo />
          
          <nav className="hidden items-center gap-7 text-xs font-bold uppercase tracking-wider text-[#485b54] md:flex">
            <Link href="/" className={`hover:text-[#176752] transition-colors cursor-pointer ${location === '/' ? 'text-[#176752] font-black' : ''}`}>
              Home
            </Link>
            <a href="/#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="hover:text-[#176752] transition-colors cursor-pointer">
              Features
            </a>
            <a href="/#zatca" onClick={(e) => handleSmoothScroll(e, 'zatca')} className="hover:text-[#176752] transition-colors cursor-pointer">
              ZATCA Compliance
            </a>
            <Link href="/pricing" className={`hover:text-[#176752] transition-colors cursor-pointer ${location === '/pricing' ? 'text-[#176752] font-black' : ''}`}>
              Pricing
            </Link>
            <Link href="/about" className={`hover:text-[#176752] transition-colors cursor-pointer ${location === '/about' ? 'text-[#176752] font-black' : ''}`}>
              About Us
            </Link>
            <Link href="/security" className={`hover:text-[#176752] transition-colors cursor-pointer ${location === '/security' ? 'text-[#176752] font-black' : ''}`}>
              Security
            </Link>
            <Link href="/contact" className={`hover:text-[#176752] transition-colors cursor-pointer ${location === '/contact' ? 'text-[#176752] font-black' : ''}`}>
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/home" className="btn-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 cursor-pointer shadow-md shadow-[#176752]/20 hover:scale-[1.03] transition-all">
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="hidden rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0a2620] hover:bg-[#eadecc]/50 sm:block transition cursor-pointer">
                  Sign In
                </Link>
                <Link href="/sign-up" className="btn-primary flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4.5 py-2.5 cursor-pointer shadow-md shadow-[#176752]/20 hover:shadow-lg hover:shadow-[#176752]/30 hover:scale-[1.03] transition-all">
                  <span>Start Free</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Public Global Footer */}
      <footer className="mt-20 border-t border-[#071f19] bg-[#071f19] text-white pt-16 pb-12">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 border-b border-white/10 pb-12">
            
            {/* Column 1: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <Logo dark />
              <p className="text-xs leading-relaxed text-[#a3b8b0] max-w-[360px]">
                The leading Saudi Enterprise SaaS Accounting platform. Purpose-built for Saudi Vision 2030, SOCPA double-entry accounting GAAP compliance, and ZATCA FATOORA Phase 1 & 2 e-invoicing.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#176752]/40 border border-[#176752] px-3 py-1 text-[11px] font-bold text-[#6ee7b7]">
                  <CheckCircle2 size={13} /> 🇸🇦 ZATCA Phase 1 & 2 Certified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 px-3 py-1 text-[11px] font-bold text-[#fef08a]">
                  <ShieldCheck size={13} /> SOCPA GAAP
                </span>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37] mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs text-[#c3d4cd]">
                <li><a href="/#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> Core Features</a></li>
                <li><a href="/#zatca" onClick={(e) => handleSmoothScroll(e, 'zatca')} className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> ZATCA Phase 2 Sync</a></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> Subscription Plans</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> Security & Encryption</Link></li>
                <li><Link href="/zatca-guide" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> ZATCA Phase 2 Guide</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37] mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs text-[#c3d4cd]">
                <li><Link href="/about" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> Contact & Support</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> Privacy Policy</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"><ChevronRight size={12} className="text-[#176752]" /> Terms of Service</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact Info */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#d4af37] mb-4">Saudi HQ</h4>
              <ul className="space-y-3 text-xs text-[#c3d4cd]">
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="text-[#176752] shrink-0 mt-0.5" />
                  <span>King Fahd Road, Olaya District, Riyadh, Kingdom of Saudi Arabia</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-[#176752] shrink-0" />
                  <span>support@khanbas-nexus.sa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-[#176752] shrink-0" />
                  <span>+966 11 482 9100</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#78938a] gap-4">
            <div>
              © {new Date().getFullYear()} KHANBAS NEXUS. All rights reserved. Saudi Arabia Commercial Registration #1010894231.
            </div>
            <div className="flex items-center gap-4">
              <span>English / العربية</span>
              <span>15% Saudi VAT Compliant</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
