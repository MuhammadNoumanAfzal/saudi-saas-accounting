import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { getGetCurrentSessionQueryKey, useGetCurrentSession, useUpdateUserPreferences } from '@workspace/api-client-react';
import {
  Menu, X, Home, Receipt, ShoppingBag, Package, Landmark, BarChart3,
  Building2, Users, Store, Languages, ShieldCheck, SlidersHorizontal, FileClock, Zap,
  Search, Plus, Bell, HelpCircle, ChevronRight, Check
} from 'lucide-react';
import { useTranslation } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overlay, setOverlay] = useState<'search' | 'create' | 'notifications' | 'help' | 'user' | null>(null);
  const [search, setSearch] = useState('');
  
  const updatePrefs = useUpdateUserPreferences();
  const [collapsed, setCollapsed] = useState(false);

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
    { href: '/dashboard', label: t('Overview', 'نظرة عامة'), icon: Home },
    { href: '/sales', label: t('Sales', 'المبيعات'), icon: Receipt, soon: true },
    { href: '/purchases', label: t('Purchases', 'المشتريات'), icon: ShoppingBag, soon: true },
    { href: '/products', label: t('Products', 'المنتجات'), icon: Package, soon: true },
    { href: '/accounting', label: t('Accounting', 'المحاسبة'), icon: Landmark, soon: true },
    { href: '/reports', label: t('Reports', 'التقارير'), icon: BarChart3, soon: true },
  ];

  const navSettings = [
    { href: '/settings/organization', label: t('Organization', 'المنشأة'), icon: Building2 },
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
  const searchableRoutes = [
    ['/dashboard', t('Dashboard', 'لوحة المعلومات')],
    ['/settings/organization', t('Organization profile', 'ملف المنشأة')],
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
          setLocation('/dashboard');
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

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-3 mb-8 h-12">
        <img src={`${basePath}/logo.svg`} className="h-8 w-8 rounded-lg shrink-0" alt="Mizan" />
        {!collapsed && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-base font-bold tracking-tight text-primary-foreground truncate">mizan<span className="text-accent">.</span></div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 scrollbar-hide px-3 pb-6">
        <div>
          {!collapsed && <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">{t('Workspace', 'مساحة العمل')}</div>}
          <nav className="space-y-0.5">
            {navPrimary.map(item => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent/10 text-accent' : 'text-primary-foreground/70 hover:bg-white/5 hover:text-primary-foreground'}`} title={collapsed ? item.label : undefined}>
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

        <div>
          {!collapsed && <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">{t('Settings', 'الإعدادات')}</div>}
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
              <div className="truncate font-semibold text-primary-foreground text-xs">{user?.firstName || t('Owner', 'المالك')}</div>
              <div className="truncate text-[10px] text-primary-foreground/50">{user?.emailAddresses?.[0]?.emailAddress}</div>
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

            {org && (
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
                {overlay === 'search' && t('Search Mizan', 'البحث في ميزان')}
                {overlay === 'create' && t('Quick create', 'إنشاء سريع')}
                {overlay === 'notifications' && t('Notifications', 'الإشعارات')}
                {overlay === 'help' && t('Help', 'المساعدة')}
                {overlay === 'user' && t('Your account', 'حسابك')}
              </h2>
              <button onClick={() => setOverlay(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X size={18} /></button>
            </div>
            {overlay === 'search' && (
              <div className="p-4">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
                  <Search size={17} className="text-muted-foreground" />
                  <input autoFocus value={search} onChange={event => setSearch(event.target.value)} className="h-11 flex-1 bg-transparent text-sm outline-none" placeholder={t('Search pages and settings', 'ابحث في الصفحات والإعدادات')} />
                </div>
                <div className="mt-3 max-h-72 overflow-auto">
                  {searchableRoutes.map(([href, label]) => (
                    <button key={href} onClick={() => { setLocation(href); setOverlay(null); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted">
                      {label}<ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  ))}
                  {!searchableRoutes.length && <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t('No matching pages.', 'لا توجد صفحات مطابقة.')}</p>}
                </div>
              </div>
            )}
            {overlay === 'create' && (
              <div className="grid grid-cols-2 gap-3 p-5">
                {[t('Customer', 'عميل'), t('Quotation', 'عرض سعر'), t('Invoice', 'فاتورة'), t('Supplier', 'مورد'), t('Expense', 'مصروف'), t('Product', 'منتج')].map(label => (
                  <button key={label} className="rounded-xl border border-border p-4 text-start text-sm font-semibold hover:border-primary/40 hover:bg-primary/5" onClick={() => setOverlay(null)}>
                    {label}<span className="mt-1 block text-[11px] font-normal text-muted-foreground">{t('Coming in the next setup stage', 'قريباً في مرحلة الإعداد التالية')}</span>
                  </button>
                ))}
              </div>
            )}
            {overlay === 'notifications' && <div className="p-10 text-center"><Bell className="mx-auto text-muted-foreground/40" /><p className="mt-4 font-bold">{t("You're all caught up.", 'لا توجد إشعارات جديدة.')}</p><p className="mt-1 text-sm text-muted-foreground">{t('New account activity will appear here.', 'سيظهر نشاط الحساب الجديد هنا.')}</p></div>}
            {overlay === 'help' && <div className="p-8 text-center"><HelpCircle className="mx-auto text-primary" /><p className="mt-4 font-bold">{t('Mizan help center', 'مركز مساعدة ميزان')}</p><p className="mt-2 text-sm text-muted-foreground">{t('Guided help will be available as accounting modules are introduced.', 'ستتوفر المساعدة الإرشادية مع إضافة وحدات المحاسبة.')}</p></div>}
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
