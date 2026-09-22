import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListAccounts,
  useCreateAccount,
  getListAccountsQueryKey
} from '@workspace/api-client-react';
import type { Account } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useQueryClient } from '@tanstack/react-query';
import { Landmark, Plus, Search, Filter, FolderTree } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/platform-loader';

export function AccountsList() {
  const { t, isRtl } = useTranslation();
  const queryClient = useQueryClient();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [nameArabic, setNameArabic] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [subtype, setSubtype] = useState('OPERATING_EXPENSE');
  const [errorMsg, setErrorMsg] = useState('');

  const queryParams = {
    search: debouncedSearch || undefined,
    type: (typeFilter as any) || undefined,
  };

  const { data, isLoading } = useListAccounts(orgId, queryParams as any, {
    query: {
      enabled: !!orgId,
      queryKey: getListAccountsQueryKey(orgId, queryParams as any),
    },
  });

  const createMutation = useCreateAccount();

  const accounts: Account[] = data?.items || [];

  const getTypeBadge = (accType: string) => {
    switch (accType) {
      case 'ASSET':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{isRtl ? 'أصول' : 'Asset'}</span>;
      case 'LIABILITY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">{isRtl ? 'الالتزامات' : 'Liability'}</span>;
      case 'EQUITY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">{isRtl ? 'حقوق الملكية' : 'Equity'}</span>;
      case 'REVENUE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{isRtl ? 'إيرادات' : 'Revenue'}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{isRtl ? 'مصروفات' : 'Expense'}</span>;
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code || !nameEnglish || !nameArabic) {
      setErrorMsg(isRtl ? 'جميع الحقول مطلوبة' : 'All fields are required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        organizationId: orgId,
        data: {
          code,
          nameEnglish,
          nameArabic,
          type: type as any,
          subtype,
        }
      });

      queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey(orgId) });
      setCreateOpen(false);
      setCode('');
      setNameEnglish('');
      setNameArabic('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isRtl ? 'فشل إنشاء الحساب' : 'Failed to create account'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Landmark className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {isRtl ? 'شجرة الحسابات (Chart of Accounts)' : 'Chart of Accounts'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRtl 
              ? 'دليل الحسابات الموحد المعترف به حسب معايير الهيئة السعودية للمحاسبين القانونيين (SOCPA)' 
              : 'Standardized Saudi SOCPA Chart of Accounts for Assets, Liabilities, Revenue & Expenses'}
          </p>
        </div>

        <Button 
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {isRtl ? 'إضافة حساب جديد' : 'New Account'}
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'البحث بالرمز أو اسم الحساب...' : 'Search by account code or name...'}
            className="w-full pl-9 rtl:pr-9 rtl:pl-3 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">{isRtl ? 'جميع أنواع الحسابات' : 'All Account Types'}</option>
              <option value="ASSET">{isRtl ? 'أصول (Assets)' : 'Assets'}</option>
              <option value="LIABILITY">{isRtl ? 'التزامات (Liabilities)' : 'Liabilities'}</option>
              <option value="EQUITY">{isRtl ? 'حقوق ملكية (Equity)' : 'Equity'}</option>
              <option value="REVENUE">{isRtl ? 'إيرادات (Revenue)' : 'Revenue'}</option>
              <option value="EXPENSE">{isRtl ? 'مصروفات (Expenses)' : 'Expenses'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{isRtl ? 'جاري تحميل شجرة الحسابات السعودية المعتمدة (SOCPA)...' : 'Loading Saudi SOCPA Standardized Chart of Accounts...'}</span>
            </div>
            <SkeletonTable rows={6} />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FolderTree className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {isRtl ? 'لا توجد حسابات' : 'No accounts found'}
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-slate-600 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'رمز الحساب' : 'Code'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'اسم الحساب (عربي)' : 'Account Name (Arabic)'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'اسم الحساب (إنجليزي)' : 'Account Name (English)'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'النوع' : 'Type'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'التصنيف الفرعي' : 'Subtype'}</th>
                  <th scope="col" className="px-6 py-4">{isRtl ? 'حساب نظامي' : 'System Account'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {acc.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {acc.nameArabic}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {acc.nameEnglish}
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(acc.type)}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {acc.subtype}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {acc.isSystemAccount ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{isRtl ? 'نظامي' : 'System'}</span>
                      ) : (
                        <span className="text-slate-400">{isRtl ? 'مخصص' : 'Custom'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {isRtl ? 'إضافة حساب جديد إلى الدليل' : 'Create New Account'}
              </h3>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'رمز الحساب *' : 'Account Code *'}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 50600"
                  required
                  className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'اسم الحساب باللغة العربية *' : 'Arabic Name *'}
                </label>
                <input
                  type="text"
                  value={nameArabic}
                  onChange={(e) => setNameArabic(e.target.value)}
                  placeholder="مثال: مصروفات تسويق رقمية"
                  required
                  className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'اسم الحساب باللغة الإنجليزية *' : 'English Name *'}
                </label>
                <input
                  type="text"
                  value={nameEnglish}
                  onChange={(e) => setNameEnglish(e.target.value)}
                  placeholder="e.g. Digital Marketing Expense"
                  required
                  className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRtl ? 'نوع الحساب الرئيسي *' : 'Account Type *'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="ASSET">ASSET (أصول)</option>
                  <option value="LIABILITY">LIABILITY (التزامات)</option>
                  <option value="EQUITY">EQUITY (حقوق ملكية)</option>
                  <option value="REVENUE">REVENUE (إيرادات)</option>
                  <option value="EXPENSE">EXPENSE (مصروفات)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isRtl ? 'حفظ الحساب' : 'Save Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
