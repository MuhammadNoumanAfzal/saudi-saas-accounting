import { getListOrganizationModulesQueryKey, useGetCurrentSession, useListOrganizationModules } from '@workspace/api-client-react';
import { useTranslation } from '@/lib/utils';
import { Link } from 'wouter';
import { MODULE_REGISTRY } from '@workspace/platform-core';
import { Building2, ArrowRight, ArrowLeft, WalletCards, Truck, BriefcaseBusiness, Boxes, BrainCircuit, Workflow, LockKeyhole } from 'lucide-react';
import { ExecutiveDashboard } from '@/components/dashboard/executive-dashboard';

const ICON_MAP: Record<string, React.ElementType> = {
  "wallet-cards": WalletCards,
  "truck": Truck,
  "briefcase-business": BriefcaseBusiness,
  "boxes": Boxes,
  "brain-circuit": BrainCircuit,
  "workflow": Workflow
};

export function NexusHome() {
  const { data: session, isLoading: sessionLoading } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  const organization = session?.organizations?.find(o => o?.organization?.id === orgId)?.organization;

  const { data: orgModules, isLoading: modulesLoading } = useListOrganizationModules(orgId, {
    query: { enabled: !!orgId, queryKey: getListOrganizationModulesQueryKey(orgId) }
  });

  const currentDate = new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-SA', { 
    dateStyle: 'long', 
    timeZone: 'Asia/Riyadh' 
  }).format(new Date());

  const riyadhHour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'Asia/Riyadh',
    }).format(new Date()),
  );
  
  const greeting =
    riyadhHour < 12
      ? t('Good morning', 'صباح الخير')
      : riyadhHour < 18
        ? t('Good afternoon', 'مساء الخير')
        : t('Good evening', 'مساء الخير');

  if (sessionLoading || modulesLoading) {
    return (
      <div className="space-y-8 p-4 md:p-8">
        <div className="space-y-3">
          <div className="shimmer h-4 w-32 rounded" />
          <div className="shimmer h-10 w-64 rounded" />
        </div>
      </div>
    );
  }

  const activeModuleKeys = new Set(orgModules?.filter(m => m.enabled).map(m => m.module.key) || []);

  return (
    <div className="space-y-8 fade-up pb-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-primary text-xs font-bold uppercase tracking-wider mb-2">
            KHANBAS NEXUS
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
             {greeting}, {isRtl ? (organization?.legalNameArabic || organization?.legalNameEnglish) : organization?.legalNameEnglish}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
             {t("Welcome to your connected business platform.", 'مرحباً بك في منصة أعمالك المترابطة.')}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm flex items-center gap-3">
            <Building2 size={16} />
            <span>{t('Nexus Core Active', 'نكسس كور نشط')}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MODULE_REGISTRY.map(moduleDef => {
          const Icon = ICON_MAP[moduleDef.icon] || WalletCards;
          const isActive = activeModuleKeys.has(moduleDef.key);
          
          if (isActive) {
            return (
              <Link key={moduleDef.key} href={moduleDef.route} className="soft-card p-6 flex flex-col items-start transition-all hover:-translate-y-1 hover:border-primary/40 group cursor-pointer h-full">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{isRtl ? moduleDef.nameAr : moduleDef.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground flex-1">
                  {isRtl ? moduleDef.descriptionAr : moduleDef.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary">
                  {t('Open Module', 'فتح الوحدة')}
                  {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </div>
              </Link>
            );
          }

          return (
            <div key={moduleDef.key} className="soft-card p-6 flex flex-col items-start bg-card/50 border-dashed opacity-80 h-full">
              <div className="flex items-center justify-between w-full mb-5">
                <div className="h-12 w-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded-md">
                  {t('Coming Soon', 'قريباً')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">{isRtl ? moduleDef.nameAr : moduleDef.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground flex-1">
                {isRtl ? moduleDef.descriptionAr : moduleDef.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <LockKeyhole size={14} />
                {t('Not Available', 'غير متاح')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t">
        <ExecutiveDashboard />
      </div>
    </div>
  );
}
