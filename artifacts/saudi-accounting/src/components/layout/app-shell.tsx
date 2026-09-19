import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { getGetCurrentSessionQueryKey, getListOrganizationModulesQueryKey, getFindPartiesQueryKey, useGetCurrentSession, useUpdateUserPreferences, useListOrganizationModules, useFindParties, useListCatalogItems, getListCatalogItemsQueryKey } from '@workspace/api-client-react';
import { MODULE_REGISTRY } from '@workspace/platform-core';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Menu, X, Home, Receipt, ShoppingBag, Package, Landmark, BarChart3,
  Building2, Users, Store, Languages, ShieldCheck, SlidersHorizontal, FileClock, Zap,
  Search, Plus, Bell, HelpCircle, ChevronRight, Check, Grid, ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overlay, setOverlay] = useState<'search' | 'create' | 'notifications' | 'help' | 'user' | 'modules' | null>(null);
  const [search, setSearch] = useState('');
  
  const updatePrefs = useUpdateUserPreferences();
  const [collapsed, setCollapsed] = useState(false);

  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const { data: orgModules } = useListOrganizationModules(orgId, {
    query: { enabled: !!orgId, queryKey: getListOrganizationModulesQueryKey(orgId) }
  });
  const activeModuleKeys = new Set(orgModules?.filter(m => m.enabled).map(m => m.module.key) || []);

  useEffect(() => {
    setCollapsed(session?.preferences?.sidebarCollapsed ?? false);
  }, [session?.preferences?.sidebarCollapsed]);
  
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

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    const appearance = session?.preferences?.appearance || 'system';
    if (appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.className = 'dark';
    } else {
      document.documentElement.className = '';
    }
  }, [isRtl, session?.preferences?.appearance]);

  const navPrimary = [
    { href: '/finance', label: t('Overview', 'نظرة عامة'), icon: Home },
    {
      label: t('Sales', 'المبيعات'),
      icon: Receipt,
      children: [
        { href: '/finance/customers', label: t('Customers', 'العملاء') },
        { href: '/finance/quotations', label: t('Quotations', 'عروض الأسعار') },
        { href: '/finance/invoices', label: t('Invoices', 'الفواتير'), soon: true },
      ]
    },
    {
      label: t('Purchases', 'المشتريات'),
      icon: ShoppingBag,
      children: [
        { href: '/finance/suppliers', label: t('Suppliers', 'الموردون') },
        { href: '/finance/bills', label: t('Purchase Bills', 'فواتير المشتريات'), soon: true },
        { href: '/finance/expenses', label: t('Expenses', 'المصروفات'), soon: true },
      ]
    },
    { href: '/finance/items', label: t('Catalog', 'الكتالوج'), icon: Package },
    { href: '/accounting', label: t('Accounting', 'المحاسبة'), icon: Landmark, soon: true },
    { href: '/reports', label: t('Reports', 'التقارير'), icon: BarChart3, soon: true },
  ];

  const navSettings = [
    { href: '/settings/organization', label: t('Organization', 'المنشأة'), icon: Building2 },
    { href: '/settings/modules', label: t('Modules', 'الوحدات'), icon: Grid },
    { href: '/settings/users', label: t('Users & roles', 'المستخدمون والأدوار'), icon: Users },
    { href: '/settings/branches', label: t('Branches', 'الفروع'), icon: Store },
    { href: '/settings/language', label: t('Language & region', 'اللغة والمنطقة'), icon: Languages },
    { href: '/settings/security', label: t('Security', 'الأمان'), icon: ShieldCheck },
    { href: '/settings/appearance', label: t('Appearance', 'المظهر'), icon: SlidersHorizontal },
    { href: '/settings/audit-log', label: t('Audit log', 'سجل النشاط'), icon: FileClock },
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
    ['/settings/audit-log', t('Audit log', 'سجل النشاط')],
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
              <div className="mb-2 px-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">
                <span>{t('Finance', 'المالية')}</span>
                <Link href="/home" className="text-primary-foreground/60 hover:text-primary-foreground flex items-center gap-1 transition-colors" title={t('Back to Home', 'العودة للرئيسية')}>
                  {isRtl ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
                  <span>{t('Home', 'الرئيسية')}</span>
                </Link>
              </div>
            )}
            <nav className="space-y-0.5">
              {navPrimary.map((item, idx) => {
                const Icon = item.icon;
                if ('children' in item && item.children) {
                  return (
                    <div key={idx} className="mb-2">
                      <div className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-primary-foreground/90`} title={collapsed ? item.label : undefined}>
                        <Icon size={18} className="shrink-0" />
                        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      </div>
                      {!collapsed && (
                        <div className="mt-1 space-y-0.5 border-l border-white/10 ml-4 pl-2 rtl:border-l-0 rtl:border-r rtl:ml-0 rtl:mr-4 rtl:pr-2">
                          {item.children.map(child => {
                            const active = location.startsWith(child.href);
                            return (
                              <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-accent/10 text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/5'}`}>
                                <span className="flex-1 truncate">{child.label}</span>
                                {child.soon && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary-foreground/60">{t('Soon', 'قريباً')}</span>}
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
                  <Link key={item.href || idx} href={item.href!} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent/10 text-accent' : 'text-primary-foreground/70 hover:bg-white/5 hover:text-primary-foreground'}`} title={collapsed ? item.label : undefined}>
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.soon && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary-foreground/60">{t('Soon', 'قريباً')}</span>}
                      </>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        <div>
          {!collapsed && <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">{t('Platform Settings', 'إعدادات المنصة')}</div>}
          <nav className="space-y-0.5">
            {navSettings.map(item => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent/10 text-accent' : 'text-primary-foreground/70 hover:bg-white/5 hover:text-primary-foreground'}`} title={collapsed ? item.label : undefined}>
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-white/10 shrink-0">
         <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm text-primary-foreground/70 transition-colors hover:bg-white/5" onClick={() => setOverlay('user')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-primary-foreground shrink-0">
            {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'M').toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="truncate font-semibold text-primary-foreground text-xs">{user?.fullName || user?.firstName || session?.user.displayName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || t('User', 'المستخدم')}</div>
              <div className="truncate text-[10px] text-primary-foreground/50">{user?.emailAddresses?.[0]?.emailAddress || session?.user.email}</div>
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-row">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-primary transition-all duration-300 z-20 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-[260px] flex-col bg-primary shadow-2xl">
            <button className="absolute top-4 end-4 text-primary-foreground/50 hover:text-primary-foreground" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 -ms-1.5 text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            
            <button className="hidden md:flex p-1 text-muted-foreground hover:text-foreground" onClick={toggleSidebar}>
              <Menu size={18} />
            </button>

            {/* App Switcher */}
            <button onClick={() => setOverlay('modules')} className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-bold text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border">
              <Grid size={16} className="text-primary" />
              <span>NEXUS</span>
            </button>

            {org && (
              <>
                <span className="hidden sm:inline-block text-muted-foreground/40">/</span>
                <label className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted cursor-pointer transition-colors">
                  <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {org.legalNameEnglish.charAt(0)}
                  </div>
                  <select
                    className="max-w-44 bg-transparent text-sm font-medium outline-none"
                    value={org.id}
                    onChange={event => selectOrganization(event.target.value)}
                    aria-label={t('Switch organization', 'تبديل المنشأة')}
                  >
                    {session?.organizations?.map(item => (
                      <option key={item.organization.id} value={item.organization.id}>
                        {isRtl ? (item.organization.legalNameArabic || item.organization.legalNameEnglish) : item.organization.legalNameEnglish}
                      </option>
                    ))}
                    <option value="create">{t('+ Create organization', '+ إنشاء منشأة')}</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setOverlay('search')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted border border-transparent hover:border-border transition-all">
              <Search size={14} />
              <span>{t('Search...', 'بحث...')}</span>
              <kbd className="ms-2 pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100"><span className="text-xs">⌘</span>K</kbd>
            </button>

            <button onClick={() => setOverlay('create')} className="flex items-center justify-center h-8 w-8 rounded-lg text-primary hover:bg-primary/10 transition-colors" title={t('Quick create', 'إنشاء سريع')}>
              <Plus size={18} />
            </button>

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

        <main className="flex-1 overflow-auto p-4 md:p-8 lg:px-10 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
      {overlay && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOverlay(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-bold">
                {overlay === 'search' && t('Search KHANBAS NEXUS', 'البحث في خانـباس نكسس')}
                {overlay === 'create' && t('Quick create', 'إنشاء سريع')}
                {overlay === 'notifications' && t('Notifications', 'الإشعارات')}
                {overlay === 'help' && t('Help', 'المساعدة')}
                {overlay === 'user' && t('Your account', 'حسابك')}
                {overlay === 'modules' && t('NEXUS Modules', 'وحدات نكسس')}
              </h2>
              <button onClick={() => setOverlay(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X size={18} /></button>
            </div>
            
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
                  <input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="h-11 flex-1 bg-transparent text-sm outline-none" placeholder={t('Search pages and settings', 'ابحث في الصفحات والإعدادات')} />
                </div>
                <div className="mt-3 max-h-72 overflow-auto">
                  {searchResults?.map(party => {
                    const role = party.roles[0]?.role === 'customer' ? 'customers' : 'suppliers';
                    return (
                      <button key={party.id} onClick={() => { setLocation(`/finance/${role}/${party.id}`); setOverlay(null); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted text-left">
                        <div>
                          <div className="text-foreground">{party.displayName}</div>
                          <div className="text-[10px] text-muted-foreground">{party.partyNumber} · {party.partyType}</div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                  {catalogResults?.items?.map(item => (
                    <button key={item.id} onClick={() => { setLocation(`/finance/items/${item.id}`); setOverlay(null); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted text-left">
                      <div>
                        <div className="text-foreground">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground">{item.code} · {item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}</div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                    </button>
                  ))}
                  {searchableRoutes.map(([href, label]) => (
                    <button key={href} onClick={() => { setLocation(href); setOverlay(null); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted">
                      {label}<ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  ))}
                  {!searchableRoutes.length && (!searchResults || searchResults.length === 0) && <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t('No matching results.', 'لا توجد نتائج مطابقة.')}</p>}
                </div>
              </div>
            )}
            {overlay === 'create' && (
              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  { label: t('Customer', 'عميل'), route: '/finance/customers?new=1' },
                  { label: t('Supplier', 'مورد'), route: '/finance/suppliers?new=1' },
                  { label: t('Quotation', 'عرض سعر'), soon: true },
                  { label: t('Invoice', 'فاتورة'), soon: true },
                  { label: t('Expense', 'مصروف'), soon: true },
                  { label: t('Product', 'منتج'), route: '/finance/items?new=1' }
                ].map(item => (
                  <button key={item.label} className="rounded-xl border border-border p-4 text-start text-sm font-semibold hover:border-primary/40 hover:bg-primary/5" onClick={() => {
                    if (item.route) {
                      setLocation(item.route);
                      setOverlay(null);
                    } else {
                      setOverlay(null);
                    }
                  }}>
                    {item.label}
                    {item.soon && <span className="mt-1 block text-[11px] font-normal text-muted-foreground">{t('Coming in the next setup stage', 'قريباً في مرحلة الإعداد التالية')}</span>}
                  </button>
                ))}
              </div>
            )}
            {overlay === 'notifications' && <div className="p-10 text-center"><Bell className="mx-auto text-muted-foreground/40" /><p className="mt-4 font-bold">{t("You're all caught up.", 'لا توجد إشعارات جديدة.')}</p><p className="mt-1 text-sm text-muted-foreground">{t('New account activity will appear here.', 'سيظهر نشاط الحساب الجديد هنا.')}</p></div>}
            {overlay === 'help' && <div className="p-8 text-center"><HelpCircle className="mx-auto text-primary" /><p className="mt-4 font-bold">{t('KHANBAS NEXUS help center', 'مركز مساعدة خانـباس نكسس')}</p><p className="mt-2 text-sm text-muted-foreground">{t('Guided help will be available as modules are introduced.', 'ستتوفر المساعدة الإرشادية مع إضافة الوحدات.')}</p></div>}
            {overlay === 'user' && (
              <div className="p-4">
                <div className="mb-3 rounded-xl bg-muted/40 p-4"><div className="font-bold">{user?.fullName || session?.user.displayName}</div><div className="mt-1 text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || session?.user.email}</div></div>
                {[[t('Profile & security', 'الملف الشخصي والأمان'), '/settings/security'], [t('Preferences', 'التفضيلات'), '/settings/appearance']].map(([label, href]) => <button key={href} onClick={() => { setLocation(href); setOverlay(null); }} className="flex w-full rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted">{label}</button>)}
                <button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-2 flex w-full rounded-xl px-3 py-3 text-sm font-bold text-destructive hover:bg-destructive/10">{t('Sign out', 'تسجيل الخروج')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
