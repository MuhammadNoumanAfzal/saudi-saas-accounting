import { useGetCurrentSession, useUpdateUserPreferences, getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useTranslation } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';
import { Moon, Sun, Monitor, Type, LayoutGrid, CheckCircle2, Sparkles, Paintbrush, Palette } from 'lucide-react';

export function AppearanceSettings() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const update = useUpdateUserPreferences();

  const prefs = session?.preferences;

  const setAppearance = (appearance: 'light' | 'dark' | 'system') => {
    // Apply immediate class toggle for instant feedback
    if (appearance === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    update.mutate({ data: { appearance } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
        showAlert.toast(
          appearance === 'dark' 
            ? t('Dark theme enabled.', 'تم تفعيل السمة الداكنة.') 
            : appearance === 'light' 
              ? t('Light theme enabled.', 'تم تفعيل السمة الفاتحة.')
              : t('System theme synced.', 'تم المزامنة مع سمة النظام.')
        );
      }
    });
  };

  const setDensity = (density: 'compact' | 'comfortable') => {
    update.mutate({ data: { density } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
        showAlert.toast(t('Interface density updated.', 'تم تحديث كثافة الواجهة.'));
      }
    });
  };

  return (
    <div className="max-w-[1000px] space-y-8 fade-up pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Palette className="w-6 h-6 text-primary" />
          <span>{t('Appearance & Personalization', 'المظهر وتفضيلات السمة')}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Customize workspace contrast, color palette, and interface density for optimal readability.', 'تخصيص تباين مساحة العمل، ألوان السمة، وكثافة الواجهة لرؤية ممتازة.')}
        </p>
      </div>

      <div className="space-y-8">
        {/* Theme Selection */}
        <div className="soft-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Paintbrush size={16} className="text-primary" />
              <span>{t('Theme Mode', 'وضع السمة')}</span>
            </h2>
            <span className="text-xs text-muted-foreground">{t('Active:', 'النشط:')} <strong className="text-primary capitalize">{prefs?.appearance || 'light'}</strong></span>
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
              const active = (prefs?.appearance || 'light') === theme.id;
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => setAppearance(theme.id as any)}
                  className={`group relative flex flex-col p-5 rounded-2xl border-2 text-start transition-all overflow-hidden ${
                    active 
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                      : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  {/* Miniature Visual App Preview Mockup */}
                  <div className="w-full h-24 rounded-xl border border-border/60 overflow-hidden mb-4 shadow-sm flex flex-col pointer-events-none">
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
                    <span className="text-sm font-bold text-foreground">{theme.label}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
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

        {/* Layout Density */}
        <div className="soft-card p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <LayoutGrid size={16} className="text-primary" />
              <span>{t('Interface Density', 'كثافة الواجهة')}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('Choose spacing density for data tables, lists, and form elements.', 'اختر كثافة المسافات للجداول المادية، القوائم، وعناصر الإدخال.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { 
                id: 'compact', 
                label: t('Compact Mode', 'وضع مضغوط'), 
                desc: t('Tighter padding optimized for financial statements and audit entry.', 'مسافات دقيقة ممتازة لتحليل القوائم المالية وإدخال القيود.'),
                icon: LayoutGrid 
              },
              { 
                id: 'comfortable', 
                label: t('Comfortable Mode', 'وضع مريح'), 
                desc: t('Spacious visual flow with generous element breathing room.', 'تصميم مريح مع مسافات واسعة بين العناصر للقراءة المريحة.'),
                icon: Type 
              }
            ].map(density => {
              const active = (prefs?.density || 'comfortable') === density.id;
              const Icon = density.icon;
              return (
                <button
                  key={density.id}
                  onClick={() => setDensity(density.id as any)}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${
                    active 
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                      : 'border-border/70 bg-card hover:border-primary/40'
                  } ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${active ? 'text-primary' : 'text-foreground'}`}>{density.label}</span>
                      {active && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{density.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saudi Accounting Platform Theme Features Card */}
        <div className="soft-card p-6 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-primary/15 text-primary shrink-0 mt-0.5">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground mb-1">
              {t('SOCPA & ZATCA High-Contrast Compliance', 'توافق التباين العالي مع المعايير السعودية')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('Both Light and Dark themes maintain strict WCAG AAA contrast ratios for all financial tables, GL voucher numbers, and ZATCA QR code displays.', 'تلتزم كلتا السمتين الفاتحة والداكنة بمعايير التباين العالي المعتمَدة لعرض الجداول المالية، أرقام القيود، ورموز الاستجابة السريعة.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

