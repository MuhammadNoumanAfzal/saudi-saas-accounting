import { useGetCurrentSession, useUpdateUserPreferences, getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';
import { Moon, Sun, Monitor, Type, LayoutGrid, CheckCircle2, Sparkles, Paintbrush, Palette, ShieldCheck, RefreshCw } from 'lucide-react';
import { AppearanceKpiCards } from '@/components/settings/appearance-kpi-cards';

export function AppearanceSettings() {
  const { data: session, isLoading, refetch } = useGetCurrentSession({
    query: { staleTime: 10 * 60 * 1000 }
  });
  const { t, isRtl } = useTranslation();
  const update = useUpdateUserPreferences();

  const prefs = session?.preferences;
  const currentTheme = localStorage.getItem('nexus_theme') || prefs?.appearance || 'light';

  const setAppearance = (appearance: 'light' | 'dark' | 'system') => {
    localStorage.setItem('nexus_theme', appearance);

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

    queryClient.setQueryData(getGetCurrentSessionQueryKey(), (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        preferences: {
          ...oldData.preferences,
          appearance
        }
      };
    });

    update.mutate({ data: { appearance } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
        showAlert.toast(
          appearance === 'dark' 
            ? t('Dark theme enabled.', 'تم تفعيل السمة الداكنة.') 
            : appearance === 'light'
            ? t('Light theme enabled.', 'تم تفعيل السمة الفاتحة.')
            : t('System theme enabled.', 'تم تفعيل سمة النظام.'),
          'success'
        );
      }
    });
  };

  const setDensity = (density: 'compact' | 'comfortable') => {
    update.mutate({ data: { density } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
        showAlert.toast(t('Interface density updated.', 'تم تحديث كثافة الواجهة.'), 'success');
      }
    });
  };

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('UI Personalization', 'التصميم وتجربة المستخدم')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> High Contrast AAA
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-primary" />
            <span>{t('Appearance & Personalization', 'المظهر وتفضيلات السمة')}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Customize workspace contrast, color palette, and interface density for optimal readability.', 'تخصيص تباين مساحة العمل، ألوان السمة، وكثافة الواجهة لرؤية ممتازة.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Settings', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setAppearance('light')}
            variant={currentTheme === 'light' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 px-3.5 rounded-xl font-bold transition-all text-xs cursor-pointer shrink-0 ${currentTheme === 'light' ? 'btn-primary' : 'bg-card border-border'}`}
          >
            Light (فاتح)
          </Button>

          <Button
            type="button"
            onClick={() => setAppearance('dark')}
            variant={currentTheme === 'dark' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 px-3.5 rounded-xl font-bold transition-all text-xs cursor-pointer shrink-0 ${currentTheme === 'dark' ? 'btn-primary' : 'bg-card border-border'}`}
          >
            Dark (داكن)
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards Component */}
      <AppearanceKpiCards
        activeTheme={currentTheme}
        activeDensity={prefs?.density || 'comfortable'}
        isLoading={isLoading}
      />

      <div className="space-y-6">
        {/* Theme Selection */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Paintbrush size={16} className="text-primary" />
              <span>{t('Theme Mode', 'وضع السمة')}</span>
            </h2>
            <span className="text-xs text-muted-foreground">{t('Active:', 'النشط:')} <strong className="text-primary capitalize font-mono">{currentTheme}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                id: 'light', 
                label: t('Saudi Emerald (Light)', 'زمردي فاتح'), 
                desc: t('Crisp light workspace with high contrast text', 'مساحة عمل فاتحة بتباين عالٍ'),
                icon: Sun,
                headerColor: 'bg-white border-b border-gray-200',
                sidebarColor: 'bg-[#1b755a]',
                cardColor: 'bg-amber-50/60 border-amber-200/50'
              },
              { 
                id: 'dark', 
                label: t('Saudi Midnight (Dark)', 'منتصف الليل الداكن'), 
                desc: t('Deep dark emerald slate with glowing accents', 'زمردي داكن فخم مع إضاءة ذهبية'),
                icon: Moon,
                headerColor: 'bg-[#11201d] border-b border-[#192f2a]',
                sidebarColor: 'bg-[#081815]',
                cardColor: 'bg-[#11201d] border-[#192f2a]'
              },
              { 
                id: 'system', 
                label: t('System Sync', 'مزامنة الجهاز'), 
                desc: t('Automatically match your operating system theme', 'مطابقة سمة نظام التشغيل تلقائياً'),
                icon: Monitor,
                headerColor: 'bg-gradient-to-r from-white to-[#11201d]',
                sidebarColor: 'bg-gradient-to-b from-[#1b755a] to-[#081815]',
                cardColor: 'bg-muted/40 border-border'
              }
            ].map(theme => {
              const active = currentTheme === theme.id;
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => setAppearance(theme.id as any)}
                  className={`group relative flex flex-col p-5 rounded-2xl border-2 text-start transition-all overflow-hidden cursor-pointer ${
                    active 
                      ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20' 
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  {/* Miniature Visual App Preview Mockup */}
                  <div className="w-full h-24 rounded-xl border border-border/60 overflow-hidden mb-4 shadow-xs flex flex-col pointer-events-none">
                    <div className={`h-6 w-full ${theme.headerColor} flex items-center px-2 justify-between`}>
                      <div className="h-2 w-12 rounded bg-primary/30" />
                      <div className="h-2 w-2 rounded-full bg-accent" />
                    </div>
                    <div className="flex-1 flex min-h-0">
                      <div className={`w-1/3 h-full ${theme.sidebarColor} p-1 space-y-1`}>
                        <div className="h-2 w-full rounded bg-white/30" />
                        <div className="h-2 w-3/4 rounded bg-white/20" />
                        <div className="h-2 w-1/2 rounded bg-white/20" />
                      </div>
                      <div className="flex-1 p-2 space-y-1.5 bg-background">
                        <div className={`h-3 w-full rounded ${theme.cardColor}`} />
                        <div className="h-2 w-4/5 rounded bg-muted" />
                        <div className="h-2 w-2/3 rounded bg-muted/60" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={18} className={active ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-sm font-black text-foreground">{theme.label}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    {theme.desc}
                  </p>

                  {active && (
                    <div className="absolute top-3 end-3 p-1 rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}


