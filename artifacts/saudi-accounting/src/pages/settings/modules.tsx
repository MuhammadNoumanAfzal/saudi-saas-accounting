import { getListOrganizationModulesQueryKey, useGetCurrentSession, useListOrganizationModules } from '@workspace/api-client-react';
import { useTranslation } from '@/lib/utils';
import { MODULE_REGISTRY } from '@workspace/platform-core';
import { WalletCards, Truck, BriefcaseBusiness, Boxes, BrainCircuit, Workflow, CheckCircle2, Circle } from 'lucide-react';

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
  
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const { data: orgModules } = useListOrganizationModules(orgId, {
    query: { enabled: !!orgId, queryKey: getListOrganizationModulesQueryKey(orgId) }
  });

  const activeModuleKeys = new Set(orgModules?.filter(m => m.enabled).map(m => m.module.key) || []);

  return (
    <div className="max-w-[1000px] space-y-8 fade-up pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Modules', 'الوحدات')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Manage your active KHANBAS NEXUS modules.', 'إدارة وحدات خانـباس نكسس النشطة الخاصة بك.')}
        </p>
      </div>

      <div className="space-y-4">
        {MODULE_REGISTRY.map(moduleDef => {
          const Icon = ICON_MAP[moduleDef.icon] || WalletCards;
          const isActive = activeModuleKeys.has(moduleDef.key);

          return (
            <div key={moduleDef.key} className={`soft-card p-5 flex items-center justify-between transition-colors ${isActive ? 'border-primary/20 bg-primary/5' : 'bg-card'}`}>
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    {isRtl ? moduleDef.nameAr : moduleDef.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[400px]">
                    {isRtl ? moduleDef.descriptionAr : moduleDef.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isActive ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={14} />
                    {t('Active', 'نشط')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <Circle size={14} />
                    {t('Coming Soon', 'قريباً')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
