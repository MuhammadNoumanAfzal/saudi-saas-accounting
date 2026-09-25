import { useTranslation } from '@/lib/utils';
import { Store, Building2, MapPin, Radio } from 'lucide-react';

interface BranchKpiCardsProps {
  totalBranches: number;
  activeBranches: number;
  hqCity: string;
  isLoading?: boolean;
}

export function BranchKpiCards({
  totalBranches,
  activeBranches,
  hqCity,
  isLoading,
}: BranchKpiCardsProps) {
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
      {/* Card 1: Registered Branches */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Locations', 'إجمالي الفروع')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Store className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground font-mono mt-2">{totalBranches}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Commercial locations', 'المواقع التجارية')}</div>
      </div>

      {/* Card 2: Main HQ Branch */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Headquarters HQ', 'الفرع الرئيسي')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
          {hqCity || 'Riyadh HQ (الرياض)'}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Primary accounting entity', 'مركز الإدارة الرئيسي')}</div>
      </div>

      {/* Card 3: Active Operating Status */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Active Branches', 'فروع تعمل')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">{activeBranches}</div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Real-time inventory sync', 'ربط فوري للمخزون والتقارير')}</div>
      </div>

      {/* Card 4: POS & Regional Registration */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('POS Sync', 'نقاط البيع والمواقع')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-2 truncate">
          {t('ZATCA Ready', 'جاهز للربط بالفرع')}
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Individual branch VAT codes', 'أكواد الفواتير المستقلة')}</div>
      </div>
    </div>
  );
}
