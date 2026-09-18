import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowRight, BarChart3, Bell, Building2, Check, Clock3, CreditCard, FileClock,
  FileText, Globe2, Home, Languages, Landmark, LockKeyhole, LogOut, Menu, Package, Receipt,
  RefreshCw, Save, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Store, Users,
  WalletCards, Zap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  getGetCurrentSessionQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetOrganizationQueryKey,
  getListAuditLogsQueryKey,
  useCreateOrganization,
  useGetCurrentSession,
  useGetDashboardSummary,
  useGetOrganization,
  useListAuditLogs,
  useUpdateOrganization,
} from '@workspace/api-client-react';
import type { Organization, OrganizationInput } from '@workspace/api-client-react';
import './index.css';
import NotFound from '@/pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const navPrimary = [
  { href: '/dashboard', label: 'Overview', arabic: 'نظرة عامة', icon: Home },
  { href: '/sales', label: 'Sales', arabic: 'المبيعات', icon: Receipt, soon: true },
  { href: '/purchases', label: 'Purchases', arabic: 'المشتريات', icon: ShoppingBag, soon: true },
  { href: '/products', label: 'Products', arabic: 'المنتجات', icon: Package, soon: true },
  { href: '/accounting', label: 'Accounting', arabic: 'المحاسبة', icon: Landmark, soon: true },
  { href: '/reports', label: 'Reports', arabic: 'التقارير', icon: BarChart3, soon: true },
];
const navSettings = [
  { href: '/settings/organization', label: 'Organization', arabic: 'المنشأة', icon: Building2 },
  { href: '/settings/users', label: 'Users & roles', arabic: 'المستخدمون والأدوار', icon: Users },
  { href: '/settings/branches', label: 'Branches', arabic: 'الفروع', icon: Store },
  { href: '/settings/language', label: 'Language & region', arabic: 'اللغة والمنطقة', icon: Languages },
  { href: '/settings/security', label: 'Security', arabic: 'الأمان', icon: ShieldCheck },
  { href: '/settings/appearance', label: 'Appearance', arabic: 'المظهر', icon: SlidersHorizontal },
  { href: '/settings/audit-log', label: 'Audit log', arabic: 'سجل النشاط', icon: FileClock },
  { href: '/settings/zatca', label: 'ZATCA', arabic: 'هيئة الزكاة والضريبة', icon: Zap },
];

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
      <img src={`${basePath}/logo.svg`} className="h-10 w-10 rounded-xl" alt="Mizan" data-testid="img-brand-logo" />
      <span className={`text-[20px] font-bold tracking-[-.04em] ${dark ? 'text-[#f9f5e9]' : 'text-[#173b38]'}`}>mizan<span className="text-[#d39f16]">.</span></span>
    </Link>
  );
}

