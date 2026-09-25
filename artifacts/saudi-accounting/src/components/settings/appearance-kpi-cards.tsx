import { useTranslation } from '@/lib/utils';
import { Palette, Sun, LayoutGrid, Sparkles } from 'lucide-react';

interface AppearanceKpiCardsProps {
  activeTheme: string;
  activeDensity: string;
  isLoading?: boolean;
}

export function AppearanceKpiCards({
  activeTheme,
  activeDensity,
  isLoading,
}: AppearanceKpiCardsProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
      {/* Card 1: Active Workspace Palette */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Color Palette', 'لون السمة')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Palette className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-foreground mt-2 truncate">{t('Saudi Emerald Theme', 'الزمردي السعودي')}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('#176752 Primary Accent', 'لون الهوية الرقمية 176752#')}</div>
      </div>

      {/* Card 2: Active Mode */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Theme Mode', 'وضع العرض')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 capitalize mt-2 truncate">
          {activeTheme || 'Light (فاتح)'}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Real-time preference sync', 'مزامنة السمة الفورية')}</div>
      </div>

      {/* Card 3: Layout Spacing Density */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('UI Density', 'كثافة المسافات')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <LayoutGrid className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-blue-600 dark:text-blue-400 capitalize mt-2 truncate">
          {activeDensity || 'Comfortable (مريح)'}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Financial table spacing', 'مسافات الجداول المحاسبية')}</div>
      </div>

      {/* Card 4: High Contrast Compliance */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Accessibility', 'التباين المعتمد')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-2 truncate">
          WCAG AAA Compliant
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('High contrast data tables', 'تباين عالي للوضوح')}</div>
      </div>
    </div>
  );
}
