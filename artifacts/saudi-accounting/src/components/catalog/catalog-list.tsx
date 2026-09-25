import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useListCatalogItems,
  useListCatalogUnits,
  exportCatalogItems,
  getListCatalogItemsQueryKey,
  getListCatalogUnitsQueryKey,
  customFetch
} from '@workspace/api-client-react';
import type { CatalogItem, CatalogItemType, CatalogItemStatus } from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { 
  Search, Plus, UploadCloud, DownloadCloud, RefreshCw, Sparkles, ShieldCheck 
} from 'lucide-react';
import { CatalogCreateSheet } from './catalog-create-sheet';
import { CatalogImportSheet } from './catalog-import-sheet';
import { CatalogKpiCards } from './catalog-kpi-cards';
import { CatalogTable } from './catalog-table';
import { queryClient } from '@/lib/queryClient';

export function CatalogList() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CatalogItemStatus | ''>('');
  const [type, setType] = useState<CatalogItemType | ''>('');
  const [taxCategory, setTaxCategory] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  
  const [createOpen, setCreateOpen] = useState(() => {
    return new URLSearchParams(window.location.search).has('new');
  });

  const [importOpen, setImportOpen] = useState(false);

  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
    status: status || undefined,
    type: type || undefined,
    taxCategory: taxCategory || undefined,
  };

  // Optimized React Query config (10 mins staleTime for 0ms navigation latency)
  const { data, isLoading, refetch } = useListCatalogItems(orgId, queryParams as any, {
    query: { 
      enabled: Boolean(orgId),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: getListCatalogItemsQueryKey(orgId, queryParams as any) 
    }
  });

  const { data: units } = useListCatalogUnits(orgId, {
    query: { 
      enabled: Boolean(orgId), 
      staleTime: 10 * 60 * 1000,
      queryKey: getListCatalogUnitsQueryKey(orgId) 
    }
  });

  const totalCount = data?.summary?.total || 0;
  const productsCount = data?.summary?.products || 0;
  const servicesCount = data?.summary?.services || 0;
  const activeCount = data?.summary?.active || 0;

  const rawItems: CatalogItem[] = data?.items ?? [];
  const items: CatalogItem[] = rawItems.filter((i: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!i.name?.toLowerCase().includes(q) && !i.code?.toLowerCase().includes(q)) return false;
    }
    if (status && i.status !== status) return false;
    if (type && i.type !== type) return false;
    return true;
  });

  const totalItems = data?.total || rawItems.length;
  const currentPage = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!orgId) return;
    const confirmed = await showAlert.confirm(
      t(`Delete Catalog Item ${itemName}?`, `حذف الصنف ${itemName}؟`),
      t(`Are you sure you want to delete ${itemName}? This action cannot be undone.`, `هل أنت تأكد من رغبتك في حذف ${itemName}؟ لا يمكن التراجع عن هذا الإجراء.`),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    // Optimistically update React Query cache for 0ms instant UI removal
    const queryKey = getListCatalogItemsQueryKey(orgId, queryParams as any);
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData || !oldData.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.filter((item: any) => item.id !== itemId),
        total: Math.max(0, (oldData.total || 1) - 1),
      };
    });

    showAlert.toast(
      t('Catalog Item Deleted Successfully!', 'تم حذف الصنف بنجاح!'),
      'success'
    );

    try {
      await customFetch(`/api/organizations/${orgId}/catalog-items/${itemId}`, {
        method: 'DELETE'
      });
      queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
    } catch {
      queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportCatalogItems(orgId, {
        search: queryParams.search,
        type: queryParams.type as any,
        status: queryParams.status as any,
        taxCategory: queryParams.taxCategory as any,
      });
      const url = URL.createObjectURL(new Blob([blob as any]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert.success(
        t('Export Successful!', 'تم التصدير بنجاح!'),
        t('Catalog CSV data file has been downloaded.', 'تم تحميل ملف CSV الخاص بالكتالوج.')
      );
    } catch (error: any) {
      showAlert.error(
        t('Export Failed', 'فشل التصدير'),
        error?.message || t('Failed to export catalog items', 'تعذر تصدير أصناف الكتالوج')
      );
    } finally {
      setExporting(false);
    }
  };

  const handleSelectItem = (id: string) => {
    setLocation(`/finance/items/${id}`);
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Master Catalog & Pricing', 'الكتالوج الرئيسي والأسعار')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA E-Invoice Ready
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Products & Services', 'المنتجات والخدمات')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Manage what your business sells and purchases across products & services.', 'أدر ما تبيعه وتشتريه منشأتك من المنتجات والخدمات.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 max-w-full">
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
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-primary" />
            <span>{t('Import', 'استيراد')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-primary" />
            <span>{exporting ? t('Exporting...', 'جاري التصدير...') : t('Export', 'تصدير')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-9 px-3.5 rounded-xl btn-primary shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('New Item', 'صنف جديد')}</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards Component */}
      <CatalogKpiCards 
        totalCount={totalCount}
        productsCount={productsCount}
        servicesCount={servicesCount}
        activeCount={activeCount}
      />

      {/* Main Table Card with Search & Filters */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none z-10" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search by name, SKU or code...', 'البحث في الكتالوج...')}
              className="field !pl-10 rtl:!pl-3.5 rtl:!pr-10 bg-background h-10 rounded-xl w-full text-xs font-semibold" 
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <select className="field bg-background h-10 w-full sm:w-32 rounded-xl text-xs font-semibold cursor-pointer shrink-0" value={type} onChange={e => { setType(e.target.value as CatalogItemType | ''); setPage(1); }}>
              <option value="">{t('All Types', 'جميع الأنواع')}</option>
              <option value="PRODUCT">{t('Product', 'منتج')}</option>
              <option value="SERVICE">{t('Service', 'خدمة')}</option>
            </select>
            <select className="field bg-background h-10 w-full sm:w-32 rounded-xl text-xs font-semibold cursor-pointer shrink-0" value={status} onChange={e => { setStatus(e.target.value as CatalogItemStatus | ''); setPage(1); }}>
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="ACTIVE">{t('Active', 'نشط')}</option>
              <option value="INACTIVE">{t('Inactive', 'غير نشط')}</option>
            </select>
            <select className="field bg-background h-10 w-full sm:w-36 rounded-xl text-xs font-semibold cursor-pointer shrink-0" value={taxCategory} onChange={e => { setTaxCategory(e.target.value); setPage(1); }}>
              <option value="">{t('All Taxes', 'جميع الضرائب')}</option>
              <option value="STANDARD">{t('Standard (15%)', 'الأساسية (15%)')}</option>
              <option value="ZERO_RATED">{t('Zero Rated', 'نسبة الصفر')}</option>
              <option value="EXEMPT">{t('Exempt', 'معفى')}</option>
              <option value="OUT_OF_SCOPE">{t('Out of Scope', 'خارج النطاق')}</option>
            </select>
          </div>
        </div>

        {/* Catalog Table Component */}
        <CatalogTable 
          items={items}
          units={units || []}
          isLoading={isLoading}
          search={search}
          status={status}
          type={type}
          taxCategory={taxCategory}
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={setPage}
          onSelectItem={handleSelectItem}
          onEditItem={setEditItem}
          onDeleteItem={handleDeleteItem}
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      {/* Create Item Sheet */}
      <CatalogCreateSheet 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        orgId={orgId}
        onSuccess={(itemId) => {
          setCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
          setLocation(`/finance/items/${itemId}`);
        }}
      />

      {/* Edit Item Sheet */}
      <CatalogCreateSheet 
        open={Boolean(editItem)} 
        onOpenChange={(nextOpen) => { if (!nextOpen) setEditItem(null); }} 
        orgId={orgId}
        itemId={editItem?.id}
        initialData={editItem}
        onSuccess={(itemId) => {
          setEditItem(null);
          queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
          setLocation(`/finance/items/${itemId}`);
        }}
      />

      {/* Import Sheet */}
      <CatalogImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        orgId={orgId}
      />
    </div>
  );
}
