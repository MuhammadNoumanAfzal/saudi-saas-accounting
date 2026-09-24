import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListQuotations,
  getListQuotationsQueryKey,
  customFetch
} from '@workspace/api-client-react';
import type { Quotation } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Plus, Filter, FileText, Eye, CheckCircle2, XCircle, Clock, ArrowRight, ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { QuotationCreateSheet } from './quotation-create-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';

interface QuotationsListProps {
  onSelectQuotation?: (id: string) => void;
}

export function QuotationsList({ onSelectQuotation }: QuotationsListProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  
  const [createOpen, setCreateOpen] = useState(() => {
    return new URLSearchParams(window.location.search).has('new');
  });

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    status: (statusFilter as any) || undefined,
  };

  const { data, isLoading, refetch } = useListQuotations(orgId, queryParams as any, {
    query: { 
      enabled: Boolean(orgId), 
      queryKey: getListQuotationsQueryKey(orgId, queryParams as any) 
    }
  });

  const rawQuotations = data?.items ?? [];
  const quotations: Quotation[] = rawQuotations.filter((q: any) => {
    if (search) {
      const s = search.toLowerCase();
      if (!q.quotationNumber?.toLowerCase().includes(s) && !q.customerName?.toLowerCase().includes(s)) return false;
    }
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });
  const totalItems = data?.total || rawQuotations.length;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const summary = {
    total: totalItems,
    draft: quotations.filter(q => q.status === 'DRAFT').length,
    sent: quotations.filter(q => q.status === 'SENT').length,
    accepted: quotations.filter(q => q.status === 'ACCEPTED').length,
    totalValue: quotations.reduce((acc, q) => acc + (parseFloat(q.totalAmount) || 0), 0)
  };

  const handleDeleteQuotation = async (id: string, number: string) => {
    if (!orgId) return;
    const confirmed = await showAlert.confirm(
      t(`Delete Quotation ${number}?`, `حذف عرض السعر ${number}؟`),
      t(`Are you sure you want to delete quotation ${number}? This action cannot be undone.`, `هل أنت تأكد من رغبتك في حذف عرض السعر ${number}؟ لا يمكن التراجع عن هذا الإجراء.`),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    // Optimistically update React Query cache for 0ms instant UI removal
    const queryKey = getListQuotationsQueryKey(orgId, queryParams as any);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.filter((item: any) => item.id !== id),
        total: Math.max(0, (oldData.total || 1) - 1),
      };
    });

    showAlert.toast(
      t('Quotation Deleted Successfully!', 'تم حذف عرض السعر بنجاح!'),
      'success'
    );

    try {
      await customFetch(`/api/organizations/${orgId}/quotations/${id}`, {
        method: 'DELETE'
      });
      queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey(orgId) });
    } catch {
      queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey(orgId) });
    }
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
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock size={12} />
            {t('Sent', 'مرسل')}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={12} />
            {t('Accepted', 'مقبول')}
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle size={12} />
            {t('Declined', 'مرفوض')}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock size={12} />
            {t('Expired', 'منتهي')}
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <CheckCircle2 size={12} />
            {t('Converted', 'محوّل لفاتورة')}
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  const handleRowClick = (id: string) => {
    if (onSelectQuotation) {
      onSelectQuotation(id);
    } else {
      setLocation(`/finance/quotations/${id}`);
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('Quotations & Price Estimates', 'عروض الأسعار')}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {t(
              'Create, send, and manage ZATCA-compliant sales estimates and formal quotations.',
              'إنشاء وإرسال وإدارة عروض الأسعار والتقديرات المعتمدة.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="gap-2 shadow-sm">
            <Plus size={16} />
            {t('New Quotation', 'عرض سعر جديد')}
          </Button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Total Quotations', 'إجمالي عروض الأسعار')}</div>
          <div className="text-2xl font-bold text-foreground">{summary.total}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Pending / Sent', 'معلقة / مرسلة')}</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.sent + summary.draft}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Accepted', 'مقبولة')}</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.accepted}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Total Value', 'القيمة الإجمالية')}</div>
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
              placeholder={t('Search by quotation #, customer name...', 'بحث برقم عرض السعر، اسم العميل...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={16} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-background border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="DRAFT">{t('Draft', 'مسودة')}</option>
              <option value="SENT">{t('Sent', 'مرسل')}</option>
              <option value="ACCEPTED">{t('Accepted', 'مقبول')}</option>
              <option value="DECLINED">{t('Declined', 'مرفوض')}</option>
              <option value="EXPIRED">{t('Expired', 'منتهي')}</option>
              <option value="CONVERTED">{t('Converted', 'محوّل لفاتورة')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="soft-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{t('Fetching Commercial Quotations & Proposals...', 'جاري تحميل عروض الأسعار والمقترحات التجارية...')}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-muted-foreground/40 mb-3" size={48} />
            <h3 className="text-lg font-medium text-foreground">{t('No quotations found', 'لا توجد عروض أسعار')}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {search || statusFilter 
                ? t('Try adjusting your search query or filter options.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
                : t('Get started by creating your first sales quotation for a customer.', 'ابدأ بإنشاء أول عرض سعر لعملائك.')}
            </p>
            {!search && !statusFilter && (
              <Button variant="primary" onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
                <Plus size={16} />
                {t('Create Quotation', 'إنشاء عرض سعر')}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="p-4">{t('Quotation #', 'رقم عرض السعر')}</th>
                  <th className="p-4">{t('Customer', 'العميل')}</th>
                  <th className="p-4">{t('Issue Date', 'تاريخ الإصدار')}</th>
                  <th className="p-4">{t('Valid Until', 'صالح حتى')}</th>
                  <th className="p-4">{t('Total Amount', 'المبلغ الإجمالي')}</th>
                  <th className="p-4">{t('Status', 'الحالة')}</th>
                  <th className="p-4 text-right">{t('Action', 'الإجراء')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotations.map((qt: Quotation) => (
                  <tr 
                    key={qt.id}
                    onClick={() => handleRowClick(qt.id)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-medium text-primary">
                      {qt.quotationNumber}
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {qt.customerName || t('Customer', 'عميل')}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(qt.issueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {qt.validUntilDate ? new Date(qt.validUntilDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {Number(qt.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">{t('SAR', 'ر.س')}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(qt.status)}
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          onClick={() => handleRowClick(qt.id)}
                          className="gap-1 text-xs py-1 px-2.5"
                        >
                          <Eye size={14} />
                          {t('View', 'عرض')}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setEditQuotation(qt)}
                          className="gap-1 text-xs py-1 px-2.5"
                          title={t('Edit', 'تعديل')}
                        >
                          <Pencil size={14} />
                          {t('Edit', 'تعديل')}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleDeleteQuotation(qt.id, qt.quotationNumber)}
                          className="gap-1 text-xs py-1 px-2 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          title={t('Delete', 'حذف')}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
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
      <QuotationCreateSheet 
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey(orgId) });
          refetch();
        }}
      />
      <QuotationCreateSheet
        open={Boolean(editQuotation)}
        onOpenChange={(nextOpen) => { if (!nextOpen) setEditQuotation(null); }}
        quotationId={editQuotation?.id}
        initialData={editQuotation}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey(orgId) });
          refetch();
          setEditQuotation(null);
        }}
      />
    </div>
  );
}
