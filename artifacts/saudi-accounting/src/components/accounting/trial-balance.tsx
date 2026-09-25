import { useState, useMemo } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetTrialBalance,
  getGetTrialBalanceQueryKey
} from '@workspace/api-client-react';
import { 
  Printer, 
  RefreshCw, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  DownloadCloud
} from 'lucide-react';
import { TrialBalanceKpiCards } from './trial-balance-kpi-cards';
import { TrialBalanceTable } from './trial-balance-table';

export function TrialBalance() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Fast React Query caching (10 mins staleTime for 0ms instant load latency)
  const { data, isLoading, refetch } = useGetTrialBalance(orgId, {}, {
    query: {
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
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

  const formattedAsOf = data?.asOfDate ? new Date(data.asOfDate).toLocaleDateString() : new Date().toLocaleDateString();

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;
    const headers = ['Code', 'Arabic Name', 'English Name', 'Type', 'Debit', 'Credit', 'Net Balance'];
    const rows = filteredItems.map(item => [
      `"${item.code}"`,
      `"${item.nameArabic}"`,
      `"${item.nameEnglish}"`,
      `"${item.type}"`,
      `"${item.debit}"`,
      `"${item.credit}"`,
      `"${item.netBalance}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trial_balance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('Trial Balance Exported Successfully!', 'تم تصدير ميزان المراجعة بنجاح!'), 'success');
  };

  return (
    <div className="space-y-6 fade-up pb-12">
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

      {/* Luxury Screen Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('SOCPA General Ledger Balance', 'رصيد التوازنات الموحد SOCPA')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA Compliant
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Trial Balance Report', 'تقرير ميزان المراجعة')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Detailed summary of debit & credit balances across all general ledger accounts.', 'ملخص تفصيلي بأرصدة الحركة المدينة والدائنة لكافة حسابات دفتر التستيل العام.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Data', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Export', 'تصدير')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => window.print()}
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Report', 'طباعة التقرير')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Component */}
      <TrialBalanceKpiCards 
        totalDebit={totalDebit}
        totalCredit={totalCredit}
        isBalanced={isBalanced}
        activeCount={rawItems.length}
        isLoading={isLoading}
      />

      {/* Main Table Card with Search & Type Filter Tabs */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs print:border-none print:shadow-none">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row gap-3 md:items-center justify-between print:hidden">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0 max-w-full">
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
                type="button"
                onClick={() => setSelectedType(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === cat.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border'
                }`}
              >
                {isRtl ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder={t('Search account code or name...', 'البحث باسم أو رمز الحساب...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
        </div>

        {/* Trial Balance Table Component */}
        <TrialBalanceTable 
          items={filteredItems}
          totalDebit={totalDebit}
          totalCredit={totalCredit}
          isLoading={isLoading}
        />
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
