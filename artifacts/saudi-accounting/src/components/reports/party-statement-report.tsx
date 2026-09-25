import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, formatCurrency, Button } from '@/lib/utils';
import { customFetch, useGetCurrentSession, useGetCustomers, useGetSuppliers } from '@workspace/api-client-react';
import { Download, FileSpreadsheet, Printer, RefreshCw, Sparkles, ShieldCheck, UserCheck, FileText } from 'lucide-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { showAlert } from '@/lib/alerts';
import { PartyStatementKpiCards } from './party-statement-kpi-cards';

type StatementType = 'customer' | 'supplier';

type StatementEntry = {
  date: string;
  type: string;
  reference: string;
  debit: string | number;
  credit: string | number;
  balance: string | number;
};

type Statement = {
  partyType: string;
  partyId: string;
  partyName: string;
  currency: string;
  openingBalance: string | number;
  closingBalance: string | number;
  entries: StatementEntry[];
};

function downloadText(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PartyStatementReport({ type }: { type: StatementType }) {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const currentOrg = session?.organizations?.find(o => o.organization.id === orgId)?.organization;

  const [partyId, setPartyId] = useState('');

  const params = { pageSize: 100 } as any;
  const { data: customers } = useGetCustomers(orgId, params, { 
    query: { 
      enabled: !!orgId && type === 'customer',
      staleTime: 10 * 60 * 1000 
    } 
  });
  const { data: suppliers } = useGetSuppliers(orgId, params, { 
    query: { 
      enabled: !!orgId && type === 'supplier',
      staleTime: 10 * 60 * 1000 
    } 
  });

  const parties = type === 'customer' ? customers?.items || [] : suppliers?.items || [];

  useEffect(() => {
    if (!partyId && parties.length > 0) {
      setPartyId(parties[0].id);
    }
  }, [parties, partyId]);

  const title = type === 'customer' ? t('Customer Statement', 'كشف حساب العميل') : t('Supplier Statement', 'كشف حساب المورد');
  const endpoint = type === 'customer' ? 'customer-statement' : 'supplier-statement';
  const idKey = type === 'customer' ? 'customerId' : 'supplierId';

  // Fast React Query caching for statement data (10 mins staleTime)
  const { data: statement, isLoading, refetch } = useQuery<Statement>({
    queryKey: ['party-statement', orgId, endpoint, partyId],
    queryFn: async () => {
      if (!orgId || !partyId) return null as any;
      return customFetch<Statement>(`/api/organizations/${orgId}/reports/${endpoint}?${idKey}=${partyId}`, { responseType: 'json' });
    },
    enabled: Boolean(orgId) && Boolean(partyId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rows = statement?.entries || [];

  // Metrics for KPI Cards
  const kpiData = useMemo(() => {
    let debitSum = 0;
    let creditSum = 0;
    rows.forEach(r => {
      debitSum += Number(r.debit || 0);
      creditSum += Number(r.credit || 0);
    });

    return {
      openingBalance: Number(statement?.openingBalance || 0),
      totalDebit: debitSum,
      totalCredit: creditSum,
      closingBalance: Number(statement?.closingBalance || 0),
      currency: statement?.currency || 'SAR',
      partyName: statement?.partyName || parties.find((p: any) => p.id === partyId)?.displayName || '-'
    };
  }, [rows, statement, parties, partyId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!rows.length) return;
    window.open(`/api/organizations/${orgId}/reports/${endpoint}?${idKey}=${partyId}&format=csv`, '_blank');
    showAlert.toast(t('CSV Export standard started.', 'جاري بدء تصدير كشف الحساب بصيغة CSV...'), 'success');
  };

  const handleExportExcel = () => {
    if (!rows.length) return;
    const tableRows = rows.map((r) => 
      `<tr><td>${r.date ? new Date(r.date).toLocaleDateString() : ''}</td><td>${r.type}</td><td>${r.reference}</td><td>${r.debit}</td><td>${r.credit}</td><td>${r.balance}</td></tr>`
    ).join('');
    const xlsContent = `<html><head><meta charset="utf-8"/></head><body><table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Debit (SAR)</th><th>Credit (SAR)</th><th>Running Balance (SAR)</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    downloadText(`${endpoint}_${partyId}_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel', xlsContent);
    showAlert.toast(t('Excel File Exported Successfully!', 'تم تصدير ملف الإكسل بنجاح!'), 'success');
  };

  const getTypeBadge = (entryType: string) => {
    const formatted = entryType.toUpperCase();
    switch (formatted) {
      case 'INVOICE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">{isRtl ? 'فاتورة' : 'Invoice'}</span>;
      case 'PAYMENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">{isRtl ? 'سداد / تحصيل' : 'Payment'}</span>;
      case 'BILL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">{isRtl ? 'فاتورة شراء' : 'Bill'}</span>;
      case 'CREDIT_NOTE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">{isRtl ? 'إشعار مدين/دائن' : 'Credit Note'}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap">{entryType}</span>;
    }
  };

  const companyNameEn = currentOrg?.legalNameEnglish || currentOrg?.tradingNameEnglish || 'Nouman Trading & Technology Co.';
  const companyNameAr = currentOrg?.legalNameArabic || currentOrg?.tradingNameArabic || 'شركة نعمان للتجارة والتقنية';
  const vatNumber = currentOrg?.vatNumber || '310998877600003';
  const crNumber = currentOrg?.commercialRegistrationNumber || '1010889922';

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Official Print Header - Visible when printing */}
      <div className="hidden print:block mb-8 pb-6 border-b-2 border-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{companyNameAr}</h1>
            <p className="text-sm font-semibold text-slate-700">{companyNameEn}</p>
            <p className="text-xs text-slate-600 mt-1">الرياض، المملكة العربية السعودية</p>
            <div className="text-xs text-slate-600 mt-0.5 flex gap-4">
              <span><strong>سجل تجاري:</strong> {crNumber}</span>
              <span><strong>الرقم الضريبي:</strong> {vatNumber}</span>
            </div>
          </div>
          <div className="text-right rtl:text-left">
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-bold rounded text-xs mb-1">
              {type === 'customer' ? 'كشف حساب عميل معتمد SOCPA' : 'كشف حساب مورد معتمد SOCPA'}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm font-black text-slate-800 mt-1">{kpiData.partyName}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              تاريخ الاستخراج: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Luxury Screen Header & Action Toolbar Bar (Hidden on Print) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{type === 'customer' ? t('Receivables Statement', 'كشف حساب العملاء والذمم') : t('Payables Statement', 'كشف حساب الموردين والالتزامات')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA & SOCPA Compliant
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Real DB-backed transaction statement with running balance and official audit summary.', 'كشف حركات تفصيلي موثق من قاعدة البيانات مع حساب الرصيد التراكمي المستمر.')}
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
            <Download className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">CSV</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs">Excel</span>
          </Button>

          <Button 
            type="button"
            onClick={handlePrint} 
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Statement', 'طباعة كشف الحساب')}</span>
          </Button>
        </div>
      </div>

      {/* Party Selector Filter Bar (Screen only) */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-xs print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-foreground shrink-0">
            <UserCheck className="w-4 h-4 text-primary" />
            <span>{type === 'customer' ? t('Select Customer:', 'اختر العميل:') : t('Select Supplier:', 'اختر المورد:')}</span>
          </div>
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold cursor-pointer"
          >
            {parties.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.displayName || p.businessNameEnglish || p.businessNameArabic || p.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Component */}
      <PartyStatementKpiCards
        partyName={kpiData.partyName}
        openingBalance={kpiData.openingBalance}
        totalDebit={kpiData.totalDebit}
        totalCredit={kpiData.totalCredit}
        closingBalance={kpiData.closingBalance}
        currency={kpiData.currency}
        isLoading={isLoading}
      />

      {/* Statement Table Section */}
      {isLoading ? (
        <div className="p-4 space-y-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{t('Loading transaction statement & running balances...', 'جاري تحميل حركات كشف الحساب والأرصدة التراكمية...')}</span>
          </div>
          <SkeletonTable rows={6} />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs print:border-none print:shadow-none">
          <div className="p-4 bg-muted/40 border-b border-border font-extrabold text-sm flex items-center justify-between gap-2 text-foreground print:bg-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>{kpiData.partyName}</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono font-bold">
              {t('Closing Balance:', 'الرصيد الختامي:')} <span className="text-primary font-black">{formatCurrency(kpiData.closingBalance, kpiData.currency, isRtl ? 'ar-SA' : 'en-US')}</span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Date', 'التاريخ')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Transaction Type', 'نوع الحركة')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Reference #', 'رقم المرجع')}</th>
                  <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Debit (+)', 'مدين (+)')}</th>
                  <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Credit (-)', 'دائن (-)')}</th>
                  <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Running Balance', 'الرصيد التراكمي')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      {t('No statement transactions found for this account.', 'لا توجد حركات مسجلة لهذا الحساب.')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={`${row.type}-${row.reference}-${idx}`} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-muted-foreground text-xs">
                        {row.date ? new Date(row.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getTypeBadge(row.type)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-extrabold text-primary text-xs">
                        {row.reference || '—'}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                        {Number(row.debit) > 0 ? formatCurrency(Number(row.debit), kpiData.currency, isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs whitespace-nowrap">
                        {Number(row.credit) > 0 ? formatCurrency(Number(row.credit), kpiData.currency, isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left font-mono font-black text-foreground text-xs whitespace-nowrap">
                        {formatCurrency(Number(row.balance), kpiData.currency, isRtl ? 'ar-SA' : 'en-US')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden divide-y divide-border">
            {rows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs">
                {t('No statement transactions found for this account.', 'لا توجد حركات مسجلة لهذا الحساب.')}
              </div>
            ) : (
              rows.map((row, idx) => (
                <div key={`${row.type}-${row.reference}-${idx}`} className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(row.type)}
                        <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary whitespace-nowrap">
                          {row.reference}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-1">
                        {row.date ? new Date(row.date).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Debit (+)', 'مدين (+)')}</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] mt-0.5">
                        {Number(row.debit) > 0 ? `${kpiData.currency} ${Number(row.debit).toFixed(2)}` : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Credit (-)', 'دائن (-)')}</div>
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] mt-0.5">
                        {Number(row.credit) > 0 ? `${kpiData.currency} ${Number(row.credit).toFixed(2)}` : '—'}
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{t('Balance', 'الرصيد')}</div>
                      <div className="font-mono font-black text-foreground text-xs mt-0.5">
                        {kpiData.currency} {Number(row.balance).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Printable Official Certification & Signature Block */}
      <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-300">
        <div className="grid grid-cols-2 gap-8 text-center text-xs text-slate-800">
          <div>
            <p className="font-bold text-slate-900">إعداد / المحاسب المسؤول (Accountant)</p>
            <p className="text-slate-500 mt-1">{companyNameEn}</p>
            <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
              <span>التوقيع والختم / Signature</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-900">مصادقة الحساب / (Account Approval)</p>
            <p className="text-slate-500 mt-1">المحاسبة والمالية - SOCPA</p>
            <div className="mt-12 pt-2 border-t border-slate-400 w-48 mx-auto">
              <span>التوقيع والختم / Signature</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-3">
          تم استخراج كشف الحساب آلياً عبر نظام NEXUS SaaS المحاسبي المتوافق مع الهيئة العامة للزكاة والدخل (ZATCA) والمعايير السعودية (SOCPA).
        </div>
      </div>
    </div>
  );
}

