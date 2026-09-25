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
import { 
  Search, Plus, Filter, FileText, CheckCircle2, XCircle, Clock, 
  ArrowRight, ArrowLeft, RefreshCw, Sparkles, Wallet, Send
} from 'lucide-react';
import { QuotationCreateSheet } from './quotation-create-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';
import { RowActions } from '@/components/ui/row-actions';

interface QuotationsListProps {
  onSelectQuotation?: (id: string) => void;
}

export function QuotationsList({ onSelectQuotation }: QuotationsListProps) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
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

  // Optimized React Query config (10 mins staleTime for 0ms navigation latency)
  const { data, isLoading, refetch } = useListQuotations(orgId, queryParams as any, {
    query: { 
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            <Clock size={12} />
            {t('Draft', 'مسودة')}
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Send size={12} />
            {t('Sent', 'مرسل')}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 size={12} />
            {t('Accepted', 'مقبول')}
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle size={12} />
            {t('Declined', 'مرفوض')}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Clock size={12} />
            {t('Expired', 'منتهي')}
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
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
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Sales Estimates & Proposals', 'عروض الأسعار والمقترحات')}</span>
            </span>
            <span className="text-xs text-muted-foreground font-mono">SOCPA & ZATCA Verified</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Quotations & Price Estimates', 'عروض الأسعار')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Create, send, and manage ZATCA-compliant sales estimates and formal quotations.', 'إنشاء وإرسال وإدارة عروض الأسعار والتقديرات المعتمدة.')}
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
            <span>{t('New Quotation', 'عرض سعر جديد')}</span>
          </Button>
        </div>
      </div>

      {/* Luxury KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* Card 1: Total Quotations */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Quotations', 'إجمالي عروض الأسعار')}</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground font-mono mt-2">{summary.total}</div>
          <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Issued price estimates', 'تقديرات الأسعار المصدورة')}</div>
        </div>

        {/* Card 2: Pending / Sent */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('Pending / Sent', 'معلقة / مرسلة')}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-2">{summary.sent + summary.draft}</div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">{t('Awaiting client approval', 'في انتظار موافقة العميل')}</div>
        </div>

        {/* Card 3: Accepted */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Accepted', 'مقبولة')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">{summary.accepted}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{t('Approved by client', 'معتمدة من العميل')}</div>
        </div>

        {/* Card 4: Total Value */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Total Value', 'القيمة الإجمالية')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-mono mt-2 truncate">
            {summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-muted-foreground font-normal">{t('SAR', 'ر.س')}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Combined estimate value', 'قيمة عروض الأسعار')}</div>
        </div>
      </div>

      {/* Main Table Card with Search & Status Filter */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search by quotation #, customer name...', 'بحث برقم عرض السعر، اسم العميل...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex gap-2">
            <select className="field bg-background h-10 w-full sm:w-44 rounded-xl text-xs font-semibold cursor-pointer" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
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

        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{t('Syncing Quotations & Estimates...', 'جاري تحميل عروض الأسعار والمقترحات التجارية...')}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-black mb-1">{t('No quotations found.', 'لم يتم العثور على عروض أسعار.')}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
              {search || statusFilter 
                ? t('Try adjusting your search query or status filter options.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
                : t('Get started by creating your first sales quotation for a customer.', 'ابدأ بإنشاء أول عرض سعر لعملائك.')}
            </p>
            {!search && !statusFilter && (
              <Button className="btn-primary rounded-xl text-xs font-bold gap-2 cursor-pointer" onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> {t('Create Quotation', 'إنشاء عرض سعر')}
              </Button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">{t('Quotation #', 'رقم عرض السعر')}</th>
                    <th className="px-5 py-3.5">{t('Customer', 'العميل')}</th>
                    <th className="px-5 py-3.5">{t('Issue Date', 'تاريخ الإصدار')}</th>
                    <th className="px-5 py-3.5">{t('Valid Until', 'صالح حتى')}</th>
                    <th className="px-5 py-3.5 text-right rtl:text-left">{t('Total Amount', 'المبلغ الإجمالي')}</th>
                    <th className="px-5 py-3.5">{t('Status', 'الحالة')}</th>
                    <th className="px-5 py-3.5 w-24 text-center">{t('Action', 'إجراء')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {quotations.map((qt: Quotation) => (
                    <tr 
                      key={qt.id} 
                      className="hover:bg-primary/5 transition-colors group cursor-pointer" 
                      onClick={() => handleRowClick(qt.id)}
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-primary text-xs font-mono font-extrabold border border-border group-hover:border-primary/40">
                          {qt.quotationNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{qt.customerName || t('Customer', 'عميل')}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground font-semibold text-xs">
                        {new Date(qt.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground font-semibold text-xs">
                        {qt.validUntilDate ? new Date(qt.validUntilDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-foreground text-sm">
                        SAR {Number(qt.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(qt.status)}
                      </td>
                      <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                        <RowActions
                          onView={() => handleRowClick(qt.id)}
                          onEdit={() => setEditQuotation(qt)}
                          onDelete={() => handleDeleteQuotation(qt.id, qt.quotationNumber)}
                          viewLabel={t('View Quotation', 'عرض عرض السعر')}
                          editLabel={t('Edit Quotation', 'تعديل عرض السعر')}
                          deleteLabel={t('Delete Quotation', 'حذف عرض السعر')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-border">
              {quotations.map((qt: Quotation) => (
                <div 
                  key={qt.id} 
                  className="p-4 active:bg-primary/5 transition-colors cursor-pointer space-y-3 hover:bg-muted/20" 
                  onClick={() => handleRowClick(qt.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-foreground text-sm truncate">{qt.customerName || t('Customer', 'عميل')}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center flex-wrap">
                        <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary">{qt.quotationNumber}</span>
                        {getStatusBadge(qt.status)}
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()} className="shrink-0">
                      <RowActions
                        onView={() => handleRowClick(qt.id)}
                        onEdit={() => setEditQuotation(qt)}
                        onDelete={() => handleDeleteQuotation(qt.id, qt.quotationNumber)}
                        viewLabel={t('View', 'عرض')}
                        editLabel={t('Edit', 'تعديل')}
                        deleteLabel={t('Delete', 'حذف')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2.5 border-t border-border/60">
                    <div className="font-semibold text-muted-foreground">
                      {t('Date:', 'التاريخ:')} <span className="text-foreground">{new Date(qt.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="font-mono font-black text-foreground text-sm tracking-tight text-right">
                      SAR {Number(qt.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {t('Page', 'صفحة')} {currentPage} {t('of', 'من')} {totalPages} ({totalItems} {t('items', 'عنصر')})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
              >
                {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                {t('Previous', 'السابق')}
              </Button>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
              >
                {t('Next', 'التالي')}
                {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Slide-over Sheet */}
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
