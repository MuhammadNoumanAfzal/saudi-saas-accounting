import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { getGetCurrentSessionQueryKey, getListOrganizationModulesQueryKey, getFindPartiesQueryKey, useGetCurrentSession, useUpdateUserPreferences, useListOrganizationModules, useFindParties, useListCatalogItems, getListCatalogItemsQueryKey } from '@workspace/api-client-react';
import { MODULE_REGISTRY } from '@workspace/platform-core';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Menu, X, Home, Receipt, ShoppingBag, Package, Landmark, BarChart3,
  Building2, Users, Store, Languages, ShieldCheck, SlidersHorizontal, FileClock, Zap,
  Search, Plus, Bell, HelpCircle, ChevronRight, ChevronDown, Check, Grid, ArrowLeft,
  ArrowRight, FileText
} from 'lucide-react';
import { useTranslation, setGlobalLanguage } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { queryClient } from '@/lib/queryClient';
import { prefetchSalesModule } from '@/lib/sales-prefetch';
import { prefetchPurchasesModule } from '@/lib/purchases-prefetch';
import { prefetchCatalogModule } from '@/lib/catalog-prefetch';
import { prefetchAccountingModule } from '@/lib/accounting-prefetch';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overlay, setOverlay] = useState<'search' | 'create' | 'notifications' | 'help' | 'user' | 'modules' | 'org' | null>(null);
  const [search, setSearch] = useState('');
  
  const updatePrefs = useUpdateUserPreferences();
  const [collapsed, setCollapsed] = useState(false);

  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  const activeMembership = session?.organizations?.find(item => item.organization.id === orgId) ?? session?.organizations?.[0];
  const canWriteFinance = activeMembership?.role !== 'viewer';
  const { data: orgModules } = useListOrganizationModules(orgId, {
    query: { enabled: !!orgId, queryKey: getListOrganizationModulesQueryKey(orgId) }
  });
  const activeModuleKeys = new Set(orgModules?.filter(m => m.enabled).map(m => m.module.key) || []);

  useEffect(() => {
    setCollapsed(session?.preferences?.sidebarCollapsed ?? false);
  }, [session?.preferences?.sidebarCollapsed]);

  useEffect(() => {
    if (session?.preferences?.language) {
      const stored = localStorage.getItem('nexus_lang');
      if (session.preferences.language !== stored && (session.preferences.language === 'ar' || session.preferences.language === 'en')) {
        setGlobalLanguage(session.preferences.language as 'ar' | 'en');
      }
    }
  }, [session?.preferences?.language]);

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    const localTheme = localStorage.getItem('nexus_theme');
    const appearance = localTheme || session?.preferences?.appearance || 'light';

    let isDark = false;
    if (appearance === 'dark') {
      isDark = true;
    } else if (appearance === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = false;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isRtl, session?.preferences?.appearance]);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    updatePrefs.mutate(
      { data: { sidebarCollapsed: next } },
      {
        onError: () => setCollapsed(!next),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() }),
      },
    );
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOverlay('search');
      }
      if (event.key === 'Escape') setOverlay(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navPrimary = [
    { href: '/finance', label: t('Overview', 'نظرة عامة'), icon: Home },
    {
      label: t('Sales', 'المبيعات'),
      icon: Receipt,
      children: [
        { href: '/finance/customers', label: t('Customers', 'العملاء') },
        { href: '/finance/quotations', label: t('Quotations', 'عروض الأسعار') },
        { href: '/finance/invoices', label: t('Invoices', 'الفواتير') },
      ]
    },
    {
      label: t('Purchases', 'المشتريات'),
      icon: ShoppingBag,
      children: [
        { href: '/finance/suppliers', label: t('Suppliers', 'الموردون') },
        { href: '/finance/bills', label: t('Purchase Bills', 'فواتير المشتريات') },
        { href: '/finance/expenses', label: t('Expenses', 'المصروفات') },
      ]

    },
    { href: '/finance/items', label: t('Catalog', 'الكتالوج'), icon: Package },
    {
      label: t('Accounting', 'المحاسبة'),
      icon: Landmark,
      children: [
        { href: '/accounting/accounts', label: t('Chart of Accounts', 'شجرة الحسابات') },
        { href: '/accounting/journal-entries', label: t('Journal Entries', 'القيود اليومية') },
        { href: '/accounting/trial-balance', label: t('Trial Balance', 'ميزان المراجعة') },
      ]
    },
    {
      label: t('Reports', 'التقارير'),
      icon: BarChart3,
      children: [
        { href: '/reports/profit-and-loss', label: t('Profit & Loss', 'قائمة الدخل') },
        { href: '/reports/balance-sheet', label: t('Balance Sheet', 'الميزانية العمومية') },
        { href: '/reports/zatca-vat-return', label: t('ZATCA VAT Return', 'إقرار الضريبة') },
        { href: '/reports/account-ledger', label: t('Account Ledger', 'كشف حساب') },
        { href: '/reports/customer-statement', label: t('Customer Statement', 'كشف العميل') },
        { href: '/reports/supplier-statement', label: t('Supplier Statement', 'كشف المورد') },
      ]
    },
  ];

  const navSettings = [
    { href: '/settings/organization', label: t('Organization', 'المنشأة'), icon: Building2 },
    { href: '/settings/modules', label: t('Modules', 'الوحدات'), icon: Grid },
    { href: '/settings/users', label: t('Users & roles', 'المستخدمون والأدوار'), icon: Users },
    { href: '/settings/branches', label: t('Branches', 'الفروع'), icon: Store },
    { href: '/settings/language', label: t('Language & region', 'اللغة والمنطقة'), icon: Languages },
    { href: '/settings/security', label: t('Security', 'الأمان'), icon: ShieldCheck },
    { href: '/settings/appearance', label: t('Appearance', 'المظهر'), icon: SlidersHorizontal },
    /* audit log removed */
    { href: '/settings/zatca', label: t('ZATCA', 'هيئة الزكاة والضريبة'), icon: Zap },
  ];

  const { signOut } = useClerk();
  const { user } = useUser();
  const org = session?.organizations?.find(o => o.organization.id === session.preferences.currentOrganizationId)?.organization || session?.organizations?.[0]?.organization;
  const debouncedSearch = useDebounce(search, 300);

  const { data: searchResults } = useFindParties(orgId, {
    q: debouncedSearch
  }, {
    query: {
      enabled: !!orgId && overlay === 'search' && debouncedSearch.length >= 2,
      queryKey: getFindPartiesQueryKey(orgId, { q: debouncedSearch })
    }
  });

  const { data: catalogResults } = useListCatalogItems(orgId, {
    search: debouncedSearch,
    pageSize: 5
  }, {
    query: {
      enabled: !!orgId && overlay === 'search' && debouncedSearch.length >= 2,
      queryKey: getListCatalogItemsQueryKey(orgId, { search: debouncedSearch, pageSize: 5 })
    }
  });

  const searchableRoutes = [
    ['/finance', t('Finance Overview', 'نظرة عامة على المالية')],
    ['/settings/organization', t('Organization profile', 'ملف المنشأة')],
    ['/settings/modules', t('Modules', 'الوحدات')],
    ['/settings/users', t('Users & roles', 'المستخدمون والأدوار')],
    ['/settings/branches', t('Branches', 'الفروع')],
    ['/settings/language', t('Language & region', 'اللغة والمنطقة')],
    ['/settings/security', t('Security', 'الأمان')],
    ['/settings/appearance', t('Appearance', 'المظهر')],
    /* audit log removed */
    ['/settings/zatca', t('ZATCA integration', 'الربط مع هيئة الزكاة والضريبة')],
  ].filter(([, label]) => label.toLowerCase().includes(search.toLowerCase()));

  const selectOrganization = (organizationId: string) => {
    if (organizationId === 'create') {
      setLocation('/onboarding?new=1');
      return;
    }
    updatePrefs.mutate(
      { data: { currentOrganizationId: organizationId } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
          setLocation('/home');
        },
      },
    );
  };

  const toggleLanguage = () => {
    updatePrefs.mutate(
      { data: { language: isRtl ? 'en' : 'ar' } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() }),
      },
    );
  };

  const isHome = location === '/home';

  const SidebarContent = () => (
    <>
      <button
        type="button"
        aria-label="NEXUS"
        title={t('Open NEXUS modules', 'فتح وحدات نكسس')}
        onClick={() => {
          setMobileOpen(false);
          setOverlay('modules');
        }}
        className="mx-2 mb-6 flex h-12 items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-white/5"
      >
        <img src={`${basePath}/logo.svg`} className="h-8 w-8 rounded-lg shrink-0" alt="NEXUS" />
        {!collapsed && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-base font-bold tracking-tight text-primary-foreground truncate">NEXUS</div>
            <div className="text-[10px] text-primary-foreground/50">
              {t('Open modules', 'فتح الوحدات')}
            </div>
          </div>
        )}
        {!collapsed && <Grid size={15} className="text-primary-foreground/45" />}
      </button>

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 scrollbar-hide px-3 pb-6">
        {!isHome && (
          <div>
            {!collapsed && (
              <div className="mb-2 px-2 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#a7f3d0' }}>
                <span>{t('Finance', 'المالية')}</span>
                <Link href="/home" className="flex items-center gap-1 transition-colors hover:opacity-100" style={{ color: '#ffffff' }} title={t('Back to Home', 'العودة للرئيسية')}>
                  {isRtl ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
                  <span>{t('Home', 'الرئيسية')}</span>
                </Link>
              </div>
            )}
            <nav className="space-y-1">
              {navPrimary.map((item, idx) => {
                const Icon = item.icon;
                if ('children' in item && item.children) {
                  return (
                    <div key={idx} className="mb-3">
                      <div className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-bold uppercase tracking-wide`} style={{ color: '#ffffff' }} title={collapsed ? item.label : undefined}>
                        <Icon size={18} className="shrink-0" style={{ color: '#6ee7b7' }} />
                        {!collapsed && <span className="flex-1 truncate" style={{ color: '#ffffff' }}>{item.label}</span>}
                      </div>
                      {!collapsed && (
                        <div className="mt-1 space-y-1 border-l-2 ml-4 pl-2.5 rtl:border-l-0 rtl:border-r-2 rtl:ml-0 rtl:mr-4 rtl:pr-2.5" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                          {item.children.map(child => {
                            const active = location.startsWith(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onMouseEnter={() => {
                                  prefetchSalesModule(orgId, child.href);
                                  prefetchPurchasesModule(orgId, child.href);
                                  prefetchCatalogModule(orgId, child.href);
                                  prefetchAccountingModule(orgId, child.href);
                                }}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                  active
                                    ? 'bg-white/25 font-bold shadow-sm ring-1 ring-white/40 translate-x-0.5 rtl:-translate-x-0.5'
                                    : 'hover:bg-white/10'
                                }`}
                                style={{ color: '#ffffff' }}
                              >
                                <span className="flex-1 truncate" style={{ color: '#ffffff', fontWeight: active ? 700 : 500 }}>{child.label}</span>
                                {(child as any).soon && <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide" style={{ color: '#ffffff' }}>{t('Soon', 'قريباً')}</span>}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = location === item.href;
                return (
                  <Link
                    key={item.href || idx}
                    href={item.href!}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-white/25 font-bold shadow-sm ring-1 ring-white/40'
                        : 'hover:bg-white/10'
                    }`}
                    style={{ color: '#ffffff' }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="shrink-0" style={{ color: '#6ee7b7' }} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate" style={{ color: '#ffffff', fontWeight: active ? 700 : 500 }}>{item.label}</span>
                        {item.soon && <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wide" style={{ color: '#ffffff' }}>{t('Soon', 'قريباً')}</span>}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        <div>
          {!collapsed && <div className="mb-2 px-2 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#a7f3d0' }}>{t('Platform Settings', 'إعدادات المنصة')}</div>}
          <nav className="space-y-1">
            {navSettings.map(item => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white/25 font-bold shadow-sm ring-1 ring-white/40'
                      : 'hover:bg-white/10'
                  }`}
                  style={{ color: '#ffffff' }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="shrink-0" style={{ color: '#6ee7b7' }} />
                  {!collapsed && <span className="flex-1 truncate" style={{ color: '#ffffff', fontWeight: active ? 700 : 500 }}>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-white/15 shrink-0">
        <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10" onClick={() => setOverlay('user')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white shrink-0 ring-1 ring-white/30">
            {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'M').toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="truncate font-bold text-white text-xs">{user?.fullName || user?.firstName || session?.user?.displayName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || t('User', 'المستخدم')}</div>
              <div className="truncate text-[10px] text-white/70">{user?.emailAddresses?.[0]?.emailAddress || session?.user?.email}</div>
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-row">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col sidebar-bg sticky top-0 h-screen shrink-0 transition-all duration-300 z-20 print:hidden ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex print:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-[260px] flex-col sidebar-bg shadow-2xl">
            <button className="absolute top-4 end-4 text-primary-foreground/50 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative print:block print:w-full print:p-0">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 px-4 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 -ms-1.5 text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            
            <button className="hidden md:flex p-1 text-muted-foreground hover:text-foreground" onClick={toggleSidebar}>
              <Menu size={18} />
            </button>

            {/* App Switcher */}
            <button onClick={() => setOverlay('modules')} className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-bold text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border">
              <Grid size={16} className="text-primary" />
              <span>NEXUS</span>
            </button>

            {org && (
              <>
                <span className="hidden sm:inline-block text-muted-foreground/40">/</span>
                <button
                  type="button"
                  onClick={() => setOverlay('org')}
                  className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border text-start"
                  title={t('Switch organization', 'تبديل المنشأة')}
                >
                  <div className="h-6 w-6 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {org.legalNameEnglish.charAt(0)}
                  </div>
                  <span className="max-w-[160px] truncate text-sm font-semibold text-foreground">
                    {isRtl ? (org.legalNameArabic || org.legalNameEnglish) : org.legalNameEnglish}
                  </span>
                  <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setOverlay('search')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted border border-transparent hover:border-border transition-all">
              <Search size={14} />
              <span>{t('Search...', 'بحث...')}</span>
              <kbd className="ms-2 pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100"><span className="text-xs">⌘</span>K</kbd>
            </button>
            {canWriteFinance && (
              <button onClick={() => setOverlay('create')} className="flex items-center justify-center h-8 w-8 rounded-lg text-primary hover:bg-primary/10 transition-colors" title={t('Quick create', 'Quick create')}>
                <Plus size={18} />
              </button>
            )}
            <button onClick={() => setOverlay('notifications')} className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title={t('Notifications', 'الإشعارات')}>
              <Bell size={18} />
            </button>

            <button onClick={() => setOverlay('help')} className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title={t('Help', 'المساعدة')}>
              <HelpCircle size={18} />
            </button>
            <button onClick={toggleLanguage} className="flex items-center justify-center h-8 min-w-8 rounded-lg px-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title={t('Switch to Arabic', 'التبديل إلى الإنجليزية')}>
              {isRtl ? 'EN' : 'ع'}
            </button>
            <button onClick={() => setOverlay('user')} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" title={t('User menu', 'قائمة المستخدم')}>
              {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'M').toUpperCase()}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full print:p-0 print:overflow-visible print:block">
          {children}
        </main>
      </div>
      {overlay && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={() => setOverlay(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl fade-up" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold text-base text-foreground">
                {overlay === 'search' && t('Search KHANBAS NEXUS', 'البحث في خانـباس نكسس')}
                {overlay === 'create' && t('Quick Create Action', 'إنشاء سريع')}
                {overlay === 'notifications' && t('Notifications & Activity', 'الإشعارات والنشاط')}
                {overlay === 'help' && t('Help & Compliance Center', 'مركز المساعدة والامتثال')}
                {overlay === 'user' && t('Account & Workspace Settings', 'إعدادات الحساب ومساحة العمل')}
                {overlay === 'modules' && t('NEXUS ERP Modules', 'وحدات نكسس')}
                {overlay === 'org' && t('Switch Organization', 'تبديل المنشأة')}
              </h2>
              <button onClick={() => setOverlay(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><X size={18} /></button>
            </div>
            
            {overlay === 'org' && (
              <div className="p-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {t('Your Organizations', 'منشآتك')}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {session?.organizations?.map(item => {
                    const isSelected = item.organization.id === org?.id;
                    const orgName = isRtl ? (item.organization.legalNameArabic || item.organization.legalNameEnglish) : item.organization.legalNameEnglish;
                    return (
                      <button
                        key={item.organization.id}
                        onClick={() => {
                          selectOrganization(item.organization.id);
                          setOverlay(null);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-start transition-all ${
                          isSelected 
                            ? 'border-primary/40 bg-primary/10 font-bold' 
                            : 'border-border/60 hover:bg-muted/70 hover:border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {item.organization.legalNameEnglish.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{orgName}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span>CR: {item.organization.commercialRegistrationNumber || 'N/A'}</span>
                              <span>•</span>
                              <span className="capitalize">{item.role || 'Owner'}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={18} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    selectOrganization('create');
                    setOverlay(null);
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-primary/40 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
                >
                  <Plus size={16} />
                  <span>{t('Create New Organization', 'إنشاء منشأة جديدة')}</span>
                </button>
              </div>
            )}

            {overlay === 'modules' && (
              <div className="p-2 max-h-[60vh] overflow-auto">
                <div className="grid grid-cols-2 gap-2 p-2">
                  {MODULE_REGISTRY.map(moduleDef => {
                    const isActive = activeModuleKeys.has(moduleDef.key);
                    
                    if (isActive) {
                      return (
                        <button key={moduleDef.key} onClick={() => { setLocation(moduleDef.route); setOverlay(null); }} className="flex flex-col items-center justify-center p-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-center group">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            {moduleDef.icon === 'wallet-cards' && <Zap size={20} />}
                            {moduleDef.icon !== 'wallet-cards' && <Grid size={20} />}
                          </div>
                          <span className="text-sm font-bold text-foreground">{isRtl ? moduleDef.nameAr : moduleDef.name}</span>
                        </button>
                      );
                    }
                    
                    return (
                      <div key={moduleDef.key} className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card/50 opacity-60 text-center">
                        <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                          <Grid size={20} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{isRtl ? moduleDef.nameAr : moduleDef.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">{t('Coming Soon', 'قريباً')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {overlay === 'search' && (
              <div className="p-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                  <Search size={17} className="text-muted-foreground" />
                  <input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="h-11 flex-1 bg-transparent text-sm outline-none" placeholder={t('Search pages, parties, catalog, and settings', 'ابحث في الصفحات والعملاء والمنتجات والإعدادات')} />
                </div>
                <div className="mt-3 max-h-72 overflow-auto space-y-1">
                  {searchResults?.map(party => {
                    const role = party.roles[0]?.role === 'customer' ? 'customers' : 'suppliers';
                    return (
                      <button key={party.id} onClick={() => { setLocation(`/finance/${role}/${party.id}`); setOverlay(null); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted text-left">
                        <div>
                          <div className="text-foreground font-bold">{party.displayName}</div>
                          <div className="text-[10px] text-muted-foreground">{party.partyNumber} · {party.partyType}</div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0 rtl:rotate-180" />
                      </button>
                    );
                  })}
                  {catalogResults?.items?.map(item => (
                    <button key={item.id} onClick={() => { setLocation(`/finance/items/${item.id}`); setOverlay(null); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted text-left">
                      <div>
                        <div className="text-foreground font-bold">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground">{item.code} · {item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}</div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground shrink-0 rtl:rotate-180" />
                    </button>
                  ))}
                  {searchableRoutes.map(([href, label]) => (
                    <button key={href} onClick={() => { setLocation(href); setOverlay(null); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted">
                      <span>{label}</span>
                      <ChevronRight size={16} className="text-muted-foreground rtl:rotate-180" />
                    </button>
                  ))}
                  {!searchableRoutes.length && (!searchResults || searchResults.length === 0) && (!catalogResults?.items || catalogResults.items.length === 0) && (
                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t('No matching results found.', 'لا توجد نتائج مطابقة.')}</p>
                  )}
                </div>
              </div>
            )}

            {overlay === 'create' && canWriteFinance && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
                {[
                  { label: t('Sales Invoice', 'فاتورة مبيعات'), desc: t('Create ZATCA Phase 2 E-Invoice', 'إنشاء فاتورة ضريبية إلكترونية'), route: '/finance/invoices?new=1', icon: Receipt, color: 'text-emerald-600 bg-emerald-500/10' },
                  { label: t('Sales Quotation', 'عرض سعر'), desc: t('Generate client price quotation', 'إنشاء عرض سعر للعميل'), route: '/finance/quotations?new=1', icon: FileText, color: 'text-blue-600 bg-blue-500/10' },
                  { label: t('Customer', 'عميل جديد'), desc: t('Register new business client', 'تسجيل عميل جديد في المنظومة'), route: '/finance/customers?new=1', icon: Users, color: 'text-purple-600 bg-purple-500/10' },
                  { label: t('Purchase Bill', 'فاتورة مشتريات'), desc: t('Record supplier purchase bill', 'تسجيل فاتورة مشتريات من مورد'), route: '/finance/bills?new=1', icon: ShoppingBag, color: 'text-amber-600 bg-amber-500/10' },
                  { label: t('Log Expense', 'تسجيل مصروف'), desc: t('Log business cash or bank expense', 'تسجيل مصروفات تشغيلية'), route: '/finance/expenses?new=1', icon: Landmark, color: 'text-rose-600 bg-rose-500/10' },
                  { label: t('Supplier', 'مورد جديد'), desc: t('Register product/service vendor', 'تسجيل مورد جديد'), route: '/finance/suppliers?new=1', icon: Store, color: 'text-cyan-600 bg-cyan-500/10' },
                  { label: t('Catalog Product', 'منتج / خدمة'), desc: t('Add inventory or service item', 'إضافة صنف للكتالوج'), route: '/finance/items?new=1', icon: Package, color: 'text-indigo-600 bg-indigo-500/10' },
                  { label: t('Journal Entry', 'قيد يومية'), desc: t('Manual double-entry GL journal', 'تسجيل قيد محاسبي يدوي'), route: '/accounting/journal-entries?new=1', icon: FileClock, color: 'text-teal-600 bg-teal-500/10' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={item.label} 
                      className="group flex items-start gap-3 rounded-2xl border border-border/70 p-3.5 text-start transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm" 
                      onClick={() => {
                        setLocation(item.route);
                        setOverlay(null);
                      }}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${item.color} group-hover:scale-110 transition-transform`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {overlay === 'notifications' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('System Alerts & Activity', 'التنبيهات والنشاط')}</span>
                  <button onClick={() => showAlert.toast(t('All notifications marked as read.', 'تم تحديد جميع الإشعارات كمقروءة.'))} className="text-xs text-primary font-semibold hover:underline">
                    {t('Mark all read', 'تحديد الكل كمقروء')}
                  </button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <Check size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('ZATCA Phase 2 Stamp Verified', 'تم التحقق من الفوترة الإلكترونية')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t('Tax invoice INV-00001 successfully generated with QR code.', 'تم توليد الفاتورة الضريبية مع رمز الاستجابة السريعة بنجاح.')}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">10 min ago</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                      <Landmark size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('General Ledger Balanced', 'دفتر الاستاد متوازن')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t('SOCPA double-entry trial balance checked: Debits match Credits.', 'ميزان المراجعة متوازن: إجمالي المدين يساوي الدائن.')}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">1 hour ago</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                      <Zap size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('VAT Return Calculated', 'حساب الإقرار الضريبي')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t('Q3 ZATCA VAT Return draft prepared automatically.', 'تم إعداد مسودة الإقرار الضريبي للربع الثالث تلقائياً.')}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1">Today, 09:30 AM</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {overlay === 'help' && (
              <div className="p-5 space-y-4">
                <div className="text-center pb-2">
                  <HelpCircle className="mx-auto text-primary mb-2" size={32} />
                  <h3 className="font-bold text-lg text-foreground">{t('KHANBAS NEXUS Help Center', 'مركز مساعدة خانـباس نكسس')}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t('Complete Saudi SaaS ERP & SOCPA Accounting Documentation', 'التوثيق الكامل لنظام المحاسبة والفوترة السعودية')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={() => { setOverlay(null); setLocation('/settings/zatca'); }} className="p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-start transition-all">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> {t('ZATCA E-Invoicing Guide', 'دليل الفوترة الإلكترونية')}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{t('Learn Phase 2 QR & XML rules', 'قواعد الرمز الاستجابة وسجل التشفير')}</div>
                  </button>
                  <button onClick={() => { setOverlay(null); setLocation('/accounting/accounts'); }} className="p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-start transition-all">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5"><Landmark size={14} className="text-primary" /> {t('SOCPA Chart of Accounts', 'شجرة الحسابات السعودية')}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{t('Double-entry GL structures', 'هيكلية القيد المزدوج والاستاد')}</div>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground flex items-center justify-between">
                  <span>{t('Global Search Shortcut:', 'اختصار البحث الشامل:')}</span>
                  <kbd className="px-2 py-1 rounded bg-background border border-border font-mono font-bold text-foreground text-[11px]">⌘K / Ctrl+K</kbd>
                </div>
              </div>
            )}

            {overlay === 'user' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-muted/40 border border-border/50">
                  <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                    {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'M').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-foreground truncate">
                      {user?.fullName || user?.firstName || session?.user?.displayName || t('User', 'المستخدم')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {user?.emailAddresses?.[0]?.emailAddress || session?.user?.email}
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck size={12} />
                      <span>{t('Workspace Administrator', 'مدير مساحة العمل')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {[
                    [t('Profile & Security', 'الملف الشخصي والأمان'), '/settings/security', ShieldCheck],
                    [t('Organization Profile', 'ملف المنشأة'), '/settings/organization', Building2],
                    [t('Appearance & Theme', 'المظهر والتفضيلات'), '/settings/appearance', SlidersHorizontal],
                    [t('Audit Log Inspector', 'سجل النشاط والتدقيق'), '/settings/audit-log', FileClock]
                  ].map(([label, href, Icon]: any) => (
                    <button
                      key={href}
                      onClick={() => {
                        setLocation(href);
                        setOverlay(null);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/70 text-sm font-semibold text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-primary" />
                        <span>{label}</span>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground/60 rtl:rotate-180" />
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <button 
                    onClick={toggleLanguage} 
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Languages size={16} />
                    <span>{isRtl ? 'English Language' : 'اللغة العربية'}</span>
                  </button>

                  <button 
                    onClick={async () => {
                      const confirmed = await showAlert.confirm(
                        t('Are you sure you want to sign out of KHANBAS NEXUS?', 'هل أنت تأكد من رغبتك في تسجيل الخروج من منصة نكسس؟'),
                        t('Sign Out Confirmation', 'تأكيد تسجيل الخروج'),
                        t('Yes, Sign Out', 'نعم، تسجيل الخروج'),
                        t('Cancel', 'إلغاء')
                      );
                      if (confirmed) {
                        showAlert.toast(t('Signed Out Successfully', 'تم تسجيل الخروج بنجاح'), 'info');
                        try { sessionStorage.clear(); } catch (e) {}
                        setOverlay(null);
                        signOut({ redirectUrl: basePath || '/' });
                      }
                    }} 
                    className="flex items-center gap-2 text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{t('Sign out', 'تسجيل الخروج')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
