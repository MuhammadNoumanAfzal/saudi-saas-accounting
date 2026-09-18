import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { 
  useGetCurrentSession, 
  useGetCustomers, 
  useGetSuppliers,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey
} from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, Plus, Filter, MoreHorizontal, User, Building2, UploadCloud, DownloadCloud } from 'lucide-react';
import { PartyCreateSheet } from './party-create-sheet';
import { PartyImportSheet } from './party-import-sheet';

export function PartyList({ role }: { role: 'customer' | 'supplier' }) {
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  
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

  return (
    <div className="space-y-6 fade-up pb-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{headerTitle}</h1>
          <p className="mt-1 text-muted-foreground text-sm">{headerDesc}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)} title={t('Import', 'استيراد')}>
            <UploadCloud size={16} />
            <span className="hidden sm:inline">{t('Import', 'استيراد')}</span>
          </Button>
          <Button variant="secondary" onClick={() => alert('Export coming soon')} title={t('Export', 'تصدير')}>
            <DownloadCloud size={16} />
            <span className="hidden sm:inline">{t('Export', 'تصدير')}</span>
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            {isCustomer ? t('New Customer', 'عميل جديد') : t('New Supplier', 'مورد جديد')}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Total', 'الإجمالي')}</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Active', 'النشطين')}</div>
          <div className="text-2xl font-bold">{activeCount}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('With balance', 'برصيد')}</div>
          <div className="text-2xl font-bold">{withBalanceCount}</div>
        </div>
      </div>

      <div className="soft-card overflow-hidden">
        <div className="p-4 border-b border-border bg-card/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder={isCustomer ? t('Search customers...', 'البحث في العملاء...') : t('Search suppliers...', 'البحث في الموردين...')} 
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
          <div className="p-8 space-y-4">
            {[1,2,3].map(i => <div key={i} className="shimmer h-12 w-full rounded-xl" />)}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              {isCustomer ? <User size={24} /> : <Building2 size={24} />}
            </div>
            <h3 className="text-lg font-bold mb-2">
              {isCustomer ? t('No customers yet.', 'لا يوجد عملاء بعد.') : t('No suppliers yet.', 'لا يوجد موردين بعد.')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {isCustomer 
                ? t('Add your first customer to start preparing quotations and invoices.', 'أضف أول عميل للبدء في إعداد عروض الأسعار والفواتير.')
                : t('Add suppliers to organize purchases and business expenses.', 'أضف الموردين لتنظيم المشتريات ومصروفات العمل.')}
            </p>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              {isCustomer ? t('Add Customer', 'إضافة عميل') : t('Add Supplier', 'إضافة مورد')}
            </Button>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-muted/30 text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('Name', 'الاسم')}</th>
                    <th className="px-4 py-3 font-medium">{t('Number', 'الرقم')}</th>
                    <th className="px-4 py-3 font-medium">{t('Contact', 'جهة الاتصال')}</th>
                    <th className="px-4 py-3 font-medium">{t('City', 'المدينة')}</th>
                    <th className="px-4 py-3 font-medium text-right rtl:text-left">{t('Balance', 'الرصيد')}</th>
                    <th className="px-4 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map(item => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => setLocation(`/finance/${role}s/${item.id}`)}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{item.displayName}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.partyType === 'organization' ? t('Organization', 'منشأة') : t('Individual', 'فرد')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex px-2 py-0.5 rounded bg-muted text-xs font-mono">{item.partyNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{item.primaryContact || '-'}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.primaryPhone || item.primaryEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.city || '-'}
                      </td>
                      <td className="px-4 py-3 text-right rtl:text-left font-semibold">
                        SAR 0.00
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); setLocation(`/finance/${role}s/${item.id}`); }}>
                          <MoreHorizontal size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {data.items.map(item => (
                <div key={item.id} className="p-4 active:bg-muted/20 transition-colors cursor-pointer" onClick={() => setLocation(`/finance/${role}s/${item.id}`)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-foreground">{item.displayName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 items-center">
                        <span className="font-mono bg-muted/50 px-1 rounded">{item.partyNumber}</span>
                        <span>{item.partyType === 'organization' ? t('Organization', 'منشأة') : t('Individual', 'فرد')}</span>
                      </div>
                    </div>
                    <div className="font-bold text-sm">
                      SAR 0.00
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-4 text-xs text-muted-foreground">
                    <div>
                      {item.primaryContact && <div>{item.primaryContact}</div>}
                      {(item.primaryPhone || item.primaryEmail) && <div>{item.primaryPhone || item.primaryEmail}</div>}
                      {item.city && <div className="mt-1">{item.city}</div>}
                    </div>
                    <MoreHorizontal size={16} />
                  </div>
                </div>
              ))}
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
