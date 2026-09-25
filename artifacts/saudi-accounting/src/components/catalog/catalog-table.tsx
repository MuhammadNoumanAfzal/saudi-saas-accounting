import { useTranslation, Button } from '@/lib/utils';
import type { CatalogItem, CatalogUnit } from '@workspace/api-client-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { RowActions } from '@/components/ui/row-actions';
import { 
  Package, FileCode2, Plus, ArrowRight, ArrowLeft 
} from 'lucide-react';

interface CatalogTableProps {
  items: CatalogItem[];
  units: CatalogUnit[];
  isLoading: boolean;
  search: string;
  status: string;
  type: string;
  taxCategory: string;
  page: number;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  onSelectItem: (id: string) => void;
  onEditItem?: (item: CatalogItem) => void;
  onDeleteItem?: (id: string, name: string) => void;
  onCreateClick: () => void;
}

export function CatalogTable({
  items,
  units,
  isLoading,
  search,
  status,
  type,
  taxCategory,
  page,
  totalPages,
  totalItems,
  currentPage,
  onPageChange,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onCreateClick,
}: CatalogTableProps) {
  const { t, isRtl } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{t('Fetching Master Catalog, Products & Services Pricing...', 'جاري تحميل الكتالوج الرئيسي والأسعار...')}</span>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
          <Package size={28} />
        </div>
        <h3 className="text-lg font-black mb-1">{t('No products or services found.', 'لم يتم العثور على منتجات أو خدمات.')}</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {search || status || type || taxCategory 
            ? t('Try adjusting your search query or filter options.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
            : t('Add items to your master catalog to issue ZATCA e-invoices and track purchase bills.', 'أضف أصنافا إلى الكتالوج الرئيسي لإصدار فواتير إلكترونية ومتابعة فواتير الشراء.')}
        </p>
        {!search && !status && !type && !taxCategory && (
          <Button className="btn-primary rounded-xl text-xs font-bold gap-2 cursor-pointer" onClick={onCreateClick}>
            <Plus size={16} /> {t('Add Item', 'إضافة صنف')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left rtl:text-right">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Item', 'الصنف')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Code', 'الرمز')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Type', 'النوع')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Sales Price', 'سعر البيع')}</th>
              <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Purchase Price', 'سعر الشراء')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('VAT', 'الضريبة')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Status', 'الحالة')}</th>
              <th className="px-5 py-3.5 w-24 text-center whitespace-nowrap">{t('Action', 'إجراء')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {items.map((item: CatalogItem) => {
              const isAct = item.status === 'ACTIVE';
              return (
                <tr 
                  key={item.id} 
                  className="hover:bg-primary/5 transition-colors group cursor-pointer" 
                  onClick={() => onSelectItem(item.id)}
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                      {item.name}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-primary text-xs font-mono font-extrabold border border-border group-hover:border-primary/40 whitespace-nowrap">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-foreground border border-border whitespace-nowrap">
                      {item.type === 'PRODUCT' ? <Package size={12} className="text-muted-foreground" /> : <FileCode2 size={12} className="text-muted-foreground" />}
                      <span>{item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right rtl:text-left font-mono font-extrabold text-foreground text-sm whitespace-nowrap">
                    SAR {Number(item.salesPrice).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right rtl:text-left font-mono font-bold text-muted-foreground text-xs whitespace-nowrap">
                    SAR {Number(item.purchasePrice).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 font-semibold text-xs text-muted-foreground whitespace-nowrap">
                    {item.taxRate}%
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isAct 
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' 
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      {isAct ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <RowActions
                      onView={() => onSelectItem(item.id)}
                      onEdit={onEditItem ? () => onEditItem(item) : undefined}
                      onDelete={onDeleteItem ? () => onDeleteItem(item.id, item.name) : undefined}
                      viewLabel={t('View Item', 'عرض الصنف')}
                      editLabel={t('Edit Item', 'تعديل الصنف')}
                      deleteLabel={t('Delete Item', 'حذف الصنف')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="md:hidden divide-y divide-border">
        {items.map((item: CatalogItem) => {
          const unit = units?.find(u => u.id === item.unitId);
          const isAct = item.status === 'ACTIVE';
          return (
            <div 
              key={item.id} 
              className="p-4 active:bg-primary/5 transition-colors cursor-pointer space-y-3 hover:bg-muted/20" 
              onClick={() => onSelectItem(item.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-foreground text-sm truncate">{isRtl && item.nameAr ? item.nameAr : item.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center flex-wrap">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary whitespace-nowrap">{item.code}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-foreground border border-border whitespace-nowrap">
                      {item.type === 'PRODUCT' ? <Package size={10} /> : <FileCode2 size={10} />}
                      <span>{item.type === 'PRODUCT' ? t('Product', 'منتج') : t('Service', 'خدمة')}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isAct ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      {isAct ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                    </span>
                  </div>
                </div>
                <div onClick={e => e.stopPropagation()} className="shrink-0">
                  <RowActions
                    onView={() => onSelectItem(item.id)}
                    onEdit={onEditItem ? () => onEditItem(item) : undefined}
                    onDelete={onDeleteItem ? () => onDeleteItem(item.id, item.name) : undefined}
                    viewLabel={t('View', 'عرض')}
                    editLabel={t('Edit', 'تعديل')}
                    deleteLabel={t('Delete', 'حذف')}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2.5 border-t border-border/60">
                <div className="space-y-0.5 font-semibold">
                  <div><span className="opacity-70">{t('Sales:', 'البيع:')}</span> <span className="font-bold text-foreground">SAR {Number(item.salesPrice).toFixed(2)}</span></div>
                  <div><span className="opacity-70">{t('Purchase:', 'الشراء:')}</span> <span className="font-bold text-foreground">SAR {Number(item.purchasePrice).toFixed(2)}</span></div>
                </div>
                {unit && (
                  <div className="font-semibold text-muted-foreground text-xs">
                    {isRtl ? unit.nameAr : unit.name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {t('Page', 'صفحة')} {currentPage} {t('of', 'من')} {totalPages} ({totalItems} {t('items', 'عنصر')})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              {t('Previous', 'السابق')}
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="py-1.5 px-3 text-xs font-bold rounded-xl cursor-pointer"
            >
              {t('Next', 'التالي')}
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