function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return <button className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} inline-flex items-center justify-center gap-2 ${className}`} {...props}>{children}</button>;
}

function PublicHome() {
  const { isSignedIn, isLoaded } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  return (
    <div className="app-noise min-h-[100dvh] overflow-hidden">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#53645f] md:flex">
          <a href="#principles" data-testid="link-principles">Why Mizan</a>
          <a href="#setup" data-testid="link-setup">Setup in focus</a>
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
            <div className="eyebrow mb-5">The calm before the books</div>
            <h1 className="max-w-[680px] text-[clamp(3.5rem,7vw,6.5rem)] font-bold leading-[.93] tracking-[-.075em] text-[#173b38]">Start your business on <span className="text-[#b8800b]">solid ground.</span></h1>
            <p className="mt-7 max-w-[550px] text-lg leading-8 text-[#5a6963]">Mizan gives Saudi SMEs a clear, Arabic-native foundation for getting their organization, people, and financial settings right from day one.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="btn-primary px-5 py-3" data-testid="link-hero-start">Set up your business <ArrowRight size={17} /></Link>
              <span className="text-sm text-[#78847e]">No spreadsheet archaeology required.</span>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-[#61716b]">
              <span className="flex items-center gap-2"><Check size={16} className="text-[#176752]" /> Arabic & English</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-[#176752]" /> Saudi-ready fields</span>
            </div>
          </div>
          <div className="fade-up-2 relative mx-auto w-full max-w-[530px]">
            <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-[#edca4e] opacity-80 blur-[1px]" />
            <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-[#d8e7dd]" />
            <div className="relative rounded-[28px] border border-[#d9d4c2] bg-[#f9f5e9] p-3 shadow-[0_30px_80px_rgba(23,59,56,.14)]">
              <div className="overflow-hidden rounded-[20px] bg-[#173b38]">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><span className="text-sm font-bold text-[#f9f5e9]">Overview</span><span className="rounded-full bg-[#f3c746] px-3 py-1 text-[10px] font-bold text-[#173b38]">LIVE PREVIEW</span></div>
                <div className="p-6">
                  <div className="mb-6 flex items-end justify-between"><div><div className="text-xs text-[#b2c5bd]">Net position</div><div className="mt-1 text-4xl font-bold tracking-tight text-[#f9f5e9]">SAR 84,620</div></div><div className="text-right text-xs text-[#f3c746]">Getting ready</div></div>
                  <div className="flex h-[150px] items-end gap-2 border-b border-l border-white/10 px-3 pb-0">{[38,54,45,72,64,84,62,96,76,88,68,100].map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-[#f3c746]" style={{ height: `${h}%`, opacity: .35 + i / 22 }} />)}</div>
                  <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/10 p-4"><div className="text-xs text-[#b2c5bd]">Receivables</div><div className="mt-2 font-semibold text-[#f9f5e9]">SAR 31,400</div></div><div className="rounded-xl bg-white/10 p-4"><div className="text-xs text-[#b2c5bd]">Expenses</div><div className="mt-2 font-semibold text-[#f9f5e9]">SAR 12,880</div></div></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-6 rounded-2xl border border-[#d9d4c2] bg-[#fffdf7] px-4 py-3 shadow-xl"><div className="flex items-center gap-2 text-xs font-semibold text-[#173b38]"><span className="h-2 w-2 rounded-full bg-[#3f9d77]" /> Company profile complete</div></div>
          </div>
        </section>
        <section id="principles" className="border-y border-[#ded9ca] bg-[#eeece1]">
          <div className="mx-auto grid max-w-[1240px] gap-0 px-6 lg:grid-cols-3 lg:px-10">
            {[
              ['01', 'Get the details right', 'Saudi business fields, bilingual names, VAT status, and fiscal settings belong in one considered place.'],
              ['02', 'See what matters now', 'An empty dashboard is not a dead end. It tells you what is ready, what is next, and why it matters.'],
              ['03', 'Grow without the clutter', 'When you are ready for sales, purchasing, and reports, they are waiting — never shouting for attention.'],
            ].map(([n, title, text]) => <div key={n} className="border-b border-[#d9d4c2] py-10 last:border-0 lg:border-b-0 lg:border-r lg:px-9 lg:first:pl-0 lg:last:border-r-0"><div className="font-mono text-xs text-[#aa7a0d]">{n}</div><h2 className="mt-5 text-xl font-bold text-[#173b38]">{title}</h2><p className="mt-3 text-sm leading-7 text-[#65736d]">{text}</p></div>)}
          </div>
        </section>
        <section id="setup" className="mx-auto max-w-[1240px] px-6 py-24 lg:px-10 lg:py-32"><div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><div className="eyebrow">A better first week</div><h2 className="mt-4 max-w-[430px] text-4xl font-bold leading-tight tracking-[-.05em] text-[#173b38]">Your foundation, in the right order.</h2><p className="mt-5 max-w-[390px] leading-7 text-[#68766f]">Mizan keeps setup focused. Complete the essentials today; keep the complexity for when the business earns it.</p></div><div className="grid gap-4 sm:grid-cols-2">{[['Organization profile', 'Names, registration, and address details', Building2], ['Team access', 'Roles that make sense for your people', Users], ['Regional settings', 'Currency, language, and fiscal year', Globe2], ['Security baseline', 'A secure place for the work ahead', LockKeyhole]].map(([title, text, Icon]) => <div key={title as string} className="soft-card group p-6 transition hover:-translate-y-1 hover:border-[#b7c9bc]"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e1eee5] text-[#176752]"><Icon size={20} /></div><ArrowRight size={18} className="text-[#afbaaf] transition group-hover:translate-x-1 group-hover:text-[#176752]" /></div><h3 className="mt-6 font-bold text-[#173b38]">{title as string}</h3><p className="mt-2 text-sm leading-6 text-[#758078]">{text as string}</p></div>)}</div></div></section>
        <section id="trust" className="bg-[#173b38] px-6 py-20 text-[#f9f5e9] lg:px-10"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="eyebrow !text-[#f3c746]">Built with context</div><h2 className="mt-4 max-w-[650px] text-4xl font-bold leading-tight tracking-[-.05em]">The confidence of knowing your first settings are not an afterthought.</h2></div><Link href="/sign-up" className="inline-flex items-center gap-2 text-sm font-bold text-[#f3c746]" data-testid="link-footer-start">Begin setup <ArrowRight size={17} /></Link></div></section>
      </main>
      <footer className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-7 text-xs text-[#79837b] lg:px-10"><Logo /><span>© 2025 Mizan. Built for the Kingdom.</span></footer>
    </div>
  );
}

function AppSidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = (href: string) => location === href;
  const renderLink = (item: typeof navPrimary[number] | typeof navSettings[number]) => {
    const Icon = item.icon;
    return <Link href={item.href} onClick={() => setMobileOpen(false)} className={`sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active(item.href) ? 'active' : 'text-[#d6e1d7]'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} /><span className="sidebar-copy flex-1">{item.label}</span>{'soon' in item && item.soon ? <span className="sidebar-copy rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#c2d2c6]">Soon</span> : null}</Link>;
  };
  return <>
    <button className="fixed right-4 top-4 z-40 hidden rounded-lg bg-[#173b38] p-2 text-white mobile-nav" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu"><Menu size={20} /></button>
    <aside className={`sidebar fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col px-5 py-6 lg:static ${mobileOpen ? 'block' : 'hidden lg:flex'}`}>
      <div className="mb-10 flex items-center gap-3 px-2"><img src={`${basePath}/logo.svg`} className="h-9 w-9 rounded-xl" alt="Mizan" /><div className="sidebar-copy"><div className="text-lg font-bold tracking-[-.05em]">mizan<span className="text-[#f3c746]">.</span></div><div className="org-name text-[10px] uppercase tracking-[.16em] text-[#afc6b8]">Control room</div></div></div>
      <div className="sidebar-copy mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#91b3a4]">Workspace</div><nav className="space-y-1">{navPrimary.map(renderLink)}</nav>
      <div className="sidebar-copy mb-2 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#91b3a4]">Settings</div><nav className="space-y-1">{navSettings.map(renderLink)}</nav>
      <div className="mt-auto border-t border-white/10 pt-4"><div className="mb-3 flex items-center gap-3 px-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbe9df] text-sm font-bold text-[#176752]">{(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'M').toUpperCase()}</div><div className="sidebar-copy min-w-0"><div className="truncate text-sm font-semibold">{user?.firstName || 'Workspace owner'}</div><div className="truncate text-xs text-[#9db7a8]">{user?.emailAddresses?.[0]?.emailAddress || 'Owner account'}</div></div></div><button className="sidebar-link flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#d6e1d7]" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out"><LogOut size={17} /><span className="sidebar-copy">Sign out</span></button></div>
    </aside>
  </>;
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="mb-9 flex items-start justify-between gap-4"><div><div className="eyebrow mb-2">Mizan workspace</div><h1 className="text-3xl font-bold tracking-[-.055em] text-[#173b38]">{title}</h1>{subtitle && <p className="mt-2 text-sm text-[#748079]">{subtitle}</p>}</div><div className="flex items-center gap-2"><button className="rounded-xl border border-[#ddd8c8] bg-[#fbf9f2] p-2.5 text-[#63716b] transition hover:border-[#a6b9aa] hover:text-[#176752]" data-testid="button-notifications"><Bell size={18} /></button><div className="hidden rounded-xl border border-[#ddd8c8] bg-[#fbf9f2] px-3 py-2 text-xs font-semibold text-[#61716b] sm:block">Thursday, 12 June 2025</div></div></header>;
}

