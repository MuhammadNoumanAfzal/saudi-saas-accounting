import { useTranslation } from '@/lib/utils';
import { Landmark, Wallet, ShieldAlert, PieChart, Sparkles } from 'lucide-react';
import type { Account } from '@workspace/api-client-react';

interface AccountKpiCardsProps {
  accounts: Account[];
  isLoading?: boolean;
}

export function AccountKpiCards({ accounts, isLoading }: AccountKpiCardsProps) {
  const { t } = useTranslation();

  const totalCount = accounts.length;
  const assetCount = accounts.filter(a => a.type === 'ASSET').length;
  const liabilityEquityCount = accounts.filter(a => a.type === 'LIABILITY' || a.type === 'EQUITY').length;
  const revenueExpenseCount = accounts.filter(a => a.type === 'REVENUE' || a.type === 'EXPENSE').length;

  const cards = [
    {
      title: t('Total Accounts', 'إجمالي الحسابات'),
      count: totalCount,
      subtitle: t('SOCPA general ledger items', 'عناصر الدليل المعتمدة'),
      icon: Landmark,
      color: 'from-emerald-500/10 via-emerald-500/5 to-transparent text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: t('Asset Accounts', 'حسابات الأصول'),
      count: assetCount,
      subtitle: t('Cash, bank & receivables', 'النقدية والبنك والعملاء'),
      icon: Wallet,
      color: 'from-blue-500/10 via-blue-500/5 to-transparent text-blue-600 dark:text-blue-400 border-blue-500/20',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      title: t('Liabilities & Equity', 'الالتزامات وحقوق الملكية'),
      count: liabilityEquityCount,
      subtitle: t('Payables, VAT & capital', 'الموردون والضريبة ورأس المال'),
      icon: ShieldAlert,
      color: 'from-purple-500/10 via-purple-500/5 to-transparent text-purple-600 dark:text-purple-400 border-purple-500/20',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      title: t('Revenue & Expenses', 'الإيرادات والمصروفات'),
      count: revenueExpenseCount,
      subtitle: t('Income statement accounts', 'حسابات قائمة الدخل'),
      icon: PieChart,
      color: 'from-amber-500/10 via-amber-500/5 to-transparent text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} border shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.badgeBg} group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground font-mono">
                {card.count}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate">
                {card.subtitle}
              </span>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Sparkles size={80} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
