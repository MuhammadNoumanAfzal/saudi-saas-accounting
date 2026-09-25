import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListInvoices,
  getListInvoicesQueryKey,
  customFetch
} from '@workspace/api-client-react';
import type { Invoice } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { 
  Search, Plus, ShieldCheck, RefreshCw, Sparkles
} from 'lucide-react';
import { InvoiceCreateSheet } from './invoice-create-sheet';
import { InvoiceKpiCards } from './invoice-kpi-cards';
import { InvoiceTable } from './invoice-table';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';

interface InvoicesListProps {
  onSelectInvoice?: (id: string) => void;
}

export function InvoicesList({ onSelectInvoice }: InvoicesListProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  const [createOpen, setCreateOpen] = useState(() => {
    return new URLSearchParams(window.location.search).has('new');
  });

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    status: (statusFilter as any) || undefined,
    invoiceType: (typeFilter as any) || undefined,
  };

  // Optimized React Query config (10 mins staleTime for 0ms navigation latency)
  const { data, isLoading, refetch } = useListInvoices(orgId, queryParams as any, {
    query: { 
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getListInvoicesQueryKey(orgId, queryParams as any) 
    }
  });

  const rawInvoices = data?.items ?? [];
  const invoices: Invoice[] = rawInvoices.filter((i: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!i.invoiceNumber?.toLowerCase().includes(q) && !i.customerName?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && i.status !== statusFilter) return false;
    if (typeFilter && i.invoiceType !== typeFilter) return false;
    return true;
  });
  const totalItems = data?.total || rawInvoices.length;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Calculate local KPI summary metrics
  const summary = {
    total: totalItems,
    issued: invoices.filter(q => q.status === 'ISSUED').length,
    paid: invoices.filter(q => q.status === 'PAID').length,
    totalValue: invoices.reduce((acc, q) => acc + (parseFloat(q.totalAmount) || 0), 0)
  };

  const handleDeleteInvoice = async (id: string, number: string) => {
    if (!orgId) return;
    const confirmed = await showAlert.confirm(
      t(`Delete Invoice ${number}?`, `حذف الفاتورة ${number}؟`),
      t(`Are you sure you want to delete invoice ${number}? This action cannot be undone.`, `هل أنت تأكد من رغبتك في حذف الفاتورة ${number}؟ لا يمكن التراجع عن هذا الإجراء.`),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    // Optimistically update React Query cache for 0ms instant UI removal
    const queryKey = getListInvoicesQueryKey(orgId, queryParams as any);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.filter((item: any) => item.id !== id),
        total: Math.max(0, (oldData.total || 1) - 1),
      };
    });

    showAlert.toast(
      t('Invoice Deleted Successfully!', 'تم حذف الفاتورة بنجاح!'),
      'success'
    );

    try {
      await customFetch(`/api/organizations/${orgId}/invoices/${id}`, {
        method: 'DELETE'
      });
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
    } catch {
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
    }
  };

  const handleSelectInvoice = (id: string) => {
    if (onSelectInvoice) {
      onSelectInvoice(id);
    } else {
      setLocation(`/finance/invoices/${id}`);
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Sales Invoices & ZATCA E-Invoicing', 'فواتير المبيعات وررمز ZATCA')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> Phase 1 & 2 Ready
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Sales Invoices & ZATCA E-Invoicing', 'فواتير المبيعات')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Issue, track, and manage ZATCA-compliant Tax Invoices with Base64 TLV QR Codes.', 'إصدار ومتابعة وإدارة الفواتير الضريبية المعتمدة مع رمز الاستجابة السريع ZATCA.')}
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
            onClick={() => setCreateOpen(true)}
            className="h-9 px-3.5 rounded-xl btn-primary shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('New Tax Invoice', 'فاتورة جديدة')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Component */}
      <InvoiceKpiCards 
        total={summary.total}
        issued={summary.issued}
        paid={summary.paid}
        totalValue={summary.totalValue}
      />

      {/* Main Table Card with Search & Filters */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search by invoice #, customer name...', 'بحث برقم الفاتورة، اسم العميل...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <select className="field bg-background h-10 w-full sm:w-40 rounded-xl text-xs font-semibold cursor-pointer" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">{t('All Types', 'جميع الأنواع')}</option>
              <option value="STANDARD">{t('Standard (B2B)', 'ضريبية (شركات)')}</option>
              <option value="SIMPLIFIED">{t('Simplified (B2C)', 'مبسطة (أفراد)')}</option>
            </select>
            <select className="field bg-background h-10 w-full sm:w-40 rounded-xl text-xs font-semibold cursor-pointer" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="ISSUED">{t('Issued', 'صادرة')}</option>
              <option value="PAID">{t('Paid', 'مدفوعة')}</option>
              <option value="OVERDUE">{t('Overdue', 'متأخرة')}</option>
              <option value="CANCELLED">{t('Cancelled', 'ملغاة')}</option>
            </select>
          </div>
        </div>

        {/* Invoice Table Component */}
        <InvoiceTable 
          invoices={invoices}
          isLoading={isLoading}
          search={search}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={setPage}
          onSelectInvoice={handleSelectInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      {/* Create Slide-over Sheet */}
      <InvoiceCreateSheet 
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
          refetch();
        }}
      />
    </div>
  );
}
