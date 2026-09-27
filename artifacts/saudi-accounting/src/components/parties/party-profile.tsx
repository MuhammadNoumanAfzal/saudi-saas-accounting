import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import { 
  useGetCurrentSession, 
  useGetCustomer, 
  useGetSupplier,
  useAddPartyRole,
  useUpdatePartyStatus,
  useListInvoices,
  useListPurchaseBills,
  useListQuotations,
  getListInvoicesQueryKey,
  getListQuotationsQueryKey,
  getListPurchaseBillsQueryKey,
  getGetCustomerQueryKey,
  getGetSupplierQueryKey,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey,
  customFetch
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, ArrowRight, Building2, User, MoreVertical, Edit, Phone, Mail, MapPin, Power, Trash2,
  TrendingUp, Clock, AlertCircle, Plus, Receipt, FileText, Info, CheckCircle2, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
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
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization?.id || '';
  
  const [editOpen, setEditOpen] = useState(false);
  const [showBalanceExplainer, setShowBalanceExplainer] = useState(true);

  const isCustomer = role === 'customer';
  
  const { data: customerData, isLoading: custLoading } = useGetCustomer(orgId, id, {
    query: { enabled: Boolean(orgId) && isCustomer, queryKey: getGetCustomerQueryKey(orgId, id) }
  });
  
  const { data: supplierData, isLoading: suppLoading } = useGetSupplier(orgId, id, {
    query: { enabled: Boolean(orgId) && !isCustomer, queryKey: getGetSupplierQueryKey(orgId, id) }
  });

  // Fetch Invoices, Quotations, and Bills for calculations & live transaction list
  const invoiceParams = { pageSize: 200 } as any;
  const quotationParams = { pageSize: 200 } as any;
  const billParams = { pageSize: 200 } as any;

  const { data: invoicesData } = useListInvoices(orgId, invoiceParams, {
    query: { enabled: Boolean(orgId) && isCustomer, queryKey: getListInvoicesQueryKey(orgId, invoiceParams) }
  });
  const { data: quotationsData } = useListQuotations(orgId, quotationParams, {
    query: { enabled: Boolean(orgId) && isCustomer, queryKey: getListQuotationsQueryKey(orgId, quotationParams) }
  });
  const { data: billsData } = useListPurchaseBills(orgId, billParams, {
    query: { enabled: Boolean(orgId) && !isCustomer, queryKey: getListPurchaseBillsQueryKey(orgId, billParams) }
  });

  const addRole = useAddPartyRole();
  const updateStatus = useUpdatePartyStatus();

  const rawData = isCustomer ? customerData : supplierData;
  const data = rawData;
  const isLoading = (isCustomer ? custLoading : suppLoading) && !data;

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

  const partyInvoices = (invoicesData?.items || []).filter((inv: any) => {
    const invCustId = String(inv.customerId || inv.customer?.id || '').toLowerCase();
    const invCustName = (inv.customerName || inv.customer?.displayName || '').toLowerCase().trim();
    const profileId = String(id || '').toLowerCase();
    const profileName = (data?.displayName || '').toLowerCase().trim();
    return (invCustId && invCustId === profileId) || (invCustName && profileName && (invCustName.includes(profileName) || profileName.includes(invCustName)));
  });

  const partyQuotations = (quotationsData?.items || []).filter((q: any) => {
    const qCustId = String(q.customerId || q.customer?.id || '').toLowerCase();
    const qCustName = (q.customerName || q.customer?.displayName || '').toLowerCase().trim();
    const profileId = String(id || '').toLowerCase();
    const profileName = (data?.displayName || '').toLowerCase().trim();
    return (qCustId && qCustId === profileId) || (qCustName && profileName && (qCustName.includes(profileName) || profileName.includes(qCustName)));
  });

  const partyBills = (billsData?.items || []).filter((b: any) => {
    const suppId = String(b.supplierId || b.supplier?.id || '').toLowerCase();
    const suppName = (b.supplierName || b.supplier?.displayName || '').toLowerCase().trim();
    const profileId = String(id || '').toLowerCase();
    const profileName = (data?.displayName || '').toLowerCase().trim();
    return (suppId && suppId === profileId) || (suppName && profileName && (suppName.includes(profileName) || profileName.includes(suppName)));
  });

  // Live Calculated Financial Metrics
  const totalSales = partyInvoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.totalAmount || '0') || 0), 0);
  const unpaidSalesCalc = partyInvoices.reduce((sum: number, inv: any) => {
    if (inv.status === 'PAID' || inv.status === 'CANCELLED') return sum;
    const paid = parseFloat(inv.amountPaid || inv.paidAmount || '0') || 0;
    const total = parseFloat(inv.totalAmount || '0') || 0;
    return sum + Math.max(0, total - paid);
  }, 0);
  const outstandingBalance = unpaidSalesCalc > 0 ? unpaidSalesCalc : totalSales;

  const overdueBalance = partyInvoices.reduce((sum: number, inv: any) => {
    if (inv.status === 'PAID' || inv.status === 'CANCELLED') return sum;
    const isPastDue = inv.dueDate ? new Date(inv.dueDate) < new Date() : false;
    if (inv.status === 'OVERDUE' || isPastDue) {
      const paid = parseFloat(inv.amountPaid || inv.paidAmount || '0') || 0;
      const total = parseFloat(inv.totalAmount || '0') || 0;
      return sum + Math.max(0, total - paid);
    }
    return sum;
  }, 0);

  const totalPurchases = partyBills.reduce((sum: number, b: any) => sum + (parseFloat(b.totalAmount || '0') || 0), 0);
  const unpaidPurchasesCalc = partyBills.reduce((sum: number, b: any) => {
    if (b.status === 'PAID' || b.status === 'CANCELLED') return sum;
    const paid = parseFloat(b.amountPaid || b.paidAmount || '0') || 0;
    const total = parseFloat(b.totalAmount || '0') || 0;
    return sum + Math.max(0, total - paid);
  }, 0);
  const payableBalance = unpaidPurchasesCalc > 0 ? unpaidPurchasesCalc : totalPurchases;

  const supplierOverdue = partyBills.reduce((sum: number, b: any) => {
    if (b.status === 'PAID' || b.status === 'CANCELLED') return sum;
    const isPastDue = b.dueDate ? new Date(b.dueDate) < new Date() : false;
    if (b.status === 'OVERDUE' || isPastDue) {
      const paid = parseFloat(b.amountPaid || b.paidAmount || '0') || 0;
      const total = parseFloat(b.totalAmount || '0') || 0;
      return sum + Math.max(0, total - paid);
    }
    return sum;
  }, 0);

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
        getErrorMessage(err, t('Could not delete record.', 'تعذر حذف السجل.'))
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

      {/* Profile Header */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-xs">
            {data.partyType === 'organization' ? <Building2 size={32} /> : <User size={32} />}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{data.displayName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${data.status === 'active' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                {data.status === 'active' ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
              </span>
              {data.vatNumber && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <CheckCircle2 size={12} /> ZATCA Registered
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="font-mono bg-muted px-2 py-0.5 rounded-md text-xs font-bold text-foreground border border-border">{data.partyNumber}</span>
              {data.roles.map(r => (
                <span key={r.id} className="text-xs font-bold capitalize opacity-80 bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  {r.role === 'customer' ? t('Customer', 'عميل') : t('Supplier', 'مورد')}
                </span>
              ))}
              {data.city && <span className="text-xs text-muted-foreground">• {data.city}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {isCustomer ? (
            <Button 
              onClick={() => setLocation(`/finance/invoices?new=1`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-bold shadow-xs text-xs rounded-xl"
            >
              <Plus size={15} />
              <span>{t('New Invoice', 'فاتورة جديدة')}</span>
            </Button>
          ) : (
            <Button 
              onClick={() => setLocation(`/finance/purchase-bills?new=1`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-bold shadow-xs text-xs rounded-xl"
            >
              <Plus size={15} />
              <span>{t('Record Bill', 'إضافة فاتورة شراء')}</span>
            </Button>
          )}

          <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5 font-semibold text-xs rounded-xl">
            <Edit size={15} />
            <span>{t('Edit', 'تعديل')}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="px-3 rounded-xl"><MoreVertical size={16} /></Button>
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

      {/* KPI Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-card p-5 border border-border/80 bg-card rounded-2xl shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {isCustomer ? t('Total Sales', 'إجمالي المبيعات') : t('Total Purchases', 'إجمالي المشتريات')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            SAR {(isCustomer ? totalSales : totalPurchases).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isCustomer ? t('Cumulative issued invoices', 'إجمالي الفواتير المصدرة') : t('Cumulative vendor bills', 'إجمالي فواتير الشراء')}
          </p>
        </div>

        <div className="soft-card p-5 border border-border/80 bg-card rounded-2xl shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {isCustomer ? t('Outstanding Balance', 'الرصيد القائم المستحق') : t('Payable Balance', 'الرصيد المستحق للمورد')}
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-mono">
            SAR {(isCustomer ? outstandingBalance : payableBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isCustomer ? t('Unpaid invoice balances (Accounts Receivable)', 'المبالغ غیر المسددة من الفواتیر (حسابات المدینین)') : t('Unpaid bill balances (Accounts Payable)', 'المبالغ غیر المسددة للمورد (حسابات الدائنین)')}
          </p>
        </div>

        <div className="soft-card p-5 border border-border/80 bg-card rounded-2xl shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {t('Overdue Balance', 'المبالغ المتأخرة عن الدفع')}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            SAR {(isCustomer ? overdueBalance : supplierOverdue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t('Unpaid amounts past payment terms due date', 'مبالغ تجاوزت تاريخ استحقاق شروط الدفع')}
          </p>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="bg-card border border-border p-1.5 rounded-2xl shadow-xs mb-6 overflow-x-auto">
          <TabsList className="bg-transparent h-10 p-0 space-x-1 rtl:space-x-reverse border-0 overflow-x-auto overflow-y-hidden flex-nowrap w-full justify-start rounded-none">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              {t('Overview', 'نظرة عامة')}
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-1.5"
            >
              <span>{t('Transactions', 'العمليات')}</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-muted/60 data-[state=active]:bg-primary-foreground/20 font-mono font-extrabold">
                {isCustomer ? partyInvoices.length + partyQuotations.length : partyBills.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="contacts" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-1.5"
            >
              <span>{t('Contacts', 'جهات الاتصال')}</span>
              {data.contacts?.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-muted/60 data-[state=active]:bg-primary-foreground/20 font-mono font-extrabold">
                  {data.contacts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="addresses" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center gap-1.5"
            >
              <span>{t('Addresses', 'العناوين')}</span>
              {data.addresses?.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-muted/60 data-[state=active]:bg-primary-foreground/20 font-mono font-extrabold">
                  {data.addresses.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              {t('Documents', 'المستندات')}
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              {t('Activity', 'النشاط')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 outline-none">
          <OverviewTab data={data} orgId={orgId} isCustomer={isCustomer} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-0 outline-none">
          {((isCustomer && (partyInvoices.length > 0 || partyQuotations.length > 0)) || (!isCustomer && partyBills.length > 0)) ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Receipt size={18} className="text-primary" />
                  <span>{isCustomer ? t('Customer Invoices & Quotations', 'فواتير وعروض أسعار العميل') : t('Supplier Bills & Expenses', 'فواتير ومصروفات المورد')}</span>
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {isCustomer ? `${partyInvoices.length} ${t('Invoices', 'فواتير')}` : `${partyBills.length} ${t('Bills', 'فواتير')}`}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-bold uppercase border-b border-border tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">{t('Document #', 'رقم المستند')}</th>
                      <th className="p-3.5">{t('Type', 'النوع')}</th>
                      <th className="p-3.5">{t('Date', 'التاريخ')}</th>
                      <th className="p-3.5">{t('Status', 'الحالة')}</th>
                      <th className="p-3.5 text-right rtl:text-left">{t('Total Amount', 'المبلغ الإجمالي')}</th>
                      <th className="p-3.5 text-center">{t('Action', 'إجراء')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {isCustomer && partyInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="p-3.5 font-mono font-bold text-primary">{inv.invoiceNumber}</td>
                        <td className="p-3.5 font-semibold text-foreground">{t('Sales Invoice', 'فاتورة مبيعات')}</td>
                        <td className="p-3.5 text-muted-foreground">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '-'}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            inv.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                            inv.status === 'OVERDUE' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : inv.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right rtl:text-left font-mono font-extrabold text-foreground">SAR {Number(inv.totalAmount || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-center">
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/finance/invoices/${inv.id}`)} className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 hover:text-primary">
                            <span>{t('View', 'عرض')}</span>
                            <ExternalLink size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {!isCustomer && partyBills.map((b: any) => (
                      <tr key={b.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="p-3.5 font-mono font-bold text-primary">{b.billNumber}</td>
                        <td className="p-3.5 font-semibold text-foreground">{t('Purchase Bill', 'فاتورة شراء')}</td>
                        <td className="p-3.5 text-muted-foreground">{b.billDate ? new Date(b.billDate).toLocaleDateString() : '-'}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            b.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                            b.status === 'OVERDUE' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'PAID' ? 'bg-emerald-500' : b.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right rtl:text-left font-mono font-extrabold text-foreground">SAR {Number(b.totalAmount || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-center">
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/finance/purchase-bills/${b.id}`)} className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1 hover:text-primary">
                            <span>{t('View', 'عرض')}</span>
                            <ExternalLink size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="soft-card p-12 text-center flex flex-col items-center justify-center border-dashed">
              <h3 className="text-lg font-bold mb-2">{t('No transactions yet.', 'لا توجد عمليات بعد.')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {isCustomer 
                  ? t('Quotations, invoices, and payments will appear here once created.', 'ستظهر عروض الأسعار، الفواتير، والمدفوعات هنا عند إنشائها.')
                  : t('Purchase bills and expenses will appear here once created.', 'ستظهر فواتير المشتريات والمصروفات هنا عند إنشائها.')}
              </p>
              {isCustomer ? (
                <Button onClick={() => setLocation('/finance/invoices?new=1')} className="btn-primary rounded-xl text-xs font-bold gap-2">
                  <Plus size={16} />
                  <span>{t('Create First Invoice', 'إنشاء أول فاتورة مبيعات')}</span>
                </Button>
              ) : (
                <Button onClick={() => setLocation('/finance/purchase-bills?new=1')} className="btn-primary rounded-xl text-xs font-bold gap-2">
                  <Plus size={16} />
                  <span>{t('Record First Bill', 'إضافة أول فاتورة شراء')}</span>
                </Button>
              )}
            </div>
          )}
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

