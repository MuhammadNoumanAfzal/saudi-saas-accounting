import { useTranslation } from '@/lib/utils';
import { FileText, Clock, CheckCircle2, Wallet } from 'lucide-react';

interface BillKpiCardsProps {
  total: number;
  received: number;
  paid: number;
  totalValue: number;
}

export function BillKpiCards({ total, received, paid, totalValue }: BillKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {/* Card 1: Total Bills */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Bills', 'إجمالي الفواتير')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-foreground font-mono mt-2">{total}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Recorded vendor bills', 'فواتير الموردين المسجلة')}</div>
      </div>

      {/* Card 2: Received & Due */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Received & Due', 'مستلمة ومستحقة')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">{received}</div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Pending payment to vendors', 'في انتظار السداد للموردين')}</div>
      </div>

      {/* Card 3: Paid Bills */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Paid Bills', 'الفواتير المدفوعة')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{paid}</div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Settled vendor accounts', 'حسابات الموردين المصفاة')}</div>
      </div>

      {/* Card 4: Total Volume */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Volume', 'القيمة الإجمالية')}</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground font-mono mt-2 truncate">
          SAR {totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Combined vendor purchases', 'إجمالي مشتريات الموردين')}</div>
      </div>
    </div>
  );
}
