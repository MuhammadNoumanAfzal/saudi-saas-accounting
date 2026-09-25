import { useEffect, useMemo, useState } from 'react';
import { useTranslation, Button, formatCurrency } from '@/lib/utils';
import { customFetch, useGetCurrentSession, useGetCustomers, useGetSuppliers } from '@workspace/api-client-react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';

type StatementType = 'customer' | 'supplier';

type Statement = {
  partyType: string;
  partyId: string;
  partyName: string;
  currency: string;
  openingBalance: string;
  closingBalance: string;
  entries: Array<{ date: string; type: string; reference: string; debit: string; credit: string; balance: string }>;
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
  const [partyId, setPartyId] = useState('');
  const [statement, setStatement] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(false);

  const params = { pageSize: 100 } as any;
  const { data: customers } = useGetCustomers(orgId, params, { query: { enabled: !!orgId && type === 'customer' } });
  const { data: suppliers } = useGetSuppliers(orgId, params, { query: { enabled: !!orgId && type === 'supplier' } });
  const parties = type === 'customer' ? customers?.items || [] : suppliers?.items || [];

  useEffect(() => {
    if (!partyId && parties.length) setPartyId(parties[0].id);
  }, [parties, partyId]);

  const title = type === 'customer' ? t('Customer Statement', 'كشف حساب العميل') : t('Supplier Statement', 'كشف حساب المورد');
  const endpoint = type === 'customer' ? 'customer-statement' : 'supplier-statement';
  const idKey = type === 'customer' ? 'customerId' : 'supplierId';

  const loadStatement = async () => {
    if (!orgId || !partyId) return;
    setLoading(true);
    try {
      const data = await customFetch<Statement>(`/api/organizations/${orgId}/reports/${endpoint}?${idKey}=${partyId}`, { responseType: 'json' });
      setStatement(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [orgId, partyId]);

  const rows = statement?.entries || [];
  const xls = useMemo(() => {
    const tableRows = rows.map((r) => `<tr><td>${r.date.slice(0,10)}</td><td>${r.type}</td><td>${r.reference}</td><td>${r.debit}</td><td>${r.credit}</td><td>${r.balance}</td></tr>`).join('');
    return `<html><body><table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
  }, [rows]);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('Real DB-backed transaction statement with running balance.', 'كشف حركات فعلي من قاعدة البيانات مع رصيد متحرك.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-10 rounded-lg border border-border bg-background px-3 text-sm min-w-64" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            {parties.map((p: any) => <option key={p.id} value={p.id}>{p.displayName || p.businessNameEnglish || p.email}</option>)}
          </select>
          <Button variant="secondary" onClick={() => window.print()} className="gap-2"><Printer size={16} />{t('PDF', 'PDF')}</Button>
          <Button variant="secondary" onClick={() => downloadText(`${endpoint}.xls`, 'application/vnd.ms-excel', xls)} className="gap-2"><FileSpreadsheet size={16} />Excel</Button>
          <Button variant="secondary" onClick={() => window.open(`/api/organizations/${orgId}/reports/${endpoint}?${idKey}=${partyId}&format=csv`, '_blank')} className="gap-2"><Download size={16} />CSV</Button>
        </div>
      </header>

      <section className="soft-card p-6 bg-card border rounded-2xl print:border-none print:shadow-none">
        <div className="flex justify-between gap-4 border-b border-border pb-4 mb-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground font-bold">{title}</div>
            <div className="text-xl font-black mt-1">{statement?.partyName || '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{t('Closing Balance', 'الرصيد الختامي')}</div>
            <div className="text-2xl font-black text-primary">{formatCurrency(Number(statement?.closingBalance || 0), statement?.currency || 'SAR', isRtl ? 'ar-SA' : 'en-US')}</div>
          </div>
        </div>

        {loading ? <div className="text-sm text-muted-foreground">{t('Loading statement...', 'جاري تحميل الكشف...')}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="py-3 text-left">Date</th><th className="text-left">Type</th><th className="text-left">Reference</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="text-right">Balance</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t('No transactions found.', 'لا توجد حركات.')}</td></tr> : rows.map((row, idx) => (
                  <tr key={`${row.type}-${row.reference}-${idx}`} className="border-b border-border/60">
                    <td className="py-3">{new Date(row.date).toLocaleDateString()}</td><td>{row.type}</td><td className="font-mono">{row.reference}</td>
                    <td className="text-right">{row.debit}</td><td className="text-right">{row.credit}</td><td className="text-right font-bold">{row.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
