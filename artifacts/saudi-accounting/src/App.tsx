import { useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'wouter';
import { ClerkProvider, SignIn, SignUp, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useGetCurrentSession } from '@workspace/api-client-react';

import { AppShell } from './components/layout/app-shell';
import { Onboarding } from './pages/onboarding';
import { Dashboard } from './pages/dashboard';
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return <div className="min-h-screen bg-background" />;
  if (!isSignedIn) return <Redirect to="/" />;
  
  return <SessionGuard>{children}</SessionGuard>;
}

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useGetCurrentSession();
  const [path] = useLocation();
  
  if (isLoading) return <div className="min-h-screen bg-background" />;
  
  const org =
    session?.organizations?.find(
      (item) =>
        item.organization.id === session.preferences.currentOrganizationId,
    )?.organization ?? session?.organizations?.[0]?.organization;
  const isComplete = org?.onboardingCompleted;

  // If no org or not complete, trap in onboarding unless we are already on it.
  if (!isComplete && path !== '/onboarding') {
    return <Redirect to="/onboarding" />;
  }
  
  if (path === '/onboarding') {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
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
    colorPrimary: "hsl(165 61% 28%)", // Deep green
    colorBackground: "hsl(42 40% 99%)",
    colorForeground: "hsl(205 42% 17%)",
    colorInput: "hsl(42 40% 99%)",
    colorInputForeground: "hsl(205 42% 17%)",
    fontFamily: "var(--app-font-sans)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(42_40%_99%)] rounded-[20px] shadow-xl w-[440px] max-w-full overflow-hidden border border-[hsl(37_25%_87%)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-muted-foreground font-bold text-xs uppercase tracking-wide",
    footerActionLink: "text-primary font-bold hover:text-primary/80",
    footerActionText: "text-muted-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm rounded-xl py-2.5",
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
      >
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/" component={PublicHome} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/onboarding">
              <AuthGuard><Onboarding /></AuthGuard>
            </Route>

            <Route path="/dashboard">
              <AuthGuard><Dashboard /></AuthGuard>
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
      </ClerkProvider>
    </ErrorBoundary>
  );
}
