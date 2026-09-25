import { useTranslation, formatCurrency } from '@/lib/utils';
import { User, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface PartyStatementKpiCardsProps {
  partyName: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  currency?: string;
  isLoading?: boolean;
}

export function PartyStatementKpiCards({
  partyName,
  openingBalance,
  totalDebit,
  totalCredit,
  closingBalance,
  currency = 'SAR',
  isLoading,
}: PartyStatementKpiCardsProps) {
  const { t, isRtl } = useTranslation();

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
      {/* Card 1: Account Holder */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Statement Account', 'حساب الكشف')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <User className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-black text-foreground truncate mt-2">{partyName || '-'}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Verified account profile', 'ملف الحساب المسجل')}</div>
      </div>

      {/* Card 2: Total Charges / Debits */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Total Debits (+)', 'إجمالي الخصم/المدين (+)')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          {formatCurrency(totalDebit, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Invoices & debit adjustments', 'إجمالي الفواتير والخصم')}</div>
      </div>

      {/* Card 3: Total Credits / Payments */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Total Credits (-)', 'إجمالي الإضافة/الدائن (-)')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          {formatCurrency(totalCredit, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Payments & receipts credited', 'إجمالي المدفوعات والتحصيلات')}</div>
      </div>

      {/* Card 4: Closing Balance */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Closing Balance', 'الرصيد الختامي')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-2 truncate">
          {formatCurrency(closingBalance, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Current open balance due', 'الرصيد القائم المتبقي')}</div>
      </div>
    </div>
  );
}
