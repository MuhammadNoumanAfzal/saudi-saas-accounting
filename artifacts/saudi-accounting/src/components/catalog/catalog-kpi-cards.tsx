import { useTranslation } from '@/lib/utils';
import { Package, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

interface CatalogKpiCardsProps {
  totalCount: number;
  productsCount: number;
  servicesCount: number;
  activeCount: number;
}

export function CatalogKpiCards({
  totalCount,
  productsCount,
  servicesCount,
  activeCount,
}: CatalogKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {/* Card 1: Total Items */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Items', 'إجمالي الأصناف')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-foreground font-mono mt-2">{totalCount}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Catalog products & services', 'منتجات وخدمات الكتالوج')}</div>
      </div>

      {/* Card 2: Products */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Products', 'المنتجات')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">{productsCount}</div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Physical inventory items', 'السلع والمنتجات المادية')}</div>
      </div>

      {/* Card 3: Services */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('Services', 'الخدمات')}</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-2">{servicesCount}</div>
        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">{t('Billable professional services', 'الخدمات الاستشارية والمهنية')}</div>
      </div>

      {/* Card 4: Active Items */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Active Items', 'الأصناف النشطة')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{activeCount}</div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Ready for sales & e-invoicing', 'جاهزة للمبيعات والفواتير')}</div>
      </div>
    </div>
  );
}