function EmptyDashboard({ organization }: { organization?: Organization }) {
  return <div className="fade-up"><TopBar title="Good morning." subtitle={organization ? `Here is the current pulse of ${organization.tradingNameEnglish || organization.legalNameEnglish}.` : 'Your financial control room will live here.'} /><div className="soft-card relative overflow-hidden bg-[#173b38] p-7 text-[#f9f5e9] md:p-10"><div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[36px] border-[#f3c746]/20" /><div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full border-[24px] border-[#f3c746]/10" /><div className="relative max-w-[650px]"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3c746] text-[#173b38]"><Sparkles size={22} /></div><div className="text-sm font-semibold text-[#f3c746]">Your books are ready for their first chapter</div><h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-.05em] md:text-4xl">Nothing to report yet — and that is exactly right.</h2><p className="mt-4 max-w-[540px] leading-7 text-[#c3d1c8]">Once your organization is set up, this space will show revenue, receivables, expenses, and net profit without making you hunt for the signal.</p><Link href={organization ? '/settings/organization' : '/onboarding'} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#f3c746] px-4 py-3 text-sm font-bold text-[#173b38] transition hover:bg-[#f8d969]" data-testid="link-dashboard-next">{organization ? 'Review organization profile' : 'Set up organization'} <ArrowRight size={16} /></Link></div></div><div className="mt-5 grid gap-4 md:grid-cols-3">{[['Revenue', 'Awaiting your first sale', WalletCards], ['Receivables', 'Nothing outstanding', CreditCard], ['Expenses', 'No expenses recorded', FileText]].map(([label, text, Icon]) => <div key={label as string} className="soft-card p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-[#728078]">{label as string}</span><Icon size={18} className="text-[#9aac9e]" /></div><div className="mt-7 h-2 w-2/3 rounded-full bg-[#e7e5da]" /><div className="mt-3 text-xs text-[#8a948e]">{text as string}</div></div>)}</div><div className="mt-10 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#173b38]">Recent activity</h2><p className="mt-1 text-sm text-[#7b877f]">Transactions will appear here as your business moves.</p></div><Link href="/settings/audit-log" className="text-sm font-semibold text-[#176752]" data-testid="link-dashboard-audit">View audit log <ArrowRight size={14} className="ml-1 inline" /></Link></div><div className="soft-card mt-4 flex min-h-[150px] flex-col items-center justify-center border-dashed p-6 text-center"><Clock3 size={23} className="text-[#a7b4aa]" /><p className="mt-3 text-sm font-semibold text-[#53645f]">Your activity timeline is clear</p><p className="mt-1 text-xs text-[#8b968f]">Actions taken by your organization will be recorded here.</p></div></div>;
}

function Dashboard() {
  const { data: session, isLoading: sessionLoading } = useGetCurrentSession();
  const orgId = session?.organizations?.[0]?.organization.id || '';
  const { data: summary, isLoading } = useGetDashboardSummary(orgId, { query: { enabled: !!orgId, queryKey: getGetDashboardSummaryQueryKey(orgId) } });
  const organization = session?.organizations?.[0]?.organization;
  if (sessionLoading || (orgId && isLoading)) return <PageSkeleton />;
  if (!summary || !summary.recentTransactions?.length) return <EmptyDashboard organization={organization} />;
  return <div><TopBar title="Good morning." subtitle={`Here is the current pulse of ${organization?.tradingNameEnglish || organization?.legalNameEnglish || 'your business'}.`} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['Revenue', summary.revenue, WalletCards], ['Receivables', summary.receivables, CreditCard], ['Expenses', summary.expenses, FileText], ['Net profit', summary.netProfit, BarChart3]].map(([label, value, Icon]) => <div key={label as string} className="soft-card p-5"><div className="flex items-center justify-between text-sm text-[#718078]">{label as string}<Icon size={18} className="text-[#176752]" /></div><div className="mt-5 text-2xl font-bold text-[#173b38]">{summary.currency} {value as string}</div><div className="mt-4 text-xs text-[#8b968f]">{summary.hasComparativeData ? 'Compared with last period' : 'No comparative data yet'}</div></div>)}</div><div className="soft-card mt-5 p-6"><h2 className="font-bold text-[#173b38]">Recent transactions</h2><div className="mt-5 divide-y divide-[#ece9de]">{summary.recentTransactions.map(tx => <div key={tx.id} className="flex items-center justify-between py-4 text-sm"><span>{tx.label}</span><span className="font-semibold">{summary.currency} {tx.amount}</span></div>)}</div></div></div>;
}

