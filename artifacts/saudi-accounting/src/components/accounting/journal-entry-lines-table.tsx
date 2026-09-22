import { useTranslation, Button } from '@/lib/utils';
import { Plus, Trash2, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

interface JournalLineInput {
  accountId: string;
  debit: string;
  credit: string;
  memo?: string;
}

interface JournalEntryLinesTableProps {
  lines: JournalLineInput[];
  accounts?: Array<{ id: string; code: string; nameArabic: string; nameEnglish: string }>;
  addLineRow: () => void;
  removeLineRow: (index: number) => void;
  updateLineRow: (index: number, field: keyof JournalLineInput, val: any) => void;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  errors: Record<string, string>;
}

export function JournalEntryLinesTable({
  lines,
  accounts = [],
  addLineRow,
  removeLineRow,
  updateLineRow,
  totalDebits,
  totalCredits,
  isBalanced,
  errors
}: JournalEntryLinesTableProps) {
  const { t, isRtl } = useTranslation();

  const diff = Math.abs(totalDebits - totalCredits);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Scale size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t('Double-Entry Account Voucher Lines', 'حركات المدين والدائن')} <span className="text-red-500">*</span></span>
        </h3>
        <Button type="button" variant="secondary" onClick={addLineRow} className="gap-1.5 text-xs py-1.5 px-3">
          <Plus size={14} />
          <span>{t('Add Account Line', 'إضافة حساب')}</span>
        </Button>
      </div>

      {errors.lines && <p className="text-xs font-semibold text-red-500">{errors.lines}</p>}

      <div className="space-y-3">
        {lines.map((line, idx) => (
          <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  {t('Account (SOCPA)', 'الحساب')} <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border ${errors[`line_${idx}_acc`] ? 'border-red-500 bg-red-500/5' : 'border-slate-200 dark:border-slate-700'} rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                  value={line.accountId}
                  onChange={(e) => updateLineRow(idx, 'accountId', e.target.value)}
                >
                  <option value="">-- {t('Select Account', 'اختر الحساب')} --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] — {isRtl ? acc.nameArabic : acc.nameEnglish}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  {t('Debit Amount (SAR)', 'المدين')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={line.debit}
                  onChange={(e) => {
                    updateLineRow(idx, 'debit', e.target.value);
                    if (parseFloat(e.target.value) > 0) updateLineRow(idx, 'credit', '0.00');
                  }}
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  {t('Credit Amount (SAR)', 'الدائن')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={line.credit}
                  onChange={(e) => {
                    updateLineRow(idx, 'credit', e.target.value);
                    if (parseFloat(e.target.value) > 0) updateLineRow(idx, 'debit', '0.00');
                  }}
                />
              </div>

              <div className="md:col-span-1 flex justify-end pt-4">
                <button
                  type="button"
                  disabled={lines.length <= 2}
                  onClick={() => removeLineRow(idx)}
                  className="text-muted-foreground hover:text-rose-600 disabled:opacity-30 p-1.5 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Double-Entry Balance Calculation Summary Bar */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'}`}>
        <div className="flex items-center gap-2 text-xs font-bold">
          {isBalanced ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('Double-entry balanced perfectly! Total Debit equals Credit.', 'القيد متوازن 100%! إجمالي المدين يساوي إجمالي الدائن.')}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <span>{t(`Unbalanced voucher! Difference: ${diff.toFixed(2)} SAR`, `القيد غير متوازن! الفرق: ${diff.toFixed(2)} ر.س`)}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <div>Debit: <span className="text-emerald-600 dark:text-emerald-400">{totalDebits.toFixed(2)}</span> SAR</div>
          <div>Credit: <span className="text-blue-600 dark:text-blue-400">{totalCredits.toFixed(2)}</span> SAR</div>
        </div>
      </div>
    </div>
  );
}
