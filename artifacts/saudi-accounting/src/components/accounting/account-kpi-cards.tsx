import { useTranslation } from '@/lib/utils';
import { Landmark, Wallet, ShieldAlert, PieChart } from 'lucide-react';
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
      {/* Card 1: Total Accounts */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Accounts', 'إجمالي الحسابات')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-foreground font-mono mt-2">{totalCount}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('SOCPA general ledger items', 'عناصر الدليل المعتمدة')}</div>
      </div>

      {/* Card 2: Asset Accounts */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Asset Accounts', 'حسابات الأصول')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{assetCount}</div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Cash, bank & receivables', 'النقدية والبنك والعملاء')}</div>
      </div>

      {/* Card 3: Liabilities & Equity */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Liabilities & Equity', 'الالتزامات وحقوق الملكية')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono mt-2">{liabilityEquityCount}</div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Payables, VAT & capital', 'الموردون والضريبة ورأس المال')}</div>
      </div>

      {/* Card 4: Revenue & Expenses */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('Revenue & Expenses', 'الإيرادات والمصروفات')}</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-2">{revenueExpenseCount}</div>
        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">{t('Income statement accounts', 'حسابات قائمة الدخل')}</div>
      </div>
    </div>
  );
}
