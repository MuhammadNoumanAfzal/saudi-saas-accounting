import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useListCatalogItems,
  useListCatalogUnits,
  exportCatalogItems,
  getListCatalogItemsQueryKey,
  getListCatalogUnitsQueryKey
} from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Plus, Filter, MoreHorizontal, Package, FileCode2, UploadCloud, DownloadCloud } from 'lucide-react';
import { CatalogCreateSheet } from './catalog-create-sheet';
import { CatalogImportSheet } from './catalog-import-sheet';
import type { CatalogItemType, CatalogItemStatus } from '@workspace/api-client-react';

export function CatalogList() {
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CatalogItemStatus | ''>('');
  const [type, setType] = useState<CatalogItemType | ''>('');
  const [taxCategory, setTaxCategory] = useState<string>('');
  
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

  const { data, isLoading } = useListCatalogItems(orgId, queryParams as any, {
    query: { enabled: !!orgId, queryKey: getListCatalogItemsQueryKey(orgId, queryParams as any) }
  });

  const { data: units } = useListCatalogUnits(orgId, {
    query: { enabled: !!orgId, queryKey: getListCatalogUnitsQueryKey(orgId) }
  });

  const totalCount = data?.summary.total || 0;
  const productsCount = data?.summary.products || 0;
  const servicesCount = data?.summary.services || 0;
  const activeCount = data?.summary.active || 0;

  const handleExport = async () => {
    try {
      const blob = await exportCatalogItems(orgId, {
        search: queryParams.search,
        type: queryParams.type as any,
        status: queryParams.status as any,
        taxCategory: queryParams.taxCategory as any,
      });
      const url = URL.createObjectURL(new Blob([blob as any]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog_export.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export catalog items', error);
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Products & Services', 'المنتجات والخدمات')}</h1>
          <p className="mt-1 text-muted-foreground text-sm">{t('Manage what your business sells and purchases.', 'أدر ما تبيعه وتشتريه منشأتك.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)} title={t('Import', 'استيراد')}>
            <UploadCloud size={16} />
            <span className="hidden sm:inline">{t('Import', 'استيراد')}</span>
          </Button>
          <Button variant="secondary" onClick={handleExport} title={t('Export', 'تصدير')}>
            <DownloadCloud size={16} />
            <span className="hidden sm:inline">{t('Export', 'تصدير')}</span>
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            {t('New Item', 'صنف جديد')}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4 grid-cols-2">
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Total Items', 'إجمالي الأصناف')}</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Products', 'المنتجات')}</div>
          <div className="text-2xl font-bold">{productsCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Services', 'الخدمات')}</div>
          <div className="text-2xl font-bold">{servicesCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Active', 'النشطة')}</div>
          <div className="text-2xl font-bold">{activeCount}</div>
        </div>
      </div>

      <div className="soft-card overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search products and services...', 'البحث في المنتجات والخدمات...')} 
              className="field pl-9 rtl:pl-3 rtl:pr-9 bg-background h-10" 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="field bg-background h-10 w-full sm:w-auto" value={type} onChange={e => { setType(e.target.value as CatalogItemType | ''); setPage(1); }}>
              <option value="">{t('All Types', 'جميع الأنواع')}</option>
              <option value="PRODUCT">{t('Product', 'منتج')}</option>
              <option value="SERVICE">{t('Service', 'خدمة')}</option>
            </select>
            <select className="field bg-background h-10 w-full sm:w-auto" value={status} onChange={e => { setStatus(e.target.value as CatalogItemStatus | ''); setPage(1); }}>
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="ACTIVE">{t('Active', 'نشط')}</option>
              <option value="INACTIVE">{t('Inactive', 'غير نشط')}</option>
            </select>
            <select className="field bg-background h-10 w-full sm:w-auto" value={taxCategory} onChange={e => { setTaxCategory(e.target.value); setPage(1); }}>
              <option value="">{t('All Taxes', 'جميع الضرائب')}</option>
              <option value="STANDARD">{t('Standard (15%)', 'الأساسية (15%)')}</option>
              <option value="ZERO_RATED">{t('Zero Rated', 'نسبة الصفر')}</option>
              <option value="EXEMPT">{t('Exempt', 'معفى')}</option>
              <option value="OUT_OF_SCOPE">{t('Out of Scope', 'خارج النطاق')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1,2,3].map(i => <div key={i} className="shimmer h-12 w-full rounded-xl" />)}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Package size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {t('No products or services yet.', 'لا توجد منتجات أو خدمات بعد.')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {t('Add the items you sell or purchase to use them in quotations and invoices.', 'أضف الأصناف التي تبيعها أو تشتريها لاستخدامها في عروض الأسعار والفواتير.')}
            </p>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              {t('Add Item', 'إضافة صنف')}
            </Button>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('Item', 'الصنف')}</th>
                    <th className="px-4 py-3 font-medium">{t('Code', 'الرمز')}</th>
                    <th className="px-4 py-3 font-medium">{t('Type', 'النوع')}</th>
                    <th className="px-4 py-3 font-medium">{t('Unit', 'الوحدة')}</th>
                    <th className="px-4 py-3 font-medium text-right rtl:text-left">{t('Sales Price', 'سعر البيع')}</th>
                    <th className="px-4 py-3 font-medium text-right rtl:text-left">{t('Purchase Price', 'سعر الشراء')}</th>
                    <th className="px-4 py-3 font-medium">{t('VAT', 'الضريبة')}</th>
                    <th className="px-4 py-3 font-medium">{t('Status', 'الحالة')}</th>
                    <th className="px-4 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map(item => {
                    const unit = units?.find(u => u.id === item.unitId);
                    return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => setLocation(`/finance/items/${item.id}`)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{isRtl && item.nameAr ? item.nameAr : item.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex px-2 py-0.5 rounded bg-muted text-xs font-mono">{item.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">{item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">{unit ? (isRtl ? unit.nameAr : unit.name) : '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-right rtl:text-left font-semibold">
                        SAR {item.salesPrice}
                      </td>
                      <td className="px-4 py-3 text-right rtl:text-left font-semibold">
                        SAR {item.purchasePrice}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">{item.taxRate}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                          {item.status === 'ACTIVE' ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); setLocation(`/finance/items/${item.id}`); }}>
                          <MoreHorizontal size={16} />
                        </Button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {data.items.map(item => {
                const unit = units?.find(u => u.id === item.unitId);
                return (
                <div key={item.id} className="p-4 active:bg-muted/20 transition-colors cursor-pointer" onClick={() => setLocation(`/finance/items/${item.id}`)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-foreground">{isRtl && item.nameAr ? item.nameAr : item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 items-center">
                        <span className="font-mono bg-muted/50 px-1 rounded">{item.code}</span>
                        <span>{item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}</span>
                        {unit && <span>· {isRtl ? unit.nameAr : unit.name}</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {item.status === 'ACTIVE' ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-4 text-xs text-muted-foreground">
                    <div className="space-y-1">
                      <div><span className="opacity-70">{t('Sales', 'البيع')}:</span> <span className="font-bold text-foreground">SAR {item.salesPrice}</span></div>
                      <div><span className="opacity-70">{t('Purchases', 'الشراء')}:</span> <span className="font-bold text-foreground">SAR {item.purchasePrice}</span></div>
                    </div>
                    <MoreHorizontal size={16} />
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>

      <CatalogCreateSheet 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        orgId={orgId}
        onSuccess={(itemId) => {
          setCreateOpen(false);
          setLocation(`/finance/items/${itemId}`);
        }}
      />
      <CatalogImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        orgId={orgId}
      />
    </div>
  );
}
