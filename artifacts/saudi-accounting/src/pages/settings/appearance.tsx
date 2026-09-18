import { useGetCurrentSession, useUpdateUserPreferences, getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { Moon, Sun, Monitor, Type, LayoutGrid, CheckCircle2 } from 'lucide-react';

export function AppearanceSettings() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const update = useUpdateUserPreferences();

  const prefs = session?.preferences;

  const setAppearance = (appearance: 'light' | 'dark' | 'system') => {
    update.mutate({ data: { appearance } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() })
    });
  };

  const setDensity = (density: 'compact' | 'comfortable') => {
    update.mutate({ data: { density } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() })
    });
  };

  return (
    <div className="max-w-[800px] space-y-8 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Appearance', 'المظهر')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Customize how the workspace looks and feels on this device.', 'تخصيص شكل ومظهر مساحة العمل على هذا الجهاز.')}</p>
      </div>

      <div className="space-y-8">
        <div className="soft-card p-6">
          <h2 className="text-sm font-bold mb-4">{t('Theme', 'السمة')}</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light', label: t('Light', 'فاتح'), icon: Sun },
              { id: 'dark', label: t('Dark', 'داكن'), icon: Moon },
              { id: 'system', label: t('System', 'النظام'), icon: Monitor }
            ].map(theme => {
              const active = prefs?.appearance === theme.id;
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => setAppearance(theme.id as any)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
                >
                  <Icon size={24} className={`mb-3 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{theme.label}</span>
                  {active && <CheckCircle2 size={14} className="text-primary absolute mt-14" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="soft-card p-6">
          <h2 className="text-sm font-bold mb-4">{t('Density', 'الكثافة')}</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'compact', label: t('Compact', 'مضغوط'), desc: t('More data on screen', 'بيانات أكثر على الشاشة'), icon: LayoutGrid },
              { id: 'comfortable', label: t('Comfortable', 'مريح'), desc: t('More space between elements', 'مساحة أكبر بين العناصر'), icon: Type }
            ].map(density => {
              const active = prefs?.density === density.id;
              const Icon = density.icon;
              return (
                <button
                  key={density.id}
                  onClick={() => setDensity(density.id as any)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'} ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <div className={`p-2 rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className={`text-sm font-bold mb-1 ${active ? 'text-primary' : 'text-foreground'}`}>{density.label}</div>
                    <div className="text-xs text-muted-foreground">{density.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
