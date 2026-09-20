import { useState, useMemo } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useGetTrialBalance,
  getGetTrialBalanceQueryKey
} from '@workspace/api-client-react';
import { 
  Scale, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export function TrialBalance() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const { data, isLoading, refetch } = useGetTrialBalance(orgId, {}, {
    query: {
      enabled: !!orgId,
      queryKey: getGetTrialBalanceQueryKey(orgId, {}),
    }
  });

  const rawItems = data?.items || [];
  const totalDebit = data?.totalDebit || '0.00';
  const totalCredit = data?.totalCredit || '0.00';
  const isBalanced = data?.isBalanced ?? true;

  // Filter items
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      const matchesSearch = 
        !searchQuery ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameArabic.includes(searchQuery);

      const matchesType = selectedType === 'ALL' || item.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [rawItems, searchQuery, selectedType]);

  // Account type badges helper
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ASSET':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">{isRtl ? 'أصول (Asset)' : 'Asset'}</span>;
      case 'LIABILITY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">{isRtl ? 'إلتزامات (Liability)' : 'Liability'}</span>;
      case 'EQUITY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">{isRtl ? 'حقوق ملكية (Equity)' : 'Equity'}</span>;
      case 'REVENUE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{isRtl ? 'إيرادات (Revenue)' : 'Revenue'}</span>;
      case 'EXPENSE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">{isRtl ? 'مصروفات (Expense)' : 'Expense'}</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  const formattedAsOf = data?.asOfDate ? new Date(data.asOfDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : new Date().toLocaleDateString();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Print Document Header - Visible only when printing */}
      <div className="hidden print:block mb-8 pb-6 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">شركة نعمان للتجارة والتقنية</h1>
            <p className="text-sm font-semibold text-slate-700">Nouman Trading & Technology Co.</p>
            <p className="text-xs text-slate-600 mt-1">الرياض، المملكة العربية السعودية | King Fahd Road, Riyadh</p>
            <div className="text-xs text-slate-600 mt-0.5 flex gap-4">
              <span><strong>سجل تجاري:</strong> 1010889922</span>
              <span><strong>الرقم الضريبي:</strong> 310998877600003</span>
            </div>
          </div>
          <div className="text-right rtl:text-left">
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-bold rounded text-xs mb-1">
              معتمد طبقا للمعايير السعودية (SOCPA)
            </div>
            <h2 className="text-xl font-bold text-slate-900">ميزان المراجعة (Trial Balance)</h2>
            <p className="text-xs text-slate-600">تاريخ الاستخراج: {formattedAsOf}</p>
          </div>
        </div>
      </div>

      {/* Screen Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isRtl ? 'ميزان المراجعة (Trial Balance)' : 'Trial Balance Report'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isRtl 
                  ? 'ملخص تفصيلي بأرصدة الحركة المدينة والدائنة لكافة حسابات دفتر التستيل العام' 
                  : 'Detailed summary of debit & credit balances across all general ledger accounts'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            className="text-xs gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            {isRtl ? 'تحديث البيانات' : 'Refresh Data'}
          </Button>

          <Button
            onClick={() => window.print()}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            {isRtl ? 'طباعة التقرير (Print)' : 'Print Report'}
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        {/* Total Debit Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'إجمالي الحركة المدينة' : 'Total Debits'}
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {parseFloat(totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-sans">SAR</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <span>{isRtl ? 'مجموع أرصدة المدين للعام' : 'Total debit general ledger balance'}</span>
          </div>
        </div>

        {/* Total Credit Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'إجمالي الحركة الدائنة' : 'Total Credits'}
              </p>
              <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                {parseFloat(totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-sans">SAR</span>
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <span>{isRtl ? 'مجموع أرصدة الدائن للعام' : 'Total credit general ledger balance'}</span>
          </div>
        </div>

        {/* Balance Status Card */}
        <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
          isBalanced 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60' 
            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {isRtl ? 'حالة التوازن المحاسبي' : 'Balance Status'}
              </p>
              <h3 className={`text-xl font-bold mt-1 flex items-center gap-1.5 ${
                isBalanced ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
              }`}>
                {isBalanced ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    {isRtl ? 'متوازن 100%' : '100% Balanced'}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    {isRtl ? 'غير متوازن' : 'Discrepancy'}
                  </>
                )}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${isBalanced ? 'bg-emerald-100/80 text-emerald-700' : 'bg-amber-100/80 text-amber-700'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {isBalanced 
              ? (isRtl ? 'الفارق = 0.00 ريال (مطابق للصكوك)' : 'Difference = 0.00 SAR (Perfect Match)')
              : (isRtl ? `الفارق = ${Math.abs(parseFloat(totalDebit) - parseFloat(totalCredit)).toFixed(2)} SAR` : `Variance = ${Math.abs(parseFloat(totalDebit) - parseFloat(totalCredit)).toFixed(2)} SAR`)}
          </div>
        </div>

        {/* Active Accounts Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isRtl ? 'عدد الحسابات المفعلة' : 'Active Accounts'}
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono">
                {rawItems.length}
              </h3>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <span>{isRtl ? 'دليل الحسابات المعتمد SOCPA' : 'SOCPA standard chart of accounts'}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Screen only) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
            { id: 'ASSET', labelAr: 'الأصول', labelEn: 'Assets' },
            { id: 'LIABILITY', labelAr: 'الالتزامات', labelEn: 'Liabilities' },
            { id: 'EQUITY', labelAr: 'حقوق الملكية', labelEn: 'Equity' },
            { id: 'REVENUE', labelAr: 'الإيرادات', labelEn: 'Revenues' },
            { id: 'EXPENSE', labelAr: 'المصروفات', labelEn: 'Expenses' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isRtl ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'بحث باسم أو رمز الحساب...' : 'Search account code or name...'}
            className="w-full pl-9 rtl:pr-9 rtl:pl-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Main Trial Balance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs print:border-none print:shadow-none print:rounded-none">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            <div className="inline-block animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm font-medium">{isRtl ? 'جاري احتساب أرصدة ميزان المراجعة...' : 'Calculating Trial Balance ledger accounts...'}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {isRtl ? 'لم يتم العثور على حسابات مطابقة' : 'No matching accounts found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isRtl ? 'جرب البحث بكلمة أخرى أو تغيير الفلتر' : 'Try searching with a different keyword or resetting filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right border-collapse">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:text-slate-900">
                <tr>
                  <th scope="col" className="px-5 py-3.5 print:py-2">{isRtl ? 'رمز الحساب (Code)' : 'Code'}</th>
                  <th scope="col" className="px-5 py-3.5 print:py-2">{isRtl ? 'اسم الحساب المحاسبي' : 'Account Name'}</th>
                  <th scope="col" className="px-5 py-3.5 print:py-2">{isRtl ? 'نوع الحساب' : 'Type'}</th>
                  <th scope="col" className="px-5 py-3.5 print:py-2 text-right rtl:text-left">{isRtl ? 'حركة المدين (Debit)' : 'Total Debit'}</th>
                  <th scope="col" className="px-5 py-3.5 print:py-2 text-right rtl:text-left">{isRtl ? 'حركة الدائن (Credit)' : 'Total Credit'}</th>
                  <th scope="col" className="px-5 py-3.5 print:py-2 text-right rtl:text-left">{isRtl ? 'الرصيد الصافي' : 'Net Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 print:divide-slate-300">
                {filteredItems.map((item) => (
                  <tr key={item.accountId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors print:hover:bg-transparent">
                    <td className="px-5 py-3.5 print:py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-slate-900">
                      {item.code}
                    </td>
                    <td className="px-5 py-3.5 print:py-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 print:text-slate-900">{item.nameArabic}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 print:text-slate-600">{item.nameEnglish}</div>
                    </td>
                    <td className="px-5 py-3.5 print:py-2">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="px-5 py-3.5 print:py-2 text-right rtl:text-left font-mono font-semibold text-emerald-600 dark:text-emerald-400 print:text-slate-900">
                      {parseFloat(item.debit) > 0 ? parseFloat(item.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 print:py-2 text-right rtl:text-left font-mono font-semibold text-indigo-600 dark:text-indigo-400 print:text-slate-900">
                      {parseFloat(item.credit) > 0 ? parseFloat(item.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 print:py-2 text-right rtl:text-left font-mono font-bold text-slate-900 dark:text-slate-100 print:text-slate-900">
                      {parseFloat(item.netBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold print:bg-slate-200 print:text-slate-900">
                <tr>
                  <td colSpan={3} className="px-5 py-4 print:py-3 text-base">
                    {isRtl ? 'المجموع الإجمالي لميزان المراجعة (Grand Total)' : 'Grand Total Trial Balance'}
                  </td>
                  <td className="px-5 py-4 print:py-3 text-right rtl:text-left font-mono text-emerald-700 dark:text-emerald-400 print:text-slate-900 text-base">
                    {parseFloat(totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                  </td>
                  <td className="px-5 py-4 print:py-3 text-right rtl:text-left font-mono text-indigo-700 dark:text-indigo-400 print:text-slate-900 text-base">
                    {parseFloat(totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                  </td>
                  <td className="px-5 py-4 print:py-3 text-right rtl:text-left font-mono text-emerald-800 dark:text-emerald-300 print:text-slate-900 text-base">
                    0.00 SAR
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Printable Official Certification & Signature Block */}
      <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
          <div>
            <p className="font-bold text-slate-900">إعداد / المدير المالي (Chief Accountant)</p>
            <p className="text-slate-500 mt-1">Nouman Trading & Technology Co.</p>
            <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
              <span>التوقيع والختم / Signature</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-900">اعتماد / المراجع الخارجي (External Auditor)</p>
            <p className="text-slate-500 mt-1">محاسب قانوني مرخص - SOCPA</p>
            <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
              <span>التوقيع والختم / Signature</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-3">
          تم استخراج هذا التقرير آلياً عبر نظام NEXUS SaaS المحاسبي المتوافق مع الهيئة العامة للزكاة والدخل (ZATCA) والمقاييس السعودية (SOCPA).
        </div>
      </div>
    </div>
  );
}
