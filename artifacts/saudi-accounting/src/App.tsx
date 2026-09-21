import { useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'wouter';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { getListOrganizationModulesQueryKey, setAuthTokenGetter, useGetCurrentSession, useListOrganizationModules } from '@workspace/api-client-react';
import type { ModuleKey } from '@workspace/platform-core';

function ClerkTokenInitializer({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}

import { AppShell } from './components/layout/app-shell';
import { Onboarding } from './pages/onboarding';
import { FinanceOverview } from './pages/finance';
import { NexusHome } from './pages/nexus-home';
import { ModulesSettings } from './pages/settings/modules';
import { OrganizationProfile } from './pages/settings/organization-profile';
import { UsersSettings } from './pages/settings/users';
import { AppearanceSettings } from './pages/settings/appearance';
import { SecuritySettings } from './pages/settings/security';
import { AuditLogSettings } from './pages/settings/audit-log';
import { BranchesSettings, ZatcaSettings } from './pages/settings/placeholders';
import { LanguageSettings } from './pages/settings/language';
import { PublicHome } from './pages/public-home';
import NotFound from '@/pages/not-found';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

import { Customers } from './pages/customers';
import { CustomerDetail } from './pages/customer-detail';
import { Suppliers } from './pages/suppliers';
import { SupplierDetail } from './pages/supplier-detail';
import { CatalogItems } from './pages/catalog-items';
import { CatalogItemDetail } from './pages/catalog-item-detail';
import { QuotationsPage } from './pages/quotations';
import { QuotationDetailPage } from './pages/quotation-detail';
import { InvoicesPage } from './pages/invoices';
import { InvoiceDetailPage } from './pages/invoice-detail';
import { BillsPage } from './pages/bills';
import { BillDetailPage } from './pages/bill-detail';
import { ExpensesPage } from './pages/expenses';
import { ChartOfAccountsPage } from './pages/chart-of-accounts';
import { JournalEntriesPage } from './pages/journal-entries';
import { JournalEntryDetailPage } from './pages/journal-entry-detail';
import { TrialBalancePage } from './pages/trial-balance-page';
import { ReportsPage } from './pages/reports-page';
import { ProfitLossPage } from './pages/profit-loss-page';
import { BalanceSheetPage } from './pages/balance-sheet-page';
import { VatReturnPage } from './pages/vat-return-page';
import { AccountLedgerPage } from './pages/account-ledger-page';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const rawPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkPubKey = clerkProxyUrl ? publishableKeyFromHost(window.location.hostname, rawPubKey) : rawPubKey;

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isSignedIn) return <Redirect to="/" />;
  
  return <SessionGuard>{children}</SessionGuard>;
}

function SessionGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: session, isLoading } = useGetCurrentSession({
    query: { staleTime: 10 * 60 * 1000 }
  });
  
  if (isLoading && !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-muted-foreground">Loading KHANBAS NEXUS...</span>
        </div>
      </div>
    );
  }

  const currentOrg = session?.organizations.find(
    (item) => item.organization.id === session?.preferences?.currentOrganizationId
  )?.organization ?? session?.organizations[0]?.organization;

  if (
    location !== '/onboarding' &&
    (!session?.organizations.length || !currentOrg?.onboardingCompleted)
  ) {
    return <Redirect to="/onboarding" />;
  }

  if (location === '/onboarding') {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}

function ModuleGuard({
  moduleKey,
  children,
}: {
  moduleKey: ModuleKey;
  children: React.ReactNode;
}) {
  const { data: session, isLoading: sessionLoading } = useGetCurrentSession({
    query: { staleTime: 10 * 60 * 1000 }
  });
  const organizationId =
    session?.preferences.currentOrganizationId ??
    session?.organizations[0]?.organization.id ??
    '';
  const { data: modules, isLoading: modulesLoading } =
    useListOrganizationModules(organizationId, {
      query: {
        enabled: Boolean(organizationId),
        queryKey: getListOrganizationModulesQueryKey(organizationId),
        staleTime: 10 * 60 * 1000,
      },
    });

  if ((sessionLoading && !session) || (modulesLoading && !modules)) {
    return <div className="min-h-[40vh] rounded-2xl bg-muted/30 animate-pulse" />;
  }

  const enabled = modules?.some(
    (entitlement) =>
      entitlement.module.key === moduleKey && entitlement.enabled,
  );
  return enabled ? <>{children}</> : <Redirect to="/home" />;
}

import { ShieldCheck, Landmark, Zap } from 'lucide-react';
import { useTranslation } from './lib/utils';

