import { useTranslation } from '@/lib/utils';
import { Users, Shield, UserCheck, KeyRound } from 'lucide-react';

interface UserKpiCardsProps {
  totalUsers: number;
  adminCount: number;
  activeCount: number;
  isLoading?: boolean;
}

export function UserKpiCards({
  totalUsers,
  adminCount,
  activeCount,
  isLoading,
}: UserKpiCardsProps) {
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
      {/* Card 1: Total Team Seats */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Team Seats', 'إجمالي المستخدمين')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground font-mono mt-2">{totalUsers}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Provisioned workspace accounts', 'حسابات فريق العمل')}</div>
      </div>

      {/* Card 2: Workspace Administrators */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Administrators', 'المسؤولون والمالكون')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{adminCount}</div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Full admin & owner access', 'صلاحيات التحكم الكاملة')}</div>
      </div>

      {/* Card 3: Active Users */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Active Members', 'الأعضاء النشطون')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">{activeCount}</div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Verified email accounts', 'الحسابات الموثقة')}</div>
      </div>

      {/* Card 4: Role-Based Access Control */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('RBAC Engine', 'محرك الصلاحيات')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-2 truncate">
          {t('SOCPA Granular', 'صلاحيات محاسبية دقيقة')}
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Auditor, Accountant & Cashier', 'محاسب، مراجع وأمين صندوق')}</div>
      </div>
    </div>
  );
}
