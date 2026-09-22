import { useTranslation, formatCurrency } from '@/lib/utils';

export interface SalesKpiCardData {
  titleEn: string;
  titleAr: string;
  value: string | number;
  isCurrency?: boolean;
  colorClass?: string;
}

interface SalesKpiSummaryCardsProps {
  cards: SalesKpiCardData[];
}

export function SalesKpiSummaryCards({ cards }: SalesKpiSummaryCardsProps) {
  const { isRtl } = useTranslation();

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <div key={idx} className="soft-card p-4 transition-all hover:border-emerald-500/30">
          <div className="text-xs font-semibold text-muted-foreground mb-1">
            {isRtl ? card.titleAr : card.titleEn}
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${card.colorClass || 'text-foreground'}`}>
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
