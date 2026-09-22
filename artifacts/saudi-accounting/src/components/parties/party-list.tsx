import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetCustomers, 
  useGetSuppliers,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey,
  customFetch
} from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Plus, Filter, MoreHorizontal, User, Building2, UploadCloud, DownloadCloud, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { PartyCreateSheet } from './party-create-sheet';
import { PartyImportSheet } from './party-import-sheet';
import { SkeletonTable } from '@/components/ui/platform-loader';

export function PartyList({ role }: { role: 'customer' | 'supplier' }) {
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
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
  };

  const isCustomer = role === 'customer';
  
  const { data: customerData, isLoading: custLoading } = useGetCustomers(orgId, queryParams as any, {
    query: { enabled: !!orgId && isCustomer, queryKey: getGetCustomersQueryKey(orgId, queryParams as any) }
  });
  
  const { data: supplierData, isLoading: suppLoading } = useGetSuppliers(orgId, queryParams as any, {
    query: { enabled: !!orgId && !isCustomer, queryKey: getGetSuppliersQueryKey(orgId, queryParams as any) }
  });

  const data = isCustomer ? customerData : supplierData;
  const isLoading = isCustomer ? custLoading : suppLoading;

  const headerTitle = isCustomer ? t('Customers', 'العملاء') : t('Suppliers', 'الموردون');
  const headerDesc = isCustomer 
    ? t('Manage the businesses and people you sell to.', 'إدارة الشركات والأشخاص الذين تبيع لهم.')
    : t('Manage the businesses and people you buy from.', 'إدارة الشركات والأشخاص الذين تشتري منهم.');

  const totalCount = data?.summary.total || 0;
  const activeCount = data?.summary.active || 0;
  const withBalanceCount = data?.summary.withBalance || 0;

  const handleExport = async () => {
    if (!orgId) return;
    try {
      setExporting(true);
      const rolePlural = isCustomer ? 'customers' : 'suppliers';
      const csvText = await customFetch<string>(`/api/organizations/${orgId}/${rolePlural}/export`, {
        method: 'GET',
        responseType: 'text'
      });
      
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rolePlural}_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      showAlert.success(
        t('Export Completed!', 'تم التصدير بنجاح!'),
        t(`Exported ${rolePlural} CSV data file successfully.`, `تم تحميل ملف CSV الخاص بـ ${rolePlural} بنجاح.`)
      );
    } catch (err: any) {
      showAlert.error(
        t('Export Failed', 'فشل التصدير'),
        err?.message || t('Could not export CSV data file.', 'تعذر تصدير ملف بيانات CSV.')
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{headerTitle}</h1>
          <p className="mt-1 text-muted-foreground text-sm">{headerDesc}</p>
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
            {isCustomer ? t('New Customer', 'عميل جديد') : t('New Supplier', 'مورد جديد')}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-card p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('Total Records', 'إجمالي السجلات')}</div>
          <div className="text-3xl font-bold text-foreground">{totalCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{t('Active Status', 'الحالة النشطة')}</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('With Balance', 'أصحاب الأرصدة')}</div>
          <div className="text-3xl font-bold text-foreground">{withBalanceCount}</div>
        </div>
      </div>

      <div className="soft-card overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={isCustomer ? t('Search customers by name, CR, VAT or email...', 'البحث في العملاء بالاسم، السجل، الرقم الضريبي...') : t('Search suppliers...', 'البحث في الموردين...')} 
              className="field pl-9 rtl:pl-3 rtl:pr-9 bg-background h-10" 
            />
          </div>
          <div className="flex gap-2">
            <select className="field bg-background h-10 w-full sm:w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">{t('All Statuses', 'جميع الحالات')}</option>
              <option value="active">{t('Active', 'نشط')}</option>
              <option value="inactive">{t('Inactive', 'غير نشط')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{isCustomer ? t('Loading Customer Profiles & ZATCA Tax IDs...', 'جاري تحميل ملفات العملاء والأرقام الضريبية...') : t('Loading Supplier Profiles & CR Numbers...', 'جاري تحميل ملفات الموردين والسجلات التجارية...')}</span>
            </div>
            <SkeletonTable rows={5} />
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              {isCustomer ? <User size={28} /> : <Building2 size={28} />}
            </div>
            <h3 className="text-lg font-bold mb-2">
              {isCustomer ? t('No customers found.', 'لم يتم العثور على عملاء.') : t('No suppliers found.', 'لم يتم العثور على موردين.')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {isCustomer 
                ? t('Add your first customer profile or import CSV data to start issuing ZATCA invoices.', 'أضف أول ملف عميل أو استورد بيانات CSV للبدء في إصدار فواتير الزكاة.')
                : t('Add supplier profiles to track business purchase bills and expenses.', 'أضف ملفات الموردين لمتابعة فواتير ومصروفات الشراء.')}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <UploadCloud size={16} /> {t('Import CSV', 'استيراد CSV')}
              </Button>
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> {isCustomer ? t('Add Customer', 'إضافة عميل') : t('Add Supplier', 'إضافة مورد')}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border font-semibold">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">{t('Name', 'الاسم')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('Number', 'الرقم')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('Status', 'الحالة')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('Contact', 'جهة الاتصال')}</th>
                    <th className="px-5 py-3.5 font-bold">{t('City', 'المدينة')}</th>
                    <th className="px-5 py-3.5 font-bold text-right rtl:text-left">{t('Balance', 'الرصيد')}</th>
                    <th className="px-5 py-3.5 font-bold w-12 text-center">{t('Action', 'إجراء')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map(item => {
                    const partyNum = item.roles?.[0]?.partyNumber || (item as any).partyNumber || '-';
                    const isAct = item.status === 'active';
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-muted/20 transition-colors group cursor-pointer" 
                        onClick={() => setLocation(`/finance/${role}s/${item.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{item.displayName}</div>
                          {(item as any).businessNameArabic && (
                            <div className="text-xs text-muted-foreground arabic font-medium mt-0.5" dir="rtl">{(item as any).businessNameArabic}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-mono font-semibold border border-border">
                            {partyNum}
                          </span>
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
                        <td className="px-5 py-4">
                          <div className="text-foreground font-medium text-xs">{item.primaryEmail || item.primaryPhone || '-'}</div>
                          {item.primaryEmail && item.primaryPhone && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{item.primaryPhone}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground font-semibold text-xs">
                          {item.city || (item as any).city || '-'}
                        </td>
                        <td className="px-5 py-4 text-right rtl:text-left font-bold text-foreground">
                          SAR 0.00
                        </td>
                        <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="h-8 px-3 text-xs font-bold gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors border-border shadow-none" 
                            onClick={() => setLocation(`/finance/${role}s/${item.id}`)}
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
                const partyNum = item.roles?.[0]?.partyNumber || (item as any).partyNumber || '-';
                const isAct = item.status === 'active';
                return (
                  <div 
                    key={item.id} 
                    className="p-4 active:bg-muted/20 transition-colors cursor-pointer" 
                    onClick={() => setLocation(`/finance/${role}s/${item.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-foreground text-sm">{item.displayName}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded font-bold">{partyNum}</span>
                          <span>{item.partyType === 'organization' ? t('Organization', 'منشأة') : t('Individual', 'فرد')}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isAct ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isAct ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-3 text-xs text-muted-foreground">
                      <div>
                        {(item.primaryPhone || item.primaryEmail) && <div>{item.primaryPhone || item.primaryEmail}</div>}
                        {item.city && <div className="mt-0.5 font-medium">{item.city}</div>}
                      </div>
                      <div className="font-bold text-foreground text-sm">
                        SAR 0.00
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PartyCreateSheet 
        open={createOpen} 
        onOpenChange={setCreateOpen} 
        role={role}
        orgId={orgId}
        onSuccess={(partyId) => {
          setCreateOpen(false);
          setLocation(`/finance/${role}s/${partyId}`);
        }}
      />
      <PartyImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        role={role}
        orgId={orgId}
      />
    </div>
  );
}