function PageSkeleton() {
  return <div><div className="mb-9"><div className="shimmer h-3 w-28 rounded" /><div className="shimmer mt-3 h-9 w-64 rounded" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map(i => <div key={i} className="soft-card h-36 p-5"><div className="shimmer h-3 w-24 rounded" /><div className="shimmer mt-6 h-7 w-32 rounded" /></div>)}</div></div>;
}

const organizationFields: Array<[keyof OrganizationInput, string, string, boolean?]> = [
  ['legalNameEnglish', 'Legal name (English)', 'As registered with the authorities', true],
  ['legalNameArabic', 'Legal name (Arabic)', 'الاسم القانوني بالعربية'],
  ['tradingNameEnglish', 'Trading name (English)', 'The name customers know'],
  ['tradingNameArabic', 'Trading name (Arabic)', 'الاسم التجاري بالعربية'],
  ['vatNumber', 'VAT number', '15 digits, if registered'],
  ['commercialRegistrationNumber', 'Commercial registration', 'CR number'],
  ['city', 'City', 'e.g. Riyadh'],
  ['district', 'District', 'District or حي'],
  ['address', 'Street address', 'Building and street'],
  ['buildingNumber', 'Building number', 'Building number'],
  ['additionalNumber', 'Additional number', 'Additional number'],
  ['postalCode', 'Postal code', 'Postal code'],
  ['phone', 'Phone', '+966'],
  ['email', 'Business email', 'name@company.com'],
  ['website', 'Website', 'https://'],
];