function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground">
      {/* Left Column: Premium Branding & Saudi Enterprise Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between sidebar-bg p-12 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} className="h-10 w-10 rounded-xl shadow-md" alt="NEXUS" />
          <div>
            <div className="text-xl font-bold tracking-tight text-white">KHANBAS NEXUS</div>
            <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Saudi SaaS ERP & SOCPA Accounting</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-white/15 backdrop-blur-sm">
            <Zap size={14} className="text-amber-400" />
            <span>ZATCA Phase 2 Compliant</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-sm text-emerald-100/80 leading-relaxed">
            {subtitle}
          </p>

          <div className="grid grid-cols-1 gap-3 pt-4 border-t border-white/15">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">ZATCA Cryptographic E-Invoicing</div>
                <div className="text-[11px] text-emerald-200/70">ECDSA secp256k1 stamps & real-time B2B/B2C QR codes</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                <Landmark size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">SOCPA Double-Entry General Ledger</div>
                <div className="text-[11px] text-emerald-200/70">Automated trial balance, Profit & Loss, and VAT Return Form 21</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/60 flex items-center justify-between border-t border-white/10 pt-4">
          <span>© 2026 KHANBAS NEXUS. All rights reserved.</span>
          <span>Kingdom of Saudi Arabia</span>
        </div>
      </div>

      {/* Right Column: Clean Clerk Auth Form Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative bg-card/30">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <img src={`${basePath}/logo.svg`} className="h-9 w-9 rounded-lg" alt="NEXUS" />
            <span className="text-lg font-bold text-foreground">NEXUS ERP</span>
          </div>

          <div className="w-full flex justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInPage() {
  const { t } = useTranslation();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  if (isLoaded && isSignedIn) {
    return (
      <AuthLayout
        title={t('Empowering Saudi Enterprises with Smart Accounting', 'تمكين المنشآت السعودية بنظام إداري متكامل')}
        subtitle={t('Access your consolidated financial ledger, ZATCA tax invoices, and real-time executive analytics.', 'الوصول إلى دفتر الاستاد المحاسبي والفواتير الضريبية والتحليلات المباشرة.')}
      >
        <div className="w-full max-w-md bg-card p-6 rounded-2xl shadow-xl border border-border text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {t('Already Signed In', 'أنت مسجل الدخول بالفعل')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('Logged in as', 'مسجل باسم')}: <span className="font-semibold text-foreground">{user?.primaryEmailAddress?.emailAddress || user?.fullName || 'User'}</span>
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setLocation('/home')}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all"
            >
              {t('Go to Workspace / Dashboard', 'الانتقال إلى مساحة العمل / لوحة التحكم')}
            </button>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-all"
            >
              {t('Sign Out to Test New Credentials', 'تسجيل الخروج لتجربة بيانات دخول جديدة')}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('Empowering Saudi Enterprises with Smart Accounting', 'تمكين المنشآت السعودية بنظام إداري متكامل')}
      subtitle={t('Access your consolidated financial ledger, ZATCA tax invoices, and real-time executive analytics.', 'الوصول إلى دفتر الاستاد المحاسبي والفواتير الضريبية والتحليلات المباشرة.')}
    >
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/home`}
        forceRedirectUrl={`${basePath}/home`}
      />
    </AuthLayout>
  );
}

function SignUpPage() {
  const { t } = useTranslation();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  if (isLoaded && isSignedIn) {
    return (
      <AuthLayout
        title={t('Start Your ZATCA Compliant Workspace Today', 'ابدأ مساحة عملك المتوافقة مع هيئة الزكاة والضريبة اليوم')}
        subtitle={t('Join thousands of Saudi enterprises managing SOCPA accounts, purchase bills, and VAT return reporting.', 'انضم إلى آلاف المنشآت السعودية في إدارة الحسابات، فواتير المشتريات، وإقرارات الضريبة.')}
      >
        <div className="w-full max-w-md bg-card p-6 rounded-2xl shadow-xl border border-border text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {t('Already Signed In', 'أنت مسجل الدخول بالفعل')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('Logged in as', 'مسجل باسم')}: <span className="font-semibold text-foreground">{user?.primaryEmailAddress?.emailAddress || user?.fullName || 'User'}</span>
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setLocation('/home')}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all"
            >
              {t('Go to Workspace / Dashboard', 'الانتقال إلى مساحة العمل / لوحة التحكم')}
            </button>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-all"
            >
              {t('Sign Out to Test New Credentials', 'تسجيل الخروج لتجربة بيانات دخول جديدة')}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('Start Your ZATCA Compliant Workspace Today', 'ابدأ مساحة عملك المتوافقة مع هيئة الزكاة والضريبة اليوم')}
      subtitle={t('Join thousands of Saudi enterprises managing SOCPA accounts, purchase bills, and VAT return reporting.', 'انضم إلى آلاف المنشآت السعودية في إدارة الحسابات، فواتير المشتريات، وإقرارات الضريبة.')}
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/home`}
        forceRedirectUrl={`${basePath}/home`}
      />
    </AuthLayout>
  );
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(165 61% 28%)",
    colorBackground: "hsl(var(--card))",
    colorForeground: "hsl(var(--foreground))",
    colorInput: "hsl(var(--background))",
    colorInputForeground: "hsl(var(--foreground))",
    fontFamily: "var(--app-font-sans)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-[22px] shadow-2xl w-[440px] max-w-full overflow-hidden border border-border/80 p-1",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none p-6",
    footer: "bg-muted/20 border-t border-border/40 py-3 text-center flex justify-center items-center",
    footerAction: "flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium",
    footerActionLink: "text-primary font-bold hover:underline ml-1",
    footerActionText: "text-muted-foreground text-xs",
    devModeBadge: "!hidden",
    internalB3fy6s: "!hidden",
    headerTitle: "text-foreground font-bold tracking-tight text-xl text-center",
    headerSubtitle: "text-muted-foreground text-xs text-center mt-1",
    socialButtonsBlockButton: "border-border hover:bg-muted font-semibold rounded-xl text-xs py-2.5 transition-all",
    socialButtonsBlockButtonText: "text-foreground font-semibold text-xs",
    dividerRow: "my-4",
    dividerText: "text-xs text-muted-foreground uppercase font-bold tracking-wider",
    formFieldLabel: "text-foreground font-bold text-xs uppercase tracking-wide mb-1.5",
    formFieldInput: "field rounded-xl text-sm py-2.5",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md rounded-xl py-3 text-sm transition-all mt-2",
  }
};

export default function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/home`}
        forceRedirectUrl={`${basePath}/home`}
      >
        <ClerkTokenInitializer>
          <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/" component={PublicHome} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/onboarding">
              <AuthGuard><Onboarding /></AuthGuard>
            </Route>

            <Route path="/home">
              <AuthGuard><NexusHome /></AuthGuard>
            </Route>

            <Route path="/finance">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <FinanceOverview />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/dashboard">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <Redirect to="/finance" />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/settings/modules">
              <AuthGuard><ModulesSettings /></AuthGuard>
            </Route>

            <Route path="/settings/organization">
              <AuthGuard><OrganizationProfile /></AuthGuard>
            </Route>
            <Route path="/settings/users">
              <AuthGuard><UsersSettings /></AuthGuard>
            </Route>
            <Route path="/settings/appearance">
              <AuthGuard><AppearanceSettings /></AuthGuard>
            </Route>
            <Route path="/settings/security">
              <AuthGuard><SecuritySettings /></AuthGuard>
            </Route>
            <Route path="/settings/audit-log">
              <AuthGuard><AuditLogSettings /></AuthGuard>
            </Route>
            <Route path="/settings/branches">
              <AuthGuard><BranchesSettings /></AuthGuard>
            </Route>
            <Route path="/settings/zatca">
              <AuthGuard><ZatcaSettings /></AuthGuard>
            </Route>
            <Route path="/settings/language">
              <AuthGuard><LanguageSettings /></AuthGuard>
            </Route>

            <Route path="/finance/customers">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <Customers />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/customers/:id">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <CustomerDetail />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/suppliers">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <Suppliers />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/suppliers/:id">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <SupplierDetail />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/items">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <CatalogItems />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/items/:id">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <CatalogItemDetail />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/quotations">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <QuotationsPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/quotations/:quotationId">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <QuotationDetailPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/invoices">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <InvoicesPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/invoices/:invoiceId">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <InvoiceDetailPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/bills">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <BillsPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/bills/:billId">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <BillDetailPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/finance/expenses">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <ExpensesPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/accounting">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <Redirect to="/accounting/accounts" />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/accounting/accounts">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <ChartOfAccountsPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/accounting/journal-entries">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <JournalEntriesPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/accounting/journal-entries/:entryId">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <JournalEntryDetailPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/accounting/trial-balance">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <TrialBalancePage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/reports">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <ReportsPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/reports/profit-and-loss">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <ProfitLossPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/reports/balance-sheet">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <BalanceSheetPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/reports/zatca-vat-return">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <VatReturnPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            <Route path="/reports/account-ledger">
              <AuthGuard>
                <ModuleGuard moduleKey="finance">
                  <AccountLedgerPage />
                </ModuleGuard>
              </AuthGuard>
            </Route>

            {/* Placeholders for coming soon routes */}
            <Route path="/:rest*">
              <AuthGuard>
                <div className="flex flex-col items-center justify-center h-[50vh] text-center fade-up">
                  <div className="p-4 bg-muted rounded-full text-muted-foreground mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold">Coming Soon</h2>
                  <p className="text-muted-foreground mt-2 max-w-sm">This module is currently in development and will be available in a future update.</p>
                </div>
              </AuthGuard>
            </Route>
          </Switch>
        </QueryClientProvider>
      </ClerkTokenInitializer>
    </ClerkProvider>
    </ErrorBoundary>
  );
}
