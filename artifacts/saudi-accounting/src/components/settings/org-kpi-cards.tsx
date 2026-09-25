import { useTranslation } from '@/lib/utils';
import { Building2, ShieldCheck, MapPin, Landmark } from 'lucide-react';

interface OrgKpiCardsProps {
  legalName: string;
  vatNumber: string;
  city: string;
  currency: string;
  isLoading?: boolean;
}

export function OrgKpiCards({
  legalName,
  vatNumber,
  city,
  currency = 'SAR',
  isLoading,
}: OrgKpiCardsProps) {
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
      {/* Card 1: Registered Organization Identity */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Legal Entity', 'الكيان القانوني')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-foreground truncate mt-2">{legalName || 'Nouran Tech LLC'}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Verified Commercial Identity', 'هوية تجارية معتمدة')}</div>
      </div>

      {/* Card 2: ZATCA & VAT Tax Status */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('VAT Registration', 'التسجيل الضريبي')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          {vatNumber || '300000000000003'}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('15% ZATCA Active Status', 'تفعيل الزكاة والضريبة 15%')}</div>
      </div>

      {/* Card 3: National Address HQ */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Regional HQ', 'المقر الرئيسي')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-2 truncate">
          {city || 'Riyadh, KSA'}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Verified National Address', 'العنوان الوطني المسجل')}</div>
      </div>

      {/* Card 4: Accounting Standard & Currency */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Fiscal Currency', 'العملة والمعيار')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono mt-2 truncate">
          {currency} (SOCPA)
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Saudi GAAP Standards', 'معايير المحاسبة السعودية')}</div>
      </div>
    </div>
  );
}
