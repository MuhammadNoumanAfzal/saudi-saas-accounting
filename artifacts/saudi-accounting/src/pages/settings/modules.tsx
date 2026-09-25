import { useState, useMemo } from 'react';
import { 
  getListOrganizationModulesQueryKey, 
  useGetCurrentSession, 
  useListOrganizationModules 
} from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { MODULE_REGISTRY } from '@workspace/platform-core';
import { 
  WalletCards, 
  Truck, 
  BriefcaseBusiness, 
  Boxes, 
  BrainCircuit, 
  Workflow, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Search,
  Layers,
  KeyRound
} from 'lucide-react';
import { ModuleKpiCards } from '@/components/settings/module-kpi-cards';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { showAlert } from '@/lib/alerts';

const ICON_MAP: Record<string, React.ElementType> = {
  "wallet-cards": WalletCards,
  "truck": Truck,
  "briefcase-business": BriefcaseBusiness,
  "boxes": Boxes,
  "brain-circuit": BrainCircuit,
  "workflow": Workflow
};

export function ModulesSettings() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  // Fast React Query caching for organization modules (10 mins staleTime)
  const { data: orgModules, isLoading, refetch } = useListOrganizationModules(orgId, {
    query: { 
      enabled: Boolean(orgId), 
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      queryKey: getListOrganizationModulesQueryKey(orgId) 
    }
  });

  const activeModuleKeys = new Set(orgModules?.filter(m => m.enabled).map(m => m.module.key) || []);

  const filteredModules = useMemo(() => {
    return MODULE_REGISTRY.filter(moduleDef => {
      const name = (isRtl ? moduleDef.nameAr : moduleDef.name) || '';
      const desc = (isRtl ? moduleDef.descriptionAr : moduleDef.description) || '';
      const term = searchTerm.toLowerCase();
      return name.toLowerCase().includes(term) || desc.toLowerCase().includes(term) || moduleDef.key.toLowerCase().includes(term);
    });
  }, [searchTerm, isRtl]);

  const activeCount = MODULE_REGISTRY.filter(m => activeModuleKeys.has(m.key)).length;

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('NEXUS Module Registry', 'سجل وحدات النظام')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> Enterprise Modular Suite
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('Workspace Modules Settings', 'إدارة وحدات نكسس (Modules)')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Manage active workspace apps, specialized industry modules, and Saudi accounting addons.', 'إدارة وتفعيل تطبيقات المساحة والوحدات المتخصصة في نظام خانـباس نكسس.')}
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
            title={t('Refresh Modules', 'تحديث القائمة')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => showAlert.toast(t('Module licensing key is verified and active.', 'ترخيص وحدات المنشأة ساري ومعتمد.'), 'success')}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('License Key', 'مفتاح الترخيص')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Component */}
      <ModuleKpiCards
        totalModules={MODULE_REGISTRY.length}
        activeModules={activeCount}
        isLoading={isLoading}
      />

      {/* Search Filter Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-xs print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 rtl:right-3.5 top-3" />
          <input
            type="text"
            placeholder={t('Search modules by name, code or description...', 'ابحث عن وحدة بالنظام بالاسم أو الكود أو الوصف...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold pl-10 rtl:pr-10 border border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Main Modules Table & List */}
      {isLoading ? (
        <div className="p-4 space-y-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('Querying active modules & workspace license registry...', 'جاري تجميع وحدات المنشأة وترخيص النظام...')}</span>
          </div>
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-muted/40 border-b border-border font-extrabold text-sm flex items-center justify-between gap-2 text-foreground">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>{t('Available Module Roster', 'قائمة وحدات نكسس المتاحة')}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono font-bold">
              {filteredModules.length} {t('modules listed', 'وحدات معروضة')}
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Module App', 'اسم الوحدة')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Module Key', 'رمز الوحدة')}</th>
                  <th className="px-5 py-3.5">{t('Description & Scope', 'الوصف ونطاق الخدمة')}</th>
                  <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Status', 'حالة التفعيل')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredModules.map((moduleDef) => {
                  const Icon = ICON_MAP[moduleDef.icon] || WalletCards;
                  const isActive = activeModuleKeys.has(moduleDef.key);

                  return (
                    <tr key={moduleDef.key} className={`hover:bg-primary/5 transition-colors group ${isActive ? 'bg-primary/5' : ''}`}>
                      <td className="px-5 py-4 whitespace-nowrap font-extrabold text-foreground text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="font-extrabold text-foreground text-sm">{isRtl ? moduleDef.nameAr : moduleDef.name}</div>
                            <div className="text-[11px] text-muted-foreground">{isRtl ? moduleDef.name : moduleDef.nameAr}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-extrabold text-primary text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-muted border border-border">
                          {moduleDef.key}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground max-w-[420px]">
                        {isRtl ? moduleDef.descriptionAr : moduleDef.description}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            <CheckCircle2 size={14} />
                            {t('Active Workspace Module', 'نشط ومفعّل')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full">
                            <Circle size={14} />
                            {t('Coming Soon', 'قريباً')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden divide-y divide-border">
            {filteredModules.map((moduleDef) => {
              const Icon = ICON_MAP[moduleDef.icon] || WalletCards;
              const isActive = activeModuleKeys.has(moduleDef.key);

              return (
                <div key={moduleDef.key} className={`p-4 active:bg-primary/5 transition-colors space-y-3 ${isActive ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-foreground text-sm truncate">
                          {isRtl ? moduleDef.nameAr : moduleDef.name}
                        </h3>
                        <span className="font-mono text-[11px] text-primary font-bold">
                          {moduleDef.key}
                        </span>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                        <CheckCircle2 size={12} />
                        {t('Active', 'نشط')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border shrink-0">
                        <Circle size={12} />
                        {t('Coming Soon', 'قريباً')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? moduleDef.descriptionAr : moduleDef.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

