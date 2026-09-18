import { useAuth } from '@clerk/react';
import { Redirect, Link } from 'wouter';
import { ArrowRight, BarChart3, Building2, Check, CreditCard, FileText, Globe2, LockKeyhole, Sparkles, Users, WalletCards, Clock3 } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
      <img src={`${basePath}/logo.svg`} className="h-10 w-10 rounded-xl" alt="KHANBAS NEXUS" data-testid="img-brand-logo" />
      <span className={`text-[18px] font-bold tracking-tight uppercase ${dark ? 'text-[#f9f5e9]' : 'text-[#173b38]'}`}>KHANBAS NEXUS</span>
    </Link>
  );
}

export function PublicHome() {
  const { isSignedIn, isLoaded } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/home" />;
  return (
    <div className="app-noise min-h-[100dvh] overflow-hidden">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#53645f] md:flex">
          <a href="#platform" data-testid="link-platform">Platform</a>
          <a href="#modules" data-testid="link-modules">Modules</a>
          <a href="#trust" data-testid="link-trust">Built for Saudi SMEs</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-[#173b38] transition hover:bg-[#e9e6d8] sm:block" data-testid="link-sign-in">Sign in</Link>
          <Link href="/sign-up" className="btn-primary text-sm" data-testid="link-get-started">Get started <ArrowRight size={16} /></Link>
        </div>
      </header>
      <main>
        <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:pb-32 lg:pt-24">
          <div className="fade-up">
            <div className="eyebrow mb-5">Connected Business Platform</div>
            <h1 className="max-w-[680px] text-[clamp(3.5rem,7vw,6.5rem)] font-bold leading-[.93] tracking-[-.075em] text-[#173b38]">Run your business. <span className="text-[#b8800b]">Connected.</span></h1>
            <p className="mt-7 max-w-[550px] text-lg leading-8 text-[#5a6963]">Start with what you need. Add more when you need it. A modular foundation built for Saudi businesses to manage finance, operations, and growth from day one.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="btn-primary px-5 py-3" data-testid="link-hero-start">Get started <ArrowRight size={17} /></Link>
              <a href="#platform" className="btn-secondary px-5 py-3 border-transparent bg-[#e1eee5] text-[#176752] hover:bg-[#d0e0d5]">Explore Nexus</a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-[#61716b]">
              <span className="flex items-center gap-2"><Check size={16} className="text-[#176752]" /> Nexus Finance Available</span>
              <span className="flex items-center gap-2"><Clock3 size={16} className="text-[#8c9c94]" /> More modules coming soon</span>
            </div>
          </div>
          <div className="fade-up-2 relative mx-auto w-full max-w-[530px]">
            <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-[#edca4e] opacity-80 blur-[1px]" />
            <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-[#d8e7dd]" />
            <div className="relative rounded-[28px] border border-[#d9d4c2] bg-[#f9f5e9] p-3 shadow-[0_30px_80px_rgba(23,59,56,.14)]">
              <div className="overflow-hidden rounded-[20px] bg-[#173b38]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><span className="text-sm font-bold text-[#f9f5e9]">Nexus Core</span><span className="rounded-full bg-[#f3c746] px-3 py-1 text-[10px] font-bold text-[#173b38]">ACTIVE</span></div>
                <div className="p-6">
                  <div className="mb-6 flex items-end justify-between"><div><div className="text-xs text-[#b2c5bd]">Workspace</div><div className="mt-1 text-2xl font-bold tracking-tight text-[#f9f5e9]">Ready to connect</div></div></div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="rounded-xl bg-white/10 p-4 border border-white/20"><div className="text-xs text-[#b2c5bd]">Nexus Finance</div><div className="mt-2 font-semibold text-[#f9f5e9] text-sm">Available</div></div>
                    <div className="rounded-xl bg-white/[.03] p-4 border border-dashed border-white/15 opacity-60"><div className="text-xs text-[#b2c5bd]">Fleet & Projects</div><div className="mt-2 font-semibold text-[#f9f5e9] text-sm">Coming Soon</div></div>
                  </div>
                  <div className="flex h-[100px] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[.03] px-6 text-center"><Globe2 size={24} className="text-[#8fb0a0]" /><div className="mt-3 text-xs font-semibold text-[#f9f5e9]">Bilingual & Saudi-ready foundation</div></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-6 rounded-2xl border border-[#d9d4c2] bg-[#fffdf7] px-4 py-3 shadow-xl"><div className="flex items-center gap-2 text-xs font-semibold text-[#173b38]"><span className="h-2 w-2 rounded-full bg-[#3f9d77]" /> Core platform active</div></div>
          </div>
        </section>
        <section id="platform" className="border-y border-[#ded9ca] bg-[#eeece1]">
          <div className="mx-auto grid max-w-[1240px] gap-0 px-6 lg:grid-cols-3 lg:px-10">
            {[
              ['01', 'Get the details right', 'Saudi business fields, bilingual names, VAT status, and fiscal settings belong in one considered place in Nexus Core.'],
              ['02', 'Start with what you need', 'Activate Nexus Finance today. Keep the complexity away until your business earns it.'],
              ['03', 'Add more when you need it', 'Fleet, Projects, Assets, and Automate modules are built to connect seamlessly when available.'],
            ].map(([n, title, text]) => <div key={n} className="border-b border-[#d9d4c2] py-10 last:border-0 lg:border-b-0 lg:border-r lg:px-9 lg:first:pl-0 lg:last:border-r-0"><div className="font-mono text-xs text-[#aa7a0d]">{n}</div><h2 className="mt-5 text-xl font-bold text-[#173b38]">{title}</h2><p className="mt-3 text-sm leading-7 text-[#65736d]">{text}</p></div>)}
          </div>
        </section>
        <section id="modules" className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32"><div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><div className="eyebrow">The Modules</div><h2 className="mt-4 max-w-[430px] text-4xl font-bold leading-tight tracking-[-.05em] text-[#173b38]">One platform.<br/>Many possibilities.</h2><p className="mt-5 max-w-[390px] leading-7 text-[#68766f]">KHANBAS NEXUS is designed to grow with your business. Connect modules as your operations expand.</p></div><div className="grid gap-4 sm:grid-cols-2">
          
          <div className="soft-card group p-6 transition hover:-translate-y-1 hover:border-[#176752]/40 bg-[#f4f7f5] border-[#176752]/20">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176752] text-white"><WalletCards size={20} /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#176752]/10 text-[#176752] px-2 py-1 rounded">Available</span>
            </div>
            <h3 className="mt-6 font-bold text-[#173b38]">Nexus Finance</h3>
            <p className="mt-2 text-sm leading-6 text-[#758078]">Saudi-ready finance and accounting workspace.</p>
          </div>

          <div className="soft-card p-6 opacity-70 bg-[#faf9f6]">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e5e7e6] text-[#758078]"><Clock3 size={20} /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e5e7e6] text-[#758078] px-2 py-1 rounded">Coming Soon</span>
            </div>
            <h3 className="mt-6 font-bold text-[#173b38]">Nexus Fleet</h3>
            <p className="mt-2 text-sm leading-6 text-[#758078]">Connected fleet operations and mobility.</p>
          </div>

          <div className="soft-card p-6 opacity-70 bg-[#faf9f6]">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e5e7e6] text-[#758078]"><Clock3 size={20} /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e5e7e6] text-[#758078] px-2 py-1 rounded">Coming Soon</span>
            </div>
            <h3 className="mt-6 font-bold text-[#173b38]">Nexus Projects</h3>
            <p className="mt-2 text-sm leading-6 text-[#758078]">Projects, delivery, and commercial control.</p>
          </div>

          <div className="soft-card p-6 opacity-70 bg-[#faf9f6]">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e5e7e6] text-[#758078]"><Clock3 size={20} /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e5e7e6] text-[#758078] px-2 py-1 rounded">Coming Soon</span>
            </div>
            <h3 className="mt-6 font-bold text-[#173b38]">Other Modules</h3>
            <p className="mt-2 text-sm leading-6 text-[#758078]">Assets, Intelligence, and Automate.</p>
          </div>

        </div></div></section>
        <section id="trust" className="bg-[#173b38] px-6 py-20 text-[#f9f5e9] lg:px-10"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="eyebrow !text-[#f3c746]">Built with context</div><h2 className="mt-4 max-w-[650px] text-4xl font-bold leading-tight tracking-[-.05em]">The confidence of knowing your first settings are not an afterthought.</h2></div><Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-bold text-[#f3c746]" data-testid="link-footer-start">Get started <ArrowRight size={17} /></Link></div></section>
      </main>
      <footer className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-7 text-xs text-[#79837b] lg:px-10"><Logo /><span>© {new Date().getFullYear()} KHANBAS NEXUS. Built for the Kingdom.</span></footer>
    </div>
  );
}
