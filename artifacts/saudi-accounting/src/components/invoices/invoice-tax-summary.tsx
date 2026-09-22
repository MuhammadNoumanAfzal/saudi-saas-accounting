import { useTranslation, formatCurrency } from '@/lib/utils';
import { Calculator } from 'lucide-react';

interface InvoiceTaxSummaryProps {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export function InvoiceTaxSummary({ subtotal, taxAmount, totalAmount }: InvoiceTaxSummaryProps) {
  const { t, isRtl } = useTranslation();

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800">
        <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>{t('Tax & Payment Summary', 'ملخص الضريبة والإجمالي')}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>{t('Subtotal (Excl. VAT):', 'المجموع الفرعي (غير شامل الضريبة):')}</span>
          <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(subtotal, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
          </span>
        </div>

        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
          <span>{t('ZATCA VAT (15%):', 'ضريبة القيمة المضافة (15%):')}</span>
          <span className="font-mono">
            {formatCurrency(taxAmount, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base font-bold text-slate-900 dark:text-slate-100">
          <span>{t('Grand Total (Incl. VAT):', 'المبلغ الإجمالي النهائي:')}</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalAmount, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
          </span>
        </div>
      </div>
    </div>
  );
}
