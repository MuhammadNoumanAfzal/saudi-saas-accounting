import { useTranslation } from '@/lib/utils';
import { Layers, CheckCircle2, Shield, Sparkles } from 'lucide-react';

interface ModuleKpiCardsProps {
  totalModules: number;
  activeModules: number;
  isLoading?: boolean;
}

export function ModuleKpiCards({
  totalModules,
  activeModules,
  isLoading,
}: ModuleKpiCardsProps) {
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

  const upcomingModules = totalModules - activeModules;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
      {/* Card 1: Total Platform Modules */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Platform Modules', 'إجمالي الوحدات')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground font-mono mt-2">{totalModules}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('NEXUS Enterprise Architecture', 'معمارية نظام نكسس')}</div>
      </div>

      {/* Card 2: Active Workspace Modules */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Active Modules', 'الوحدات المفعّلة')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{activeModules}</div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Enabled & Online Suite', 'باقة الخدمات مفعّلة')}</div>
      </div>

      {/* Card 3: Upcoming Expansion Modules */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Planned Add-ons', 'الوحدات القادمة')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">{upcomingModules}</div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Fleet, Projects & Assets', 'الأسطول، المشاريع والأصول')}</div>
      </div>

      {/* Card 4: ZATCA Phase 2 Readiness */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('ZATCA Readiness', 'الجاهزية والربط')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-2 truncate">
          {t('Phase 2 Compliant', 'المرحلة الثانية مفعّلة')}
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Fatoora B2B & B2C Certified', 'اعتماد نظام الفوترة')}</div>
      </div>
    </div>
  );
}
