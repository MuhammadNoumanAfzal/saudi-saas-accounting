import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetCustomer, 
  useGetSupplier,
  useAddPartyRole,
  useUpdatePartyStatus,
  getGetCustomerQueryKey,
  getGetSupplierQueryKey,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey,
  customFetch
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, ArrowRight, Building2, User, MoreVertical, Edit, Phone, Mail, MapPin, Power, Trash2 } from 'lucide-react';
import { OverviewTab } from './tabs/overview-tab';
import { ContactsTab } from './tabs/contacts-tab';
import { AddressesTab } from './tabs/addresses-tab';
import { ActivityTab } from './tabs/activity-tab';
import { DocumentsTab } from './tabs/documents-tab';
import { PartyEditSheet } from './party-edit-sheet';

export function PartyProfile({ role, id }: { role: 'customer' | 'supplier'; id: string }) {
  const { t, isRtl } = useTranslation();
  const [location, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  
  const [editOpen, setEditOpen] = useState(false);

  const isCustomer = role === 'customer';
  
  const { data: customerData, isLoading: custLoading } = useGetCustomer(orgId, id, {
    query: { enabled: !!orgId && isCustomer, queryKey: getGetCustomerQueryKey(orgId, id) }
  });
  
  const { data: supplierData, isLoading: suppLoading } = useGetSupplier(orgId, id, {
    query: { enabled: !!orgId && !isCustomer, queryKey: getGetSupplierQueryKey(orgId, id) }
  });

  const addRole = useAddPartyRole();
  const updateStatus = useUpdatePartyStatus();

  const data = isCustomer ? customerData : supplierData;
  const isLoading = isCustomer ? custLoading : suppLoading;

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
        <Button className="mt-6" onClick={() => setLocation(`/finance/${role}s`)}>{t('Go back', 'العودة')}</Button>
      </div>
    );
  }

  const roleLabels = data.roles.map(r => r.role);
  const isAlsoOpposite = isCustomer ? roleLabels.includes('supplier') : roleLabels.includes('customer');

  const handleAddOppositeRole = () => {
    addRole.mutate({
      organizationId: orgId,
      partyId: id,
      role: isCustomer ? 'supplier' : 'customer',
      data: {
        paymentTerms: null,
        creditLimit: null,
        taxTreatment: null
      }
    }, {
      onSuccess: () => {
        showAlert.success(
          isCustomer ? t('Added as Supplier!', 'تمت الإضافة كمورد!') : t('Added as Customer!', 'تمت الإضافة كعميل!'),
          t('Profile now has dual Customer and Supplier roles.', 'الطرف الآن يملك صفة عميل ومورد معاً.')
        );
        queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(orgId, id) });
        queryClient.invalidateQueries({ queryKey: getGetSupplierQueryKey(orgId, id) });
        const oppositeRoute = isCustomer ? 'suppliers' : 'customers';
        setLocation(`/finance/${oppositeRoute}/${id}`);
      }
    });
  };

  const handleToggleStatus = async () => {
    const isCurrentlyActive = data.status === 'active';
    const nextStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionText = isCurrentlyActive ? t('Deactivate', 'إلغاء تنشيط') : t('Activate', 'تنشيط');

    const confirmed = await showAlert.confirm(
      t(`${actionText} ${data.displayName}?`, `هل تريد ${actionText} ${data.displayName}؟`),
      isCurrentlyActive 
        ? t('Deactivating will hide this profile from active select lists.', 'إلغاء التنشيط سيخفي هذا السجل من القوائم النشطة.')
        : t('Activating will restore this profile to active lists.', 'تنشيط الملف سيعيده إلى القوائم النشطة.'),
      t(`Yes, ${actionText}`, `نعم، ${actionText}`),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    updateStatus.mutate({
      organizationId: orgId,
      partyId: id,
      data: { status: nextStatus }
    }, {
      onSuccess: () => {
        showAlert.success(
          t('Status Updated!', 'تم تحديث الحالة!'),
          t(`Profile is now ${nextStatus}.`, `حالة السجل الآن: ${nextStatus}.`)
        );
        queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(orgId, id) });
        queryClient.invalidateQueries({ queryKey: getGetSupplierQueryKey(orgId, id) });
        queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey(orgId) });
        queryClient.invalidateQueries({ queryKey: getGetSuppliersQueryKey(orgId) });
      }
    });
  };

  const handleDeleteParty = async () => {
    if (!orgId) return;
    const confirmed = await showAlert.confirm(
      t(`Delete ${isCustomer ? 'Customer' : 'Supplier'}?`, `حذف ${isCustomer ? 'العميل' : 'المورد'}؟`),
      t(`Are you sure you want to delete ${data.displayName}? This action cannot be undone.`, `هل أنت تأكد من رغبتك في حذف ${data.displayName}؟ لا يمكن التراجع عن هذا الإجراء.`),
      t('Yes, Delete', 'نعم، حذف'),
      t('Cancel', 'إلغاء')
    );

    if (!confirmed) return;

    try {
      const rolePlural = isCustomer ? 'customers' : 'suppliers';
      await customFetch(`/api/organizations/${orgId}/${rolePlural}/${id}`, {
        method: 'DELETE'
      });

      if (isCustomer) {
        queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey(orgId) });
      } else {
        queryClient.invalidateQueries({ queryKey: getGetSuppliersQueryKey(orgId) });
      }

      showAlert.success(
        t('Deleted Successfully!', 'تم الحذف بنجاح!'),
        t(`${data.displayName} has been removed.`, `تم إزالة ${data.displayName}.`)
      );

      setLocation(`/finance/${role}s`);
    } catch (err: any) {
      showAlert.error(
        t('Delete Failed', 'فشل الحذف'),
        err?.message || t('Could not delete record.', 'تعذر حذف السجل.')
      );
    }
  };

  return (
    <div className="space-y-6 fade-up pb-12">
      <button 
        onClick={() => setLocation(`/finance/${role}s`)} 
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {isCustomer ? t('Back to Customers', 'العودة للعملاء') : t('Back to Suppliers', 'العودة للموردين')}
      </button>

      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {data.partyType === 'organization' ? <Building2 size={28} /> : <User size={28} />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.displayName}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${data.status === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                {data.status === 'active' ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">{data.partyNumber}</span>
              {data.roles.map(r => (
                <span key={r.id} className="text-xs font-semibold capitalize opacity-70">
                  {r.role === 'customer' ? t('Customer', 'عميل') : t('Supplier', 'مورد')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Edit size={16} />
            <span className="hidden sm:inline">{t('Edit', 'تعديل')}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="px-3"><MoreVertical size={16} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-48">
              {!isAlsoOpposite && (
                <DropdownMenuItem onClick={handleAddOppositeRole}>
                  {isCustomer ? t('Add as Supplier', 'إضافة كمورد') : t('Add as Customer', 'إضافة كعميل')}
                </DropdownMenuItem>
              )}
              {isAlsoOpposite && (
                <DropdownMenuItem onClick={() => setLocation(`/finance/${isCustomer ? 'suppliers' : 'customers'}/${id}`)}>
                  {isCustomer ? t('View Supplier Profile', 'عرض ملف المورد') : t('View Customer Profile', 'عرض ملف العميل')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleToggleStatus}
                className={data.status === 'active' ? "text-muted-foreground" : "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10"}
              >
                {data.status === 'active' ? t('Deactivate', 'إلغاء التنشيط') : t('Activate', 'تنشيط')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteParty}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
              >
                <Trash2 size={14} className="me-2" />
                {t('Delete Record', 'حذف السجل')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-card p-5">
          <div className="text-sm font-medium text-muted-foreground mb-1">{isCustomer ? t('Total Sales', 'إجمالي المبيعات') : t('Total Purchases', 'إجمالي المشتريات')}</div>
          <div className="text-2xl font-bold">SAR 0.00</div>
        </div>
        <div className="soft-card p-5">
          <div className="text-sm font-medium text-muted-foreground mb-1">{isCustomer ? t('Outstanding Balance', 'الرصيد القائم') : t('Payable Balance', 'الرصيد المستحق')}</div>
          <div className="text-2xl font-bold">SAR 0.00</div>
        </div>
        <div className="soft-card p-5">
          <div className="text-sm font-medium text-muted-foreground mb-1">{t('Overdue', 'متأخر')}</div>
          <div className="text-2xl font-bold text-destructive">SAR 0.00</div>
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
            <TabsTrigger value="contacts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 bg-transparent shadow-none border-transparent text-muted-foreground data-[state=active]:text-foreground font-semibold">
              {t('Contacts', 'جهات الاتصال')}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 bg-transparent shadow-none border-transparent text-muted-foreground data-[state=active]:text-foreground font-semibold">
              {t('Addresses', 'العناوين')}
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 bg-transparent shadow-none border-transparent text-muted-foreground data-[state=active]:text-foreground font-semibold">
              {t('Documents', 'المستندات')}
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-0 bg-transparent shadow-none border-transparent text-muted-foreground data-[state=active]:text-foreground font-semibold">
              {t('Activity', 'النشاط')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none">
          <OverviewTab data={data} orgId={orgId} isCustomer={isCustomer} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-0 outline-none">
          <div className="soft-card p-12 text-center flex flex-col items-center justify-center border-dashed">
            <h3 className="text-lg font-bold mb-2">{t('No transactions yet.', 'لا توجد عمليات بعد.')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {isCustomer 
                ? t('Quotations, invoices, and payments will appear here once created.', 'ستظهر عروض الأسعار، الفواتير، والمدفوعات هنا عند إنشائها.')
                : t('Purchase bills and expenses will appear here once created.', 'ستظهر فواتير المشتريات والمصروفات هنا عند إنشائها.')}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="contacts" className="mt-0 outline-none">
          <ContactsTab partyId={id} orgId={orgId} contacts={data.contacts} />
        </TabsContent>
        <TabsContent value="addresses" className="mt-0 outline-none">
          <AddressesTab partyId={id} orgId={orgId} addresses={data.addresses} />
        </TabsContent>
        <TabsContent value="documents" className="mt-0 outline-none">
          <DocumentsTab partyId={id} orgId={orgId} />
        </TabsContent>
        <TabsContent value="activity" className="mt-0 outline-none">
          <ActivityTab partyId={id} orgId={orgId} />
        </TabsContent>
      </Tabs>

      {/* Edit Party Sheet */}
      <PartyEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        role={role}
        orgId={orgId}
        partyData={data}
      />
    </div>
  );
}
