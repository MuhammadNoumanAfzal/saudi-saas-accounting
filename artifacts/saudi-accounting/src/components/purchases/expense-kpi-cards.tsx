import { useTranslation } from '@/lib/utils';
import { CreditCard, Wallet, ShieldCheck } from 'lucide-react';

interface ExpenseKpiCardsProps {
  totalCount: number;
  totalSpent: number;
  totalVat: number;
}

export function ExpenseKpiCards({ totalCount, totalSpent, totalVat }: ExpenseKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Card 1: Total Expense Records */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Records', 'إجمالي المصروفات')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-foreground font-mono mt-2">{totalCount}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Recorded operational expenses', 'سجلات المصروفات المسجلة')}</div>
      </div>

      {/* Card 2: Total Spent (SAR) */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Total Spent', 'إجمالي الإنفاق')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          SAR {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Combined operational expenditure', 'إجمالي النفقات التشغيلية')}</div>
      </div>

      {/* Card 3: Input VAT Recoverable */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Input VAT Recoverable', 'ضريبة المدخلات المستردة')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          SAR {totalVat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Eligible 15% ZATCA VAT recovery', 'ضريبة القيمة المضافة 15% المعتمدة')}</div>
      </div>
    </div>
  );
}
