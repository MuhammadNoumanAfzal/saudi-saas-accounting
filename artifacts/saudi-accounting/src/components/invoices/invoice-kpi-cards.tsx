import { useTranslation, formatCurrency } from '@/lib/utils';
import { Receipt, Clock, CheckCircle2, Wallet } from 'lucide-react';

interface InvoiceKpiCardsProps {
  total: number;
  issued: number;
  paid: number;
  totalValue: number;
  currency?: string;
  isLoading?: boolean;
}

export function InvoiceKpiCards({ 
  total, 
  issued, 
  paid, 
  totalValue,
  currency = 'SAR',
  isLoading 
}: InvoiceKpiCardsProps) {
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
      {/* Card 1: Total Invoices */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Invoices', 'إجمالي الفواتير')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground font-mono mt-2">{total}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Issued & recorded invoices', 'الفواتير المسجلة والمصدورة')}</div>
      </div>

      {/* Card 2: Issued / Outstanding */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Issued / Pending', 'صادرة / معلقة')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">{issued}</div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Awaiting client payment', 'في انتظار التحصيل')}</div>
      </div>

      {/* Card 3: Paid Invoices */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Paid Invoices', 'المسددة')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{paid}</div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Fully settled & reconciled', 'تم التحصيل بالكامل')}</div>
      </div>

      {/* Card 4: Total Billed Value */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Total Billed Value', 'القيمة الإجمالية')}</span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-2 truncate">
          {formatCurrency(totalValue, currency, isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold">{t('Combined invoice revenue', 'إجمالي قيمة الفواتير')}</div>
      </div>
    </div>
  );
}

