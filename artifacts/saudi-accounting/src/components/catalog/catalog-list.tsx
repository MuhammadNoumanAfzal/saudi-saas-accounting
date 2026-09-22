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
  getListCatalogUnitsQueryKey
} from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Plus, Filter, MoreHorizontal, Package, FileCode2, UploadCloud, DownloadCloud, Eye } from 'lucide-react';
import { CatalogCreateSheet } from './catalog-create-sheet';
import { CatalogImportSheet } from './catalog-import-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';
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
  const [exporting, setExporting] = useState(false);
  
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

  return (
    <div className="space-y-6 fade-up pb-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Products & Services', 'المنتجات والخدمات')}</h1>
          <p className="mt-1 text-muted-foreground text-sm">{t('Manage what your business sells and purchases.', 'أدر ما تبيعه وتشتريه منشأتك.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)} title={t('Import', 'استيراد')} className="gap-2">
            <UploadCloud size={16} />
            <span className="hidden sm:inline">{t('Import', 'استيراد')}</span>
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={exporting} title={t('Export', 'تصدير')} className="gap-2">
            <DownloadCloud size={16} />
            <span className="hidden sm:inline">{exporting ? t('Exporting...', 'جاري التصدير...') : t('Export', 'تصدير')}</span>
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus size={16} />
            {t('New Item', 'صنف جديد')}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4 grid-cols-2">
        <div className="soft-card p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('Total Items', 'إجمالي الأصناف')}</div>
          <div className="text-3xl font-bold text-foreground">{totalCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('Products', 'المنتجات')}</div>
          <div className="text-3xl font-bold text-foreground">{productsCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('Services', 'الخدمات')}</div>
          <div className="text-3xl font-bold text-foreground">{servicesCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{t('Active', 'النشطة')}</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
        </div>
      </div>

      <div className="soft-card overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-3 text-muted-foreground rtl:left-auto rtl:right-3 pointer-events-none" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={t('Search products and services by name, SKU or code...', 'البحث في المنتجات والخدمات...')} 
              className="field pl-9 rtl:pl-3 rtl:pr-9 bg-background h-10 w-full" 
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="field bg-background h-10 w-auto text-xs font-semibold" value={type} onChange={e => { setType(e.target.value as CatalogItemType | ''); setPage(1); }}>
              <option value="">{t('All Types', 'جميع الأنواع')}</option>
              <option value="PRODUCT">{t('Product', 'منتج')}</option>
              <option value="SERVICE">{t('Service', 'خدمة')}</option>
            </select>
            <select className="field bg-background h-10 w-auto text-xs font-semibold" value={status} onChange={e => { setStatus(e.target.value as CatalogItemStatus | ''); setPage(1); }}>
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="ACTIVE">{t('Active', 'نشط')}</option>
              <option value="INACTIVE">{t('Inactive', 'غير نشط')}</option>
            </select>
            <select className="field bg-background h-10 w-auto text-xs font-semibold" value={taxCategory} onChange={e => { setTaxCategory(e.target.value); setPage(1); }}>
              <option value="">{t('All Taxes', 'جميع الضرائب')}</option>
              <option value="STANDARD">{t('Standard (15%)', 'الأساسية (15%)')}</option>
              <option value="ZERO_RATED">{t('Zero Rated', 'نسبة الصفر')}</option>
              <option value="EXEMPT">{t('Exempt', 'معفى')}</option>
              <option value="OUT_OF_SCOPE">{t('Out of Scope', 'خارج النطاق')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{t('Fetching Master Catalog, Products & Services Pricing...', 'جاري تحميل الكتالوج الرئيسي والأسعار...')}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Package size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {t('No products or services found.', 'لم يتم العثور على منتجات أو خدمات.')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {t('Add items to your master catalog to issue ZATCA e-invoices and track purchase bills.', 'أضف أصنافا إلى الكتالوج الرئيسي لإصدار فواتير إلكترونية ومتابعة فواتير الشراء.')}
            </p>
            <Button variant="primary" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus size={16} />
              {t('Add Item', 'إضافة صنف')}
            </Button>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border font-semibold">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">{t('Item', 'الصنف')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('Code', 'الرمز')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('Type', 'النوع')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('Unit', 'الوحدة')}</th>
                    <th className="px-5 py-3.5 font-bold text-right rtl:text-left">{t('Sales Price', 'سعر البيع')}</th>
                    <th className="px-5 py-3.5 font-bold text-right rtl:text-left">{t('Purchase Price', 'سعر الشراء')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('VAT', 'الضريبة')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('Status', 'الحالة')}</th>
                    <th className="px-5 py-3.5 font-bold w-12 text-center">{t('Action', 'إجراء')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map(item => {
                    const unit = units?.find(u => u.id === item.unitId);
                    const isAct = item.status === 'ACTIVE';
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-muted/20 transition-colors group cursor-pointer" 
                        onClick={() => setLocation(`/finance/items/${item.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {item.name}
                          </div>
                          {item.nameAr && (
                            <div className="text-xs text-muted-foreground arabic font-medium mt-0.5" dir="rtl">{item.nameAr}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground text-xs font-mono font-semibold border border-border">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
                            {item.type === 'PRODUCT' ? <Package size={12} /> : <FileCode2 size={12} />}
                            {item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-xs text-muted-foreground">
                          {unit ? (isRtl ? unit.nameAr : unit.name) : '-'}
                        </td>
                        <td className="px-5 py-4 text-right rtl:text-left font-bold text-foreground">
                          SAR {Number(item.salesPrice).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right rtl:text-left font-bold text-foreground">
                          SAR {Number(item.purchasePrice).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-xs text-muted-foreground">
                          {item.taxRate}%
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isAct 
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            {isAct ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="h-8 px-3 text-xs font-bold gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors border-border shadow-none" 
                            onClick={() => setLocation(`/finance/items/${item.id}`)}
                          >
                            <Eye size={14} />
                            {t('View', 'عرض')}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {data.items.map(item => {
                const unit = units?.find(u => u.id === item.unitId);
                const isAct = item.status === 'ACTIVE';
                return (
                  <div 
                    key={item.id} 
                    className="p-4 active:bg-muted/20 transition-colors cursor-pointer" 
                    onClick={() => setLocation(`/finance/items/${item.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-foreground text-sm">{isRtl && item.nameAr ? item.nameAr : item.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded font-bold">{item.code}</span>
                          <span>{item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}</span>
                          {unit && <span>· {isRtl ? unit.nameAr : unit.name}</span>}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isAct ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isAct ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-3 text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <div><span className="opacity-70">{t('Sales', 'البيع')}:</span> <span className="font-bold text-foreground">SAR {item.salesPrice}</span></div>
                        <div><span className="opacity-70">{t('Purchases', 'الشراء')}:</span> <span className="font-bold text-foreground">SAR {item.purchasePrice}</span></div>
                      </div>
                      <Button variant="secondary" size="sm" className="h-8 px-3 text-xs font-bold gap-1">
                        <Eye size={14} />
                        {t('View', 'عرض')}
                      </Button>
                    </div>
                  </div>
                );
              })}
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
