import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListAccounts,
  getListAccountsQueryKey,
  useCreateJournalEntry
} from '@workspace/api-client-react';
import { X, Plus, Trash2, FileSpreadsheet, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';

import { showAlert } from '@/lib/alerts';

interface JournalEntryCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface LineRow {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export function JournalEntryCreateSheet({ open, onOpenChange, onSuccess }: JournalEntryCreateSheetProps) {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: accountsData } = useListAccounts(orgId, {} as any, { 
    query: { enabled: !!orgId && open, queryKey: getListAccountsQueryKey(orgId, {} as any) } 
  });
  const accounts = accountsData?.items || [];

  const createMutation = useCreateJournalEntry();

  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [entryDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<LineRow[]>([
    { accountId: '', description: '', debit: 0, credit: 0 },
    { accountId: '', description: '', debit: 0, credit: 0 }
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (accounts.length >= 2 && (!lines[0].accountId || !lines[1].accountId)) {
      setLines([
        { accountId: accounts[0].id, description: '', debit: 0, credit: 0 },
        { accountId: accounts[1].id, description: '', debit: 0, credit: 0 }
      ]);
    }
  }, [accounts]);

  if (!open) return null;

  const handleAddLine = () => {
    const defaultAcc = accounts.length > 0 ? accounts[0].id : '';
    setLines([...lines, { accountId: defaultAcc, description: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Live total debit & credit calculations
  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach((l) => {
    totalDebit += l.debit || 0;
    totalCredit += l.credit || 0;
  });

  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.009;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      setErrorMsg(isRtl ? 'الرجاء إدخال البيان الرئيسي للقيد' : 'Main description is required');
      return;
    }

    if (!isBalanced) {
      setErrorMsg(isRtl ? `القيد غير متوازن! الفارق بين المدين والدائن (${diff.toFixed(2)} ر.س)` : `Unbalanced entry! Debit and Credit must be equal (diff: ${diff.toFixed(2)})`);
      return;
    }

    const invalidLine = lines.find((l) => !l.accountId);
    if (invalidLine) {
      setErrorMsg(isRtl ? 'الرجاء اختيار الحساب المحاسبي لجميع البنود' : 'Please select an account for all lines');
      return;
    }

    try {
      await createMutation.mutateAsync({
        organizationId: orgId,
        data: {
          description,
          descriptionAr: descriptionAr || undefined,
          referenceNumber: referenceNumber || undefined,
          entryDate: entryDate ? new Date(entryDate).toISOString() : undefined,
          postingDate: entryDate ? new Date(entryDate).toISOString() : undefined,
          lines: lines.map((l) => ({
            accountId: l.accountId,
            description: l.description || undefined,
            debit: String(l.debit || 0),
            credit: String(l.credit || 0),
          }))
        }
      });

      showAlert.success(
        isRtl ? 'تم تسجيل القيد المحاسبي بنجاح!' : 'Journal Voucher Posted Successfully!',
        isRtl ? 'تم إضافة قيد اليومية المزدوج إلى سجل الحسابات.' : 'Double-entry journal voucher recorded to General Ledger.'
      );
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isRtl ? 'فشل حفظ القيد المحاسبي' : 'Failed to save journal entry'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              {isRtl ? 'إعداد قيد محاسبي يدوي مزدوج' : 'Create Manual Journal Voucher'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl ? 'تطبيق قاعدة القيد المزدوج: مجموع المدين يساوي مجموع الدائن' : 'Double-Entry Rule: Total Debits = Total Credits'}
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          {/* Description & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'البيان الرئيسي للقيد *' : 'Voucher Description *'}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isRtl ? 'مثال: تسوية إيجار الفرع عن شهر يناير' : 'e.g. Monthly Office Rent Adjustment'}
                required
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'تاريخ القيد' : 'Entry Date'}
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRtl ? 'الرقم المرجعي (السند / العقد)' : 'Reference #'}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={isRtl ? 'مثال: REF-9901' : 'e.g. REF-9901'}
                className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Entry Lines Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                {isRtl ? 'خطوط القيد (المدين والدائن)' : 'Journal Lines (Debits & Credits)'}
              </h3>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddLine}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
                {isRtl ? 'إضافة سطر' : 'Add Line'}
              </Button>
            </div>

            {/* Lines Table */}
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <select
                        value={line.accountId}
                        onChange={(e) => {
                          const copy = [...lines];
                          copy[idx].accountId = e.target.value;
                          setLines(copy);
                        }}
                        className="w-full py-1.5 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                      >
                        <option value="">{isRtl ? '-- اختر الحساب --' : '-- Select Account --'}</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{a.code}] {a.nameArabic} - {a.nameEnglish} ({a.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={isRtl ? 'مدين (Debit)' : 'Debit'}
                        value={line.debit || ''}
                        onChange={(e) => {
                          const copy = [...lines];
                          const val = parseFloat(e.target.value) || 0;
                          copy[idx].debit = val;
                          if (val > 0) copy[idx].credit = 0; // mutually exclusive line entries
                          setLines(copy);
                        }}
                        className="w-full py-1.5 px-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={isRtl ? 'دائن (Credit)' : 'Credit'}
                        value={line.credit || ''}
                        onChange={(e) => {
                          const copy = [...lines];
                          const val = parseFloat(e.target.value) || 0;
                          copy[idx].credit = val;
                          if (val > 0) copy[idx].debit = 0; // mutually exclusive line entries
                          setLines(copy);
                        }}
                        className="w-full py-1.5 px-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-blue-600 dark:text-blue-400"
                      />
                    </div>

                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length <= 2}
                        className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balance Status Box */}
          <div className={`p-4 rounded-xl border space-y-2 text-sm transition-colors ${
            isBalanced 
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
              : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {isBalanced ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
                {isBalanced 
                  ? (isRtl ? 'القيد متوازن وجاهز للترحيل' : 'Journal entry is balanced')
                  : (isRtl ? 'القيد غير متوازن! يرجى معادلة المدين والدائن' : 'Unbalanced entry! Debits must equal Credits')}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">
                Diff: {diff.toFixed(2)} SAR
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">{isRtl ? 'إجمالي المدين (Debits)' : 'Total Debits'}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">{totalDebit.toFixed(2)} SAR</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">{isRtl ? 'إجمالي الدائن (Credits)' : 'Total Credits'}</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">{totalCredit.toFixed(2)} SAR</span>
              </div>
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !isBalanced}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-36"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isRtl ? 'ترحيل القيد' : 'Post Voucher'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
