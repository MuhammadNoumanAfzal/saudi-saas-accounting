import { useState } from 'react';
import { useGetCurrentSession, useGetAccountLedger, useListAccounts } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { Printer, BookOpen, Search, Filter } from 'lucide-react';

export function AccountLedgerReport() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const { data: accountsData } = useListAccounts(orgId, {}, {
    query: { enabled: !!orgId }
  });

  const accounts = accountsData?.items || [];
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const activeAccountId = selectedAccountId || accounts[0]?.id || '';

  const { data: ledger, isLoading } = useGetAccountLedger(orgId, {
    accountId: activeAccountId,
  }, {
    query: { enabled: !!orgId && !!activeAccountId }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('Statement of Account / Account Ledger', 'كشف حساب تفصيلي (دفتر الأستاذ)')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Detailed transaction audit history for selected SOCPA account with running balance.', 'سجل كشف الحساب الفردي وتفاصيل الحركات ورصيد الحساب المتراكم.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2 text-xs">
            <Printer className="w-4 h-4" />
            <span>{t('Print Statement', 'طباعة كشف الحساب')}</span>
          </Button>
        </div>
      </div>

      {/* Account Selector Filter Bar */}
      <Card className="p-4 bg-muted/30">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground shrink-0">
            <Filter className="w-4 h-4" />
            <span>{t('Select Account:', 'اختر الحساب:')}</span>
          </div>
          <select
            value={activeAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.code} — {isRtl ? acc.nameArabic : acc.nameEnglish} ({acc.type})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Summary KPI Cards */}
      {ledger && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-muted/40 border">
            <div className="text-xs font-medium text-muted-foreground">{t('Opening Balance', 'الرصيد الافتتاحي')}</div>
            <div className="text-2xl font-bold font-mono mt-1">
              {formatCurrency(Number(ledger.openingBalance || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>

          <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('Total Debit (+)', 'إجمالي مدين (+)')}</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
              {formatCurrency(Number(ledger.totalDebit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>

          <Card className="p-4 bg-blue-500/5 border-blue-500/20">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('Total Credit (-)', 'إجمالي دائن (-)')}</div>
            <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
              {formatCurrency(Number(ledger.totalCredit || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>

          <Card className="p-4 bg-purple-500/10 border-purple-500/30">
            <div className="text-xs font-semibold text-purple-900 dark:text-purple-300">{t('Closing Cumulative Balance', 'الرصيد الختامي المتراكم')}</div>
            <div className="text-2xl font-extrabold font-mono text-purple-700 dark:text-purple-300 mt-1">
              {formatCurrency(Number(ledger.closingBalance || 0), 'SAR', isRtl ? 'ar-SA' : 'en-US')}
            </div>
          </Card>
        </div>
      )}

      {/* Ledger Entries Table */}
      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">{t('Loading account statement...', 'جاري تحميل كشف الحساب...')}</Card>
      ) : (
        <Card className="border overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>{ledger?.accountCode} — {isRtl ? ledger?.accountNameAr : ledger?.accountNameEn}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/40 text-xs text-muted-foreground uppercase border-b">
                <tr>
                  <th className="p-3 text-start">{t('Date', 'التاريخ')}</th>
                  <th className="p-3 text-start">{t('Reference #', 'رقم مرجعي')}</th>
                  <th className="p-3 text-start">{t('Source', 'المصدر')}</th>
                  <th className="p-3 text-start">{t('Description / Particulars', 'البيان')}</th>
                  <th className="p-3 text-end">{t('Debit (مدين)', 'مدين')}</th>
                  <th className="p-3 text-end">{t('Credit (دائن)', 'دائن')}</th>
                  <th className="p-3 text-end">{t('Running Balance', 'الرصيد الجاري')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledger?.entries?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {t('No journal voucher entries found for this account in the selected period.', 'لا توجد قيود أو حركات لهذا الحساب في الفترة المحددة.')}
                    </td>
                  </tr>
                ) : (
                  ledger?.entries?.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="p-3 font-mono text-xs font-semibold">{entry.reference}</td>
                      <td className="p-3 text-xs uppercase font-medium text-muted-foreground">{entry.source}</td>
                      <td className="p-3">{entry.description}</td>
                      <td className="p-3 text-end font-mono text-emerald-600 font-medium">{Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit), 'SAR', isRtl ? 'ar-SA' : 'en-US') : '—'}</td>
                      <td className="p-3 text-end font-mono text-blue-600 font-medium">{Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit), 'SAR', isRtl ? 'ar-SA' : 'en-US') : '—'}</td>
                      <td className="p-3 text-end font-mono font-bold">{formatCurrency(Number(entry.runningBalance), 'SAR', isRtl ? 'ar-SA' : 'en-US')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
