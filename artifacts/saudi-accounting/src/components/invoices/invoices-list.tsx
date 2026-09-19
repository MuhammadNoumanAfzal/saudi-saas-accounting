import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListInvoices,
  getListInvoicesQueryKey
} from '@workspace/api-client-react';
import type { Invoice } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Plus, Filter, Receipt, Eye, CheckCircle2, XCircle, Clock, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { InvoiceCreateSheet } from './invoice-create-sheet';

interface InvoicesListProps {
  onSelectInvoice?: (id: string) => void;
}

export function InvoicesList({ onSelectInvoice }: InvoicesListProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
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

  const { data, isLoading, refetch } = useListInvoices(orgId, queryParams as any, {
    query: { 
      enabled: !!orgId, 
      queryKey: getListInvoicesQueryKey(orgId, queryParams as any) 
    }
  });

  const invoices: Invoice[] = data?.items || [];
  const totalItems = data?.total || 0;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Calculate local KPI summary metrics from response
  const summary = {
    total: totalItems,
    issued: invoices.filter(q => q.status === 'ISSUED').length,
    paid: invoices.filter(q => q.status === 'PAID').length,
    totalValue: invoices.reduce((acc, q) => acc + (parseFloat(q.totalAmount) || 0), 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock size={12} />
            {t('Draft', 'مسودة')}
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={12} />
            {t('Issued', 'صادرة')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} />
            {t('Paid', 'مدفوعة')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle size={12} />
            {t('Overdue', 'متأخرة')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            <XCircle size={12} />
            {t('Cancelled', 'ملغاة')}
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  const handleRowClick = (id: string) => {
    if (onSelectInvoice) {
      onSelectInvoice(id);
    } else {
      setLocation(`/finance/invoices/${id}`);
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('Sales Invoices & ZATCA E-Invoicing', 'فواتير المبيعات وررمز ZATCA')}
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck size={14} /> Phase 1 Ready
            </span>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            {t(
              'Issue, track, and manage ZATCA-compliant Tax Invoices with Base64 TLV QR Codes.',
              'إصدار ومتابعة وإدارة الفواتير الضريبية المعتمدة مع رمز الاستجابة السريع ZATCA.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm">
            <Plus size={16} />
            {t('New Tax Invoice', 'فاتورة جديدة')}
          </Button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Total Invoices', 'إجمالي الفواتير')}</div>
          <div className="text-2xl font-bold text-foreground">{summary.total}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Issued / Outstanding', 'صادرة / معلقة')}</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.issued}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Paid Invoices', 'المسددة')}</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.paid}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Total Billed Value', 'القيمة الإجمالية')}</div>
          <div className="text-2xl font-bold text-foreground">
            {summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-muted-foreground font-normal">{t('SAR', 'ر.س')}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="soft-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder={t('Search by invoice #, customer name...', 'بحث برقم الفاتورة، اسم العميل...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t('All Types', 'جميع الأنواع')}</option>
              <option value="STANDARD">{t('Standard (B2B)', 'ضريبية (شركات)')}</option>
              <option value="SIMPLIFIED">{t('Simplified (B2C)', 'مبسطة (أفراد)')}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="ISSUED">{t('Issued', 'صادرة')}</option>
              <option value="PAID">{t('Paid', 'مدفوعة')}</option>
              <option value="OVERDUE">{t('Overdue', 'متأخرة')}</option>
              <option value="CANCELLED">{t('Cancelled', 'ملغاة')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="soft-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></div>
            <p className="text-sm">{t('Loading invoices...', 'جاري تحميل الفواتير...')}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto text-muted-foreground/40 mb-3" size={48} />
            <h3 className="text-lg font-medium text-foreground">{t('No invoices found', 'لا توجد فواتير مبيعات')}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {search || statusFilter || typeFilter 
                ? t('Try adjusting your search query or filter options.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
                : t('Get started by issuing your first ZATCA-compliant Tax Invoice.', 'ابدأ بإصدار أول فاتورة ضريبية للعملاء.')}
            </p>
            {!search && !statusFilter && !typeFilter && (
              <Button variant="primary" onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
                <Plus size={16} />
                {t('Issue Invoice', 'إصدار فاتورة')}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="p-4">{t('Invoice #', 'رقم الفاتورة')}</th>
                  <th className="p-4">{t('Type', 'النوع')}</th>
                  <th className="p-4">{t('Customer', 'العميل')}</th>
                  <th className="p-4">{t('Issue Date', 'تاريخ الإصدار')}</th>
                  <th className="p-4">{t('Due Date', 'تاريخ الاستحقاق')}</th>
                  <th className="p-4">{t('Total Amount', 'المبلغ الإجمالي')}</th>
                  <th className="p-4">{t('Status', 'الحالة')}</th>
                  <th className="p-4 text-right">{t('Action', 'الإجراء')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv: Invoice) => (
                  <tr 
                    key={inv.id}
                    onClick={() => handleRowClick(inv.id)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-medium text-primary">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground border">
                        {inv.invoiceType === 'SIMPLIFIED' ? t('B2C Simplified', 'مبسطة') : t('B2B Standard', 'ضريبية')}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {inv.customerName || t('Customer', 'عميل')}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {Number(inv.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">{t('SAR', 'ر.س')}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        onClick={() => handleRowClick(inv.id)}
                        className="gap-1 text-xs py-1 px-2.5"
                      >
                        <Eye size={14} />
                        {t('View', 'عرض')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {t('Page', 'صفحة')} {currentPage} {t('of', 'من')} {totalPages} ({totalItems} {t('items', 'عنصر')})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="py-1 px-2.5 text-xs"
              >
                {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                {t('Previous', 'السابق')}
              </Button>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="py-1 px-2.5 text-xs"
              >
                {t('Next', 'التالي')}
                {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Slide-over Sheet */}
      <InvoiceCreateSheet 
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
