import { useTranslation, formatCurrency } from '@/lib/utils';

export interface PurchasesKpiCardData {
  titleEn: string;
  titleAr: string;
  value: string | number;
  isCurrency?: boolean;
  colorClass?: string;
}

interface PurchasesKpiSummaryCardsProps {
  cards: PurchasesKpiCardData[];
}

export function PurchasesKpiSummaryCards({ cards }: PurchasesKpiSummaryCardsProps) {
  const { isRtl } = useTranslation();

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:border-indigo-500/30">
          <span className={`text-xs font-medium block mb-1 ${card.colorClass || 'text-slate-500 dark:text-slate-400'}`}>
            {isRtl ? card.titleAr : card.titleEn}
          </span>
          <div className={`text-2xl font-bold ${card.colorClass || 'text-slate-900 dark:text-slate-100'}`}>
            {card.isCurrency && typeof card.value === 'number' ? (
              <>
                {formatCurrency(card.value, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </>
            ) : (
              card.value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
