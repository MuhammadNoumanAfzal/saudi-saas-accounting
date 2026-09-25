import { useTranslation } from '@/lib/utils';
import type { TrialBalanceItem } from '@workspace/api-client-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { FileSpreadsheet, Tag } from 'lucide-react';

interface TrialBalanceTableProps {
  items: TrialBalanceItem[];
  totalDebit: string;
  totalCredit: string;
  isLoading: boolean;
}

export function TrialBalanceTable({
  items,
  totalDebit,
  totalCredit,
  isLoading,
}: TrialBalanceTableProps) {
  const { t, isRtl } = useTranslation();

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ASSET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'أصول' : 'Asset'}</span>
          </span>
        );
      case 'LIABILITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'التزامات' : 'Liability'}</span>
          </span>
        );
      case 'EQUITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'حقوق ملكية' : 'Equity'}</span>
          </span>
        );
      case 'REVENUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'إيرادات' : 'Revenue'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'مصروفات' : 'Expense'}</span>
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{t('Calculating & balancing SOCPA Trial Balance ledger accounts...', 'جاري احتساب وموازنة أرصدة ميزان المراجعة (SOCPA)...')}</span>
        </div>
        <SkeletonTable rows={7} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
          <FileSpreadsheet size={28} />
        </div>
        <h3 className="text-lg font-black mb-1">{t('No matching accounts found', 'لم يتم العثور على حسابات مطابقة')}</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
          {t('Try searching with a different keyword or resetting filter options.', 'جرب البحث بكلمة أخرى أو تعديل الفلاتر المحددة.')}
        </p>
      </div>
    );
  }

  const debitNum = parseFloat(totalDebit) || 0;
  const creditNum = parseFloat(totalCredit) || 0;

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left rtl:text-right border-collapse">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Code', 'رمز الحساب')}</th>
              <th className="px-5 py-3.5">{t('Account Name', 'اسم الحساب المحاسبي')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Type', 'نوع الحساب')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Total Debit', 'حركة المدين')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Total Credit', 'حركة الدائن')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Net Balance', 'الرصيد الصافي')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {items.map((item) => {
              const d = parseFloat(item.debit) || 0;
              const c = parseFloat(item.credit) || 0;
              const net = parseFloat(item.netBalance) || 0;
              return (
                <tr key={item.accountId} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-primary text-xs font-mono font-extrabold border border-border group-hover:border-primary/40 whitespace-nowrap">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-extrabold text-foreground text-sm">{item.nameArabic}</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">{item.nameEnglish}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {getTypeBadge(item.type)}
                  </td>
                  <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                    {d > 0 ? `SAR ${d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs whitespace-nowrap">
                    {c > 0 ? `SAR ${c.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-right rtl:text-left font-mono font-black text-foreground text-xs whitespace-nowrap">
                    SAR {net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/60 border-t-2 border-border text-foreground font-bold">
            <tr>
              <td colSpan={3} className="px-5 py-4 text-sm font-black uppercase">
                {t('Grand Total Trial Balance', 'المجموع الإجمالي لميزان المراجعة')}
              </td>
              <td className="px-5 py-4 text-right rtl:text-left font-mono text-emerald-600 dark:text-emerald-400 text-sm font-black whitespace-nowrap">
                SAR {debitNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-5 py-4 text-right rtl:text-left font-mono text-blue-600 dark:text-blue-400 text-sm font-black whitespace-nowrap">
                SAR {creditNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-5 py-4 text-right rtl:text-left font-mono text-primary text-sm font-black whitespace-nowrap">
                SAR 0.00
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="md:hidden divide-y divide-border">
        {items.map((item) => {
          const d = parseFloat(item.debit) || 0;
          const c = parseFloat(item.credit) || 0;
          const net = parseFloat(item.netBalance) || 0;
          return (
            <div key={item.accountId} className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-foreground text-sm truncate">{item.nameArabic}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.nameEnglish}</div>
                  <div className="text-xs text-muted-foreground mt-1.5 flex gap-2 items-center flex-wrap">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary whitespace-nowrap">
                      {item.code}
                    </span>
                    {getTypeBadge(item.type)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Debit', 'مدين')}</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] mt-0.5">
                    {d > 0 ? `SAR ${d.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Credit', 'دائن')}</div>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] mt-0.5">
                    {c > 0 ? `SAR ${c.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div className="text-right rtl:text-left">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Net', 'الصافي')}</div>
                  <div className="font-mono font-black text-foreground text-xs mt-0.5">
                    SAR {net.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
