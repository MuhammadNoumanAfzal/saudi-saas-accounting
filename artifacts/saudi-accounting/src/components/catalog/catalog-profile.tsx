import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetCatalogItem,
  useUpdateCatalogItemStatus,
  getGetCatalogItemQueryKey,
  getListCatalogItemsQueryKey,
  useListCatalogUnits,
  getListCatalogUnitsQueryKey
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, ArrowRight, Package, MoreVertical, Edit, FileCode2, Power } from 'lucide-react';
import { CatalogActivityTab } from './tabs/catalog-activity-tab';
import { CatalogCreateSheet } from './catalog-create-sheet';

export function CatalogProfile({ id }: { id: string }) {
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const rawOrgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const orgId = rawOrgId || 'demo_org_101';
  
  const [editOpen, setEditOpen] = useState(false);

  const { data: fetchedData, isLoading } = useGetCatalogItem(orgId, id, {
    query: { enabled: !!id, queryKey: getGetCatalogItemQueryKey(orgId, id) }
  });

  const data = (fetchedData && (fetchedData as any).id) ? fetchedData : (() => {
    try {
      const stored = localStorage.getItem(`nexus_catalog_${orgId}`);
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((x: any) => String(x.id) === String(id) || String(x.sku) === String(id) || String(x.name) === String(id));
        if (match) return match;
      }
    } catch (e) {}
    return {
      id: id || 'item_101',
      sku: id && id.length > 2 ? id : 'SKU-1001',
      name: 'Standard Laptop Dell XPS 15',
      nameArabic: 'كمبيوتر محمول ديل XPS 15',
      type: 'PRODUCT',
      status: 'ACTIVE',
      unitPrice: '1500.00',
      costPrice: '1200.00',
      taxRate: '15.00',
      description: 'High performance laptop suitable for enterprise accounting and management.',
      inventoryTracked: true,
      currentStock: 45
    };
  })();

  const { data: units } = useListCatalogUnits(orgId, {
    query: { enabled: !!orgId, queryKey: getListCatalogUnitsQueryKey(orgId) }
  });

  const updateStatus = useUpdateCatalogItemStatus();

  if (isLoading) {
    return (
      <div className="space-y-6 fade-up">
        <div className="flex items-center gap-4">
          <div className="shimmer h-10 w-10 rounded-xl" />
          <div className="space-y-2"><div className="shimmer h-6 w-48 rounded" /><div className="shimmer h-4 w-24 rounded" /></div>
        </div>
        <div className="shimmer h-32 w-full rounded-2xl" />
        <div className="shimmer h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold">{t('Not Found', 'غير موجود')}</h2>
        <p className="text-muted-foreground mt-2">{t('This record may have been deleted or you do not have permission to view it.', 'قد يكون هذا السجل محذوفاً أو لا تملك صلاحية لعرضه.')}</p>
        <Button className="mt-6" onClick={() => setLocation(`/finance/items`)}>{t('Go back', 'العودة')}</Button>
      </div>
    );
  }

  const handleToggleStatus = () => {
    const nextStatus = data.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateStatus.mutate({
      organizationId: orgId,
      itemId: id,
      data: { status: nextStatus }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCatalogItemQueryKey(orgId, id) });
        queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
        showAlert.success(
          nextStatus === 'ACTIVE' ? t('Item Reactivated!', 'تمت إعادة تنشيط الصنف!') : t('Item Deactivated!', 'تم إلغاء تنشيط الصنف!'),
          nextStatus === 'ACTIVE' ? t('Catalog item is now active.', 'الصنف أصبح نشطاً الآن.') : t('Catalog item is now inactive.', 'الصنف أصبح غير نشط الآن.')
        );
      },
      onError: (err: any) => {
        showAlert.error(t('Status Update Failed', 'فشل تحديث الحالة'), err?.message || t('Could not update item status.', 'تعذر تحديث حالة الصنف.'));
      }
    });
  };

  const unit = units?.find(u => u.id === data.unitId);
  const unitName = unit ? (isRtl ? unit.nameAr : unit.name) : '-';

  return (
    <div className="space-y-6 fade-up pb-12">
      <button 
        onClick={() => setLocation(`/finance/items`)} 
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {t('Back to Products & Services', 'العودة للمنتجات والخدمات')}
      </button>

      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {data.type === 'PRODUCT' ? <Package size={28} /> : <FileCode2 size={28} />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{isRtl && data.nameAr ? data.nameAr : data.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${data.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                {data.status === 'ACTIVE' ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-semibold">{data.code}</span>
              <span className="text-xs font-bold uppercase opacity-70">
                {data.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)} className="gap-2">
            <Edit size={16} />
            <span className="hidden sm:inline">{t('Edit', 'تعديل')}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="px-3"><MoreVertical size={16} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-48">
              <DropdownMenuItem onClick={handleToggleStatus} className={data.status === 'ACTIVE' ? "text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 font-medium" : "gap-2 font-medium"}>
                <Power size={14} />
                {data.status === 'ACTIVE' ? t('Deactivate', 'إلغاء التنشيط') : t('Reactivate', 'إعادة التنشيط')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4 grid-cols-2">
        <div className="soft-card p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('Sales Price', 'سعر البيع')}</div>
          <div className="text-2xl font-bold text-foreground">SAR {data.salesPrice}</div>
        </div>
        <div className="soft-card p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('Purchase Price', 'سعر الشراء')}</div>
          <div className="text-2xl font-bold text-foreground">SAR {data.purchasePrice}</div>
        </div>
        <div className="soft-card p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('Unit', 'الوحدة')}</div>
          <div className="text-2xl font-bold truncate text-foreground" title={unitName}>{unitName}</div>
        </div>
        <div className="soft-card p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('VAT Rate', 'نسبة الضريبة')}</div>
          <div className="text-2xl font-bold text-foreground">{data.taxRate}%</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b border-border mb-6">
          <TabsList className="bg-transparent h-12 p-0 space-x-6 rtl:space-x-reverse border-0 overflow-x-auto overflow-y-hidden flex-nowrap w-full justify-start rounded-none">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 bg-transparent shadow-none border-transparent text-muted-foreground data-[state=active]:text-foreground font-semibold">
              {t('Overview', 'نظرة عامة')}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 bg-transparent shadow-none border-transparent text-muted-foreground data-[state=active]:text-foreground font-semibold">
              {t('Transactions', 'العمليات')}
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 bg-transparent shadow-none border-transparent text-muted-foreground data-[state=active]:text-foreground font-semibold">
              {t('Activity', 'النشاط')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none space-y-6">
          <div className="soft-card p-6">
            <h3 className="text-lg font-bold mb-4">{t('Details', 'التفاصيل')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <div className="text-sm text-muted-foreground">{t('English Name', 'الاسم (إنجليزي)')}</div>
                <div className="font-semibold mt-1 text-foreground">{data.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('Arabic Name', 'الاسم (عربي)')}</div>
                <div className="font-semibold mt-1 text-foreground arabic" dir="rtl">{data.nameAr}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('VAT Treatment', 'المعاملة الضريبية')}</div>
                <div className="font-semibold mt-1 text-foreground">{data.taxCategory.replace('_', ' ')}</div>
              </div>
              {data.type === 'PRODUCT' && (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('Track Inventory', 'تتبع المخزون')}</div>
                    <div className="font-semibold mt-1 text-foreground">{data.trackInventory ? t('Yes', 'نعم') : t('No', 'لا')}</div>
                  </div>
                  {data.sku && (
                    <div>
                      <div className="text-sm text-muted-foreground">{t('SKU', 'رمز التخزين')}</div>
                      <div className="font-semibold mt-1 font-mono text-foreground">{data.sku}</div>
                    </div>
                  )}
                  {data.barcode && (
                    <div>
                      <div className="text-sm text-muted-foreground">{t('Barcode', 'الباركود')}</div>
                      <div className="font-semibold mt-1 font-mono text-foreground">{data.barcode}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            {(data.description || data.descriptionAr) && (
              <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">{t('Description (English)', 'الوصف (إنجليزي)')}</div>
                    <p className="text-sm whitespace-pre-wrap text-foreground">{data.description}</p>
                  </div>
                )}
                {data.descriptionAr && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">{t('Description (Arabic)', 'الوصف (عربي)')}</div>
                    <p className="text-sm whitespace-pre-wrap arabic text-foreground" dir="rtl">{data.descriptionAr}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="transactions" className="mt-0 outline-none">
          <div className="soft-card p-12 text-center flex flex-col items-center justify-center border-dashed">
            <h3 className="text-lg font-bold mb-2">{t('No transactions yet.', 'لا توجد عمليات بعد.')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {t('Future invoices, quotations, purchases and inventory movements will appear here.', 'ستظهر الفواتير وعروض الأسعار والمشتريات وحركات المخزون المستقبلية هنا.')}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="activity" className="mt-0 outline-none">
          <CatalogActivityTab entityId={id} orgId={orgId} />
        </TabsContent>
      </Tabs>

      <CatalogCreateSheet 
        open={editOpen}
        onOpenChange={setEditOpen}
        orgId={orgId}
        mode="edit"
        initialData={data}
        onSuccess={() => setEditOpen(false)}
      />
    </div>
  );
}
