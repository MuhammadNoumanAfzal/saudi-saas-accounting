import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListPurchaseBills,
  getListPurchaseBillsQueryKey,
  customFetch
} from '@workspace/api-client-react';
import type { PurchaseBill } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { 
  Search, Plus, ShieldCheck, RefreshCw, Sparkles
} from 'lucide-react';
import { BillCreateSheet } from './bill-create-sheet';
import { BillKpiCards } from './bill-kpi-cards';
import { BillTable } from './bill-table';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';

interface BillsListProps {
  onSelectBill?: (id: string) => void;
}

export function BillsList({ onSelectBill }: BillsListProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [createOpen, setCreateOpen] = useState(() => {
    return new URLSearchParams(window.location.search).has('new');
  });

  const queryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    status: (statusFilter as any) || undefined,
  }), [debouncedSearch, page, statusFilter]);

  // Optimized React Query config (10 mins staleTime for 0ms navigation latency)
  const { data, isLoading, refetch } = useListPurchaseBills(orgId, queryParams as any, {
    query: { 
      enabled: Boolean(orgId), 
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getListPurchaseBillsQueryKey(orgId, queryParams as any) 
    }
  });

  const rawBills = data?.items ?? [];
  const bills: PurchaseBill[] = rawBills.filter((b: any) => {
    if (search) {
      const s = search.toLowerCase();
      if (!b.billNumber?.toLowerCase().includes(s) && !b.supplierName?.toLowerCase().includes(s)) return false;
    }
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });
  const totalItems = data?.total || rawBills.length;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Calculate local KPI summary metrics
  const summary = {
    total: totalItems,
    received: bills.filter(q => q.status === 'RECEIVED').length,
    paid: bills.filter(q => q.status === 'PAID').length,
    totalValue: bills.reduce((acc, q) => acc + (parseFloat(q.totalAmount) || 0), 0)
  };

  const handleDeleteBill = async (id: string, number: string) => {
    if (!orgId) return;
    const confirmed = await showAlert.confirm(
      t(`Delete Purchase Bill ${number}?`, `حذف فاتورة الشراء ${number}؟`),
      t(`Are you sure you want to delete purchase bill ${number}? This action cannot be undone.`, `هل أنت تأكد من رغبتك في حذف فاتورة الشراء ${number}؟ لا يمكن التراجع عن هذا الإجراء.`),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    // Optimistically update React Query cache for 0ms instant UI removal
    const queryKey = getListPurchaseBillsQueryKey(orgId, queryParams as any);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.filter((item: any) => item.id !== id),
        total: Math.max(0, (oldData.total || 1) - 1),
      };
    });

    showAlert.toast(
      t('Purchase Bill Deleted Successfully!', 'تم حذف فاتورة الشراء بنجاح!'),
      'success'
    );

    try {
      await customFetch(`/api/organizations/${orgId}/purchase-bills/${id}`, {
        method: 'DELETE'
      });
      queryClient.invalidateQueries({ queryKey: getListPurchaseBillsQueryKey(orgId) });
    } catch {
      queryClient.invalidateQueries({ queryKey: getListPurchaseBillsQueryKey(orgId) });
    }
  };

  const handleSelectBill = (id: string) => {
    if (onSelectBill) {
      onSelectBill(id);
    } else {
      setLocation(`/finance/bills/${id}`);
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
              <span>{t('Vendor Bills & Input VAT', 'فواتير الموردين وضريبة المدخلات')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> Input VAT 15% Verified
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Purchase Bills', 'فواتير المشتريات')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Manage vendor bills, input VAT 15% recovery, and payment status.', 'إدارة فواتير الموردين ومتابعة ضريبة المدخلات 15% واستردادها.')}
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
            <span>{t('New Purchase Bill', 'فاتورة شراء جديدة')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Component */}
      <BillKpiCards 
        total={summary.total}
        received={summary.received}
        paid={summary.paid}
        totalValue={summary.totalValue}
      />

      {/* Main Table Card with Search & Status Filter */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search by bill number, vendor name...', 'البحث بالرقم أو اسم المورد...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex gap-2">
            <select className="field bg-background h-10 w-full sm:w-44 rounded-xl text-xs font-semibold cursor-pointer" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="RECEIVED">{t('Received', 'تم الاستلام')}</option>
              <option value="PAID">{t('Paid', 'مدفوعة')}</option>
              <option value="PARTIALLY_PAID">{t('Partially Paid', 'مدفوعة جزئياً')}</option>
              <option value="OVERDUE">{t('Overdue', 'متأخرة')}</option>
              <option value="DRAFT">{t('Draft', 'مسودة')}</option>
              <option value="CANCELLED">{t('Cancelled', 'ملغاة')}</option>
            </select>
          </div>
        </div>

        {/* Bill Table Component */}
        <BillTable 
          bills={bills}
          isLoading={isLoading}
          search={search}
          statusFilter={statusFilter}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={setPage}
          onSelectBill={handleSelectBill}
          onDeleteBill={handleDeleteBill}
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      {/* Create Purchase Bill Sheet */}
      <BillCreateSheet 
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListPurchaseBillsQueryKey(orgId) });
          refetch();
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