function OrganizationSettings() {
  const { data: session } = useGetCurrentSession();
  const orgId = session?.organizations?.[0]?.organization.id || '';
  const { data: fetched, isLoading, isError, refetch } = useGetOrganization(orgId, { query: { enabled: !!orgId, queryKey: getGetOrganizationQueryKey(orgId) } });
  const org = fetched || session?.organizations?.[0]?.organization;
  const [form, setForm] = useState<Partial<OrganizationInput>>({});
  const update = useUpdateOrganization();
  useEffect(() => { if (org) setForm({ ...org }); }, [org?.id]);
  if (!orgId) return <SetupNudge title="Create your organization first" text="Once your business profile exists, its Saudi fields and settings will be managed here." />;
  if (isLoading) return <PageSkeleton />;
  if (isError || !org) return <ErrorState retry={() => refetch()} />;
  const set = (key: keyof OrganizationInput, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const save = () => update.mutate({ organizationId: orgId, data: { ...form, legalNameEnglish: form.legalNameEnglish || org.legalNameEnglish } }, { onSuccess: value => { queryClient.setQueryData(getGetOrganizationQueryKey(orgId), value); queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() }); } });
  return <div><TopBar title="Organization profile" subtitle="Keep the legal and commercial identity of your business accurate." /><div className="soft-card p-6 md:p-8"><div className="mb-8 flex items-start justify-between gap-4 border-b border-[#ece9de] pb-6"><div><div className="flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e1eee5] text-[#176752]"><Building2 size={19} /></div><div><h2 className="font-bold text-[#173b38]">Business identity</h2><p className="mt-1 text-xs text-[#7b877f]">Visible in your records and future documents.</p></div></div></div><span className="hidden rounded-full bg-[#e6f2e8] px-3 py-1.5 text-xs font-semibold text-[#176752] sm:block">Saudi Arabia · {org.currency}</span></div><div className="grid gap-x-5 gap-y-5 md:grid-cols-2">{organizationFields.map(([key, label, placeholder, required]) => <label key={key} className="block"><span className="mb-2 block text-xs font-bold text-[#53645f]">{label}{required && <span className="ml-1 text-[#b7800d]">*</span>}</span><input value={(form[key] as string) || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder} className="field" data-testid={`input-org-${String(key)}`} /></label>)}</div><div className="mt-8 flex justify-end border-t border-[#ece9de] pt-6"><Button onClick={save} disabled={update.isPending} data-testid="button-save-organization">{update.isPending ? 'Saving…' : <><Save size={16} /> Save changes</>}</Button></div></div></div>;
}

