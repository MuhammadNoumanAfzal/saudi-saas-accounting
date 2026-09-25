import { useTranslation, formatCurrency } from '@/lib/utils';
import { ShieldCheck, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';

interface ZatcaVatKpiCardsProps {
  totalSalesTaxable: number;
  totalOutputVat: number;
  totalPurchasesTaxable: number;
  totalInputVat: number;
  netVatPayable: number;
  isRefundable: boolean;
  isLoading?: boolean;
}

export function ZatcaVatKpiCards({
  totalSalesTaxable,
  totalOutputVat,
  totalPurchasesTaxable,
  totalInputVat,
  netVatPayable,
  isRefundable,
  isLoading,
}: ZatcaVatKpiCardsProps) {
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
      {/* Card 1: Net VAT Position */}
      <div className={`p-4 rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group ${
        isRefundable ? 'hover:border-emerald-500/40' : 'hover:border-amber-500/40'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isRefundable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {isRefundable ? t('Net Refund Credit', 'الرصيد المسترد') : t('Net Tax Payable', 'الضريبة المستحقة')}
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            isRefundable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}>
            {isRefundable ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
          </div>
        </div>
        <div className={`text-2xl font-black font-mono mt-2 truncate ${isRefundable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {formatCurrency(netVatPayable, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className={`text-[11px] font-semibold mt-1 ${isRefundable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {isRefundable ? t('ZATCA tax refund due', 'استرداد ضريبي لصالح المنشأة') : t('Due to ZATCA by declaration deadline', 'مبلغ واجب السداد للهيئة')}
        </div>
      </div>

      {/* Card 2: Output VAT (Sales) */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Output VAT (15%)', 'ضريبة المخرجات')}</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          {formatCurrency(totalOutputVat, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
          {t('Taxable Sales:', 'المبيعات الخاضعة:')} {formatCurrency(totalSalesTaxable, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
      </div>

      {/* Card 3: Input VAT (Purchases) */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Input VAT (15%)', 'ضريبة المدخلات')}</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          {formatCurrency(totalInputVat, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
          {t('Taxable Purchases:', 'المشتريات الخاضعة:')} {formatCurrency(totalPurchasesTaxable, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
        </div>
      </div>

      {/* Card 4: Tax Period Status */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Tax Period Status', 'حالة الفترة الضريبية')}</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-black text-foreground font-mono mt-2">{t('ZATCA Form 21', 'نموذج ٢١')}</div>
        <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('15% Standard GAZT Rate Verified', 'خاضع لضريبة القيمة المضافة 15%')}</div>
      </div>
    </div>
  );
}