function Onboarding() {
  const { data: session } = useGetCurrentSession();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<OrganizationInput>>({ legalNameEnglish: '', legalNameArabic: '', tradingNameEnglish: '', tradingNameArabic: '', country: 'Saudi Arabia', city: '', vatRegistered: false, currency: 'SAR', defaultLanguage: 'en', timezone: 'Asia/Riyadh', fiscalYearStart: '01-01' });
  const create = useCreateOrganization();
  const [, setLocation] = useLocation();
  const update = (key: keyof OrganizationInput, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = () => create.mutate({ data: { legalNameEnglish: form.legalNameEnglish || '', ...form } as OrganizationInput }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() }); setLocation('/dashboard'); } });
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;
  return <div className="mx-auto max-w-[960px]"><div className="mb-12 flex items-center justify-between"><Logo /><div className="text-right"><div className="text-xs font-bold text-[#53645f]">Organization setup</div><div className="mt-1 text-xs text-[#8a958e]">Step {step} of 3</div></div></div><div className="mb-9 h-1 rounded-full bg-[#ddd9cb]"><div className="h-1 rounded-full bg-[#d3a215] transition-all" style={{ width: `${progress}%` }} /></div><div className="mb-8"><div className="eyebrow">A considered beginning</div><h1 className="mt-3 text-4xl font-bold tracking-[-.06em] text-[#173b38]">{step === 1 ? 'Tell us about the business.' : step === 2 ? 'Add your local details.' : 'Set your working preferences.'}</h1><p className="mt-3 text-[#718078]">{step === 1 ? 'Start with the names that make your organization official.' : step === 2 ? 'These details keep your future invoices and records grounded.' : 'You can change these settings any time.'}</p></div><div className="soft-card p-6 md:p-9">{step === 1 && <div className="grid gap-5 md:grid-cols-2">{[['legalNameEnglish', 'Legal name (English)', 'Your registered company name'], ['legalNameArabic', 'Legal name (Arabic)', 'الاسم القانوني'], ['tradingNameEnglish', 'Trading name (English)', 'Optional customer-facing name'], ['tradingNameArabic', 'Trading name (Arabic)', 'الاسم التجاري']].map(([key, label, ph]) => <label key={key} className="block"><span className="mb-2 block text-xs font-bold text-[#53645f]">{label}</span><input className="field" value={(form[key as keyof OrganizationInput] as string) || ''} onChange={e => update(key as keyof OrganizationInput, e.target.value)} placeholder={ph} data-testid={`input-onboarding-${key}`} /></label>)}</div>}{step === 2 && <div className="grid gap-5 md:grid-cols-2">{[['city', 'City', 'Riyadh'], ['district', 'District', 'Al Olaya'], ['address', 'Street address', 'King Fahd Road'], ['postalCode', 'Postal code', '12345'], ['buildingNumber', 'Building number', '1234'], ['commercialRegistrationNumber', 'Commercial registration', '1010…']].map(([key, label, ph]) => <label key={key} className="block"><span className="mb-2 block text-xs font-bold text-[#53645f]">{label}</span><input className="field" value={(form[key as keyof OrganizationInput] as string) || ''} onChange={e => update(key as keyof OrganizationInput, e.target.value)} placeholder={ph} data-testid={`input-onboarding-${key}`} /></label>)}<label className="block md:col-span-2"><span className="mb-2 block text-xs font-bold text-[#53645f]">VAT registered?</span><button type="button" className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${form.vatRegistered ? 'border-[#94bca0] bg-[#edf6ef]' : 'border-[#ddd8c8]'}`} onClick={() => update('vatRegistered', !form.vatRegistered)} data-testid="button-toggle-vat"><span>{form.vatRegistered ? 'Yes, this business is VAT registered' : 'Not yet / not applicable'}</span><span className={`h-5 w-9 rounded-full p-0.5 ${form.vatRegistered ? 'bg-[#176752]' : 'bg-[#cbd1c9]'}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${form.vatRegistered ? 'translate-x-4' : ''}`} /></span></button></label></div>}{step === 3 && <div className="grid gap-6 md:grid-cols-2"><label><span className="mb-2 block text-xs font-bold text-[#53645f]">Default language</span><select className="field" value={form.defaultLanguage} onChange={e => update('defaultLanguage', e.target.value)} data-testid="select-default-language"><option value="en">English</option><option value="ar">العربية</option></select></label><label><span className="mb-2 block text-xs font-bold text-[#53645f]">Currency</span><select className="field" value={form.currency} onChange={e => update('currency', e.target.value)} data-testid="select-currency"><option value="SAR">SAR — Saudi Riyal</option><option value="AED">AED — UAE Dirham</option></select></label><label><span className="mb-2 block text-xs font-bold text-[#53645f]">Fiscal year starts</span><select className="field" value={form.fiscalYearStart} onChange={e => update('fiscalYearStart', e.target.value)} data-testid="select-fiscal-year"><option value="01-01">1 January</option><option value="07-01">1 July</option></select></label><label><span className="mb-2 block text-xs font-bold text-[#53645f]">Timezone</span><select className="field" value={form.timezone} onChange={e => update('timezone', e.target.value)} data-testid="select-timezone"><option value="Asia/Riyadh">Riyadh (GMT+3)</option></select></label></div>}<div className="mt-9 flex justify-between border-t border-[#ece9de] pt-6">{step > 1 ? <Button variant="secondary" onClick={() => setStep(step - 1)} data-testid="button-onboarding-back">Back</Button> : <span />}{step < 3 ? <Button onClick={() => setStep(step + 1)} data-testid="button-onboarding-next">Continue <ArrowRight size={16} /></Button> : <Button onClick={submit} disabled={create.isPending || !form.legalNameEnglish} data-testid="button-create-organization">{create.isPending ? 'Creating…' : <>Create workspace <Check size={16} /></>}</Button>}</div></div><p className="mt-6 text-center text-xs text-[#8a958e]">You can revisit every setting later from your control room.</p></div>;
}

function SetupNudge({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-[420px] items-center justify-center"><div className="soft-card max-w-[520px] p-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e1eee5] text-[#176752]"><Building2 size={25} /></div><h1 className="mt-6 text-2xl font-bold tracking-tight text-[#173b38]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#718078]">{text}</p><Link href="/onboarding" className="btn-primary mt-7" data-testid="link-start-setup">Start organization setup <ArrowRight size={16} /></Link></div></div>;
}
function ErrorState({ retry }: { retry: () => void }) {
  return <div className="soft-card flex min-h-[320px] flex-col items-center justify-center p-8 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e4de] text-[#b24c3f]"><RefreshCw size={21} /></div><h2 className="mt-5 font-bold text-[#173b38]">We could not load this page</h2><p className="mt-2 max-w-sm text-sm text-[#77837d]">The connection may have blinked. Try again and we will pick up where you left off.</p><Button variant="secondary" className="mt-6" onClick={retry} data-testid="button-retry"><RefreshCw size={15} /> Try again</Button></div>;
}

function FoundationPage({ type }: { type: 'users' | 'branches' | 'language' | 'security' | 'appearance' | 'zatca' }) {
  const configs = {
    users: { title: 'Users & roles', subtitle: 'Give the right people the right level of access.', icon: Users, heading: 'Your team, with clear boundaries.', text: 'Invite colleagues when your organization is ready. Role-based access is designed to stay understandable as your team grows.', cta: 'Invite a teammate' },
    branches: { title: 'Branches', subtitle: 'Keep locations organized as you expand.', icon: Store, heading: 'One organization. Every location.', text: 'Branch support is ready for the next phase. You will be able to keep addresses, activity, and reporting organized by location.', cta: 'Add a branch' },
    language: { title: 'Language & region', subtitle: 'Make Mizan feel native to the way you work.', icon: Languages, heading: 'Your language, your working rhythm.', text: 'Choose the language, currency, and regional conventions your team sees across the workspace.', cta: 'Save preferences' },
    security: { title: 'Security', subtitle: 'A quiet place to manage the basics.', icon: ShieldCheck, heading: 'The foundation is protected.', text: 'Authentication is managed securely by Clerk. Organization-level security controls will appear here as your workspace evolves.', cta: 'Review sign-in security' },
    appearance: { title: 'Appearance', subtitle: 'Tune the control room to your preference.', icon: SlidersHorizontal, heading: 'Clarity is the default.', text: 'Mizan uses a warm light theme designed for long working sessions. More display preferences will arrive with the next product phase.', cta: 'Preferences saved' },
    zatca: { title: 'ZATCA', subtitle: 'Saudi e-invoicing, when the time is right.', icon: Landmark, heading: 'ZATCA compliance is coming next.', text: 'We are preparing the next phase of Mizan around Saudi e-invoicing requirements. No connection is needed today, and there is no unfinished setup hiding here.', cta: 'Notify me when ready' },
  } as const;
  const item = configs[type]; const Icon = item.icon;
  const [done, setDone] = useState(false);
  return <div><TopBar title={item.title} subtitle={item.subtitle} /><div className="soft-card overflow-hidden"><div className="grid md:grid-cols-[.8fr_1.2fr]"><div className="bg-[#173b38] p-8 text-[#f9f5e9] md:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3c746] text-[#173b38]"><Icon size={22} /></div><div className="mt-12 text-xs font-bold uppercase tracking-[.14em] text-[#f3c746]">Foundation setting</div><h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-.05em]">{item.heading}</h2><p className="mt-4 leading-7 text-[#c3d1c8]">{item.text}</p></div><div className="flex flex-col justify-center p-8 md:p-12"><div className="mb-6 flex items-center gap-2 text-xs font-bold text-[#176752]"><span className="h-2 w-2 rounded-full bg-[#4ca879]" /> {done ? 'Preference saved' : type === 'zatca' ? 'Upcoming phase' : 'Ready when you are'}</div>{type === 'language' && <div className="mb-7 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-xs font-bold text-[#53645f]">Workspace language</span><select className="field" defaultValue="en" data-testid="select-language-setting"><option value="en">English</option><option value="ar">العربية</option></select></label><label><span className="mb-2 block text-xs font-bold text-[#53645f]">Number format</span><select className="field" defaultValue="sar" data-testid="select-number-format"><option value="sar">SAR 1,234.56</option><option value="arabic">١٬٢٣٤٫٥٦ ر.س</option></select></label></div>}{type === 'appearance' && <div className="mb-7 flex gap-3"><div className="flex-1 rounded-xl border-2 border-[#176752] bg-[#f9f5e9] p-4"><div className="mb-3 h-2 w-12 rounded bg-[#176752]" /><div className="h-2 w-20 rounded bg-[#ddd8c8]" /></div><div className="flex-1 rounded-xl border border-[#ddd8c8] bg-[#173b38] p-4"><div className="mb-3 h-2 w-12 rounded bg-[#f3c746]" /><div className="h-2 w-20 rounded bg-white/20" /></div></div>}<Button onClick={() => setDone(true)} variant={done ? 'secondary' : 'primary'} data-testid={`button-${type}-action`}>{done ? <><Check size={16} /> Saved</> : <>{item.cta} <ArrowRight size={16} /></>}</Button><p className="mt-5 text-xs leading-5 text-[#89938d]">{type === 'zatca' ? 'We will share a clear setup path when this phase becomes available.' : 'No changes are made until you choose to save.'}</p></div></div></div></div>;
}

function AuditLog() {
  const { data: session } = useGetCurrentSession();
  const orgId = session?.organizations?.[0]?.organization.id || '';
  const { data, isLoading, isError, refetch } = useListAuditLogs(orgId, { query: { enabled: !!orgId, queryKey: getListAuditLogsQueryKey(orgId) } });
  if (!orgId) return <SetupNudge title="Your audit trail starts with setup" text="Create your organization to see a clear history of important workspace actions." />;
  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState retry={() => refetch()} />;
  return <div><TopBar title="Audit log" subtitle="A transparent record of changes across your organization." /><div className="soft-card overflow-hidden"><div className="flex items-center justify-between border-b border-[#ece9de] p-5"><div className="flex items-center gap-2 text-sm font-bold text-[#173b38]"><FileClock size={17} className="text-[#176752]" /> Recent activity</div><span className="text-xs text-[#8a958e]">{data?.length || 0} entries</span></div>{data?.length ? <div className="divide-y divide-[#ece9de]">{data.map(log => <div key={log.id} className="flex items-center justify-between gap-4 p-5"><div><div className="text-sm font-semibold text-[#53645f]">{log.action}</div><div className="mt-1 text-xs text-[#8a958e]">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ''}</div></div><time className="whitespace-nowrap text-xs text-[#8a958e]">{new Date(log.createdAt).toLocaleString()}</time></div>)}</div> : <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center"><FileClock size={27} className="text-[#a7b4aa]" /><p className="mt-4 font-semibold text-[#53645f]">No activity yet</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#8a958e]">Important organization actions will appear here in plain language.</p></div>}</div></div>;
}

function ComingSoon({ title, arabic, icon: Icon }: { title: string; arabic: string; icon: LucideIcon }) {
  return <div><TopBar title={title} subtitle={`The ${title.toLowerCase()} workspace is being prepared for your next phase.`} /><div className="soft-card flex min-h-[460px] flex-col items-center justify-center overflow-hidden bg-[#173b38] p-10 text-center text-[#f9f5e9]"><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#f3c746] text-[#173b38]"><Icon size={28} /></div><div className="text-xs font-bold uppercase tracking-[.16em] text-[#f3c746]">Coming soon</div><h2 className="mt-4 text-4xl font-bold tracking-[-.06em]">{title} is on the way.</h2><p className="arabic mt-3 text-lg text-[#bed0c5]">{arabic}</p><p className="mt-5 max-w-[480px] leading-7 text-[#c3d1c8]">We are keeping this part of Mizan focused until it is ready to do real work. Your foundation remains the priority.</p><Link href="/dashboard" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#f3c746] px-4 py-3 text-sm font-bold text-[#173b38]" data-testid={`link-${title.toLowerCase()}-back`}>Back to overview <ArrowRight size={16} /></Link></div></div>;
}

function AuthenticatedShell({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-[#f4f1e8]" />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <div className="shell-grid app-noise"><AppSidebar /><main className="min-w-0"><div className="content-wrap">{children}</div></main></div>;
}

function Protected({ children }: { children: ReactNode }) { return <AuthenticatedShell>{children}</AuthenticatedShell>; }
function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }

function SignInPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1e8] px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>; }
function SignUpPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1e8] px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>; }

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={PublicHome} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route path="/onboarding"><Protected><Onboarding /></Protected></Route>
    <Route path="/dashboard"><Protected><Dashboard /></Protected></Route>
    <Route path="/settings/organization"><Protected><OrganizationSettings /></Protected></Route>
    <Route path="/settings/users"><Protected><FoundationPage type="users" /></Protected></Route>
    <Route path="/settings/branches"><Protected><FoundationPage type="branches" /></Protected></Route>
    <Route path="/settings/language"><Protected><FoundationPage type="language" /></Protected></Route>
    <Route path="/settings/security"><Protected><FoundationPage type="security" /></Protected></Route>
    <Route path="/settings/appearance"><Protected><FoundationPage type="appearance" /></Protected></Route>
    <Route path="/settings/zatca"><Protected><FoundationPage type="zatca" /></Protected></Route>
    <Route path="/settings/audit-log"><Protected><AuditLog /></Protected></Route>
    {navPrimary.filter(item => item.soon).map(item => <Route key={item.href} path={item.href}><Protected><ComingSoon title={item.label} arabic={item.arabic} icon={item.icon} /></Protected></Route>)}
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#176752', colorForeground: '#173b38', colorMutedForeground: '#728078', colorDanger: '#b24c3f', colorBackground: '#fffdf7', colorInput: '#fffdf7', colorInputForeground: '#173b38', colorNeutral: '#ddd8c8', fontFamily: 'DM Sans, IBM Plex Sans Arabic, sans-serif', borderRadius: '0.8rem' },
  elements: { rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fffdf7] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl', card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none', headerTitle: 'text-[#173b38] font-bold', headerSubtitle: 'text-[#728078]', socialButtonsBlockButtonText: 'text-[#173b38]', formFieldLabel: 'text-[#53645f]', footerActionLink: 'text-[#176752] font-semibold', footerActionText: 'text-[#728078]', dividerText: 'text-[#728078]', formButtonPrimary: 'bg-[#176752] hover:bg-[#124e3e]', formFieldInput: 'border-[#ddd8c8] text-[#173b38] bg-[#fffdf7]', footerAction: 'text-[#728078]', dividerLine: 'bg-[#e8e4d8]', alert: 'bg-[#f8e4de]', alertText: 'text-[#8f3f35]', main: 'text-[#173b38]' },
};

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back to Mizan', subtitle: 'Your calm control room is waiting.' } }, signUp: { start: { title: 'Start on solid ground', subtitle: 'Set up your Saudi business foundation.' } } }} routerPush={to => setLocation(stripBase(to))} routerReplace={to => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator /><Router /></QueryClientProvider></ClerkProvider>;
}

function App() {
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
  return <WouterRouter base={basePath}><ClerkRoutes /></WouterRouter>;
}

export default App;