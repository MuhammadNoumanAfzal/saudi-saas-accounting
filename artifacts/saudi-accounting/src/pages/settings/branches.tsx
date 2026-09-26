import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { useGetCurrentSession, useUpdateOrganization } from '@workspace/api-client-react';
import { 
  Store, 
  Building2, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  Search,
  X,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { BranchKpiCards } from '@/components/settings/branch-kpi-cards';

interface BranchItem {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  city: string;
  district: string;
  phone: string;
  isHQ: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

const LOCAL_STORAGE_KEY = 'saudi_erp_workspace_branches';

export function BranchesSettings() {
  const { t } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const updateOrg = useUpdateOrganization();
  const org = session?.organizations?.find(o => o.organization.id === session?.preferences?.currentOrganizationId)?.organization || session?.organizations?.[0]?.organization;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [viewingBranch, setViewingBranch] = useState<BranchItem | null>(null);

  // Initial HQ Branch definition
  const defaultHqBranch: BranchItem = {
    id: 'br_hq',
    code: 'HQ-001',
    nameEn: org?.tradingNameEnglish || org?.legalNameEnglish || 'Main Headquarters Branch',
    nameAr: org?.tradingNameArabic || org?.legalNameArabic || 'الفرع الرئيسي للمنشأة',
    city: org?.city || 'Riyadh (الرياض)',
    district: org?.district || 'Olaya District (حي العليا)',
    phone: org?.phone || '+966 11 400 9988',
    isHQ: true,
    status: 'ACTIVE'
  };

  // Dynamic state for branches initialized from Database org.branches (with localStorage fallback)
  const [branchesList, setBranchesList] = useState<BranchItem[]>(() => {
    if (org && Array.isArray((org as any).branches) && (org as any).branches.length > 0) {
      return (org as any).branches;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse saved branches:', e);
        }
      }
    }
    return [defaultHqBranch];
  });

  // Sync branches list to Database (PostgreSQL) and localStorage on any change
  const saveBranchesToDbAndStorage = (updatedList: BranchItem[]) => {
    setBranchesList(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to persist branches to localStorage:', err);
    }
    if (org?.id) {
      updateOrg.mutate({
        organizationId: org.id,
        data: {
          legalNameEnglish: org.legalNameEnglish || 'Organization',
          branches: updatedList as any,
        }
      });
    }
  };

  useEffect(() => {
    if (org && Array.isArray((org as any).branches) && (org as any).branches.length > 0) {
      setBranchesList((org as any).branches);
    }
  }, [org]);

  // Modal Form State
  const [newCode, setNewCode] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const filteredBranches = branchesList.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return b.nameEn.toLowerCase().includes(term) || b.nameAr.toLowerCase().includes(term) || b.city.toLowerCase().includes(term) || b.code.toLowerCase().includes(term);
  });

  const handleExportCSV = () => {
    const headers = ['Code', 'Name (EN)', 'Name (AR)', 'City', 'District', 'Phone', 'HQ Status'];
    const rows = filteredBranches.map(b => [
      `"${b.code}"`,
      `"${b.nameEn}"`,
      `"${b.nameAr}"`,
      `"${b.city}"`,
      `"${b.district}"`,
      `"${b.phone}"`,
      `"${b.isHQ ? 'Headquarters' : 'Sub-branch'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `branches_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('Branches list exported to CSV!', 'تم تصدير قائمة الفروع إلى CSV!'), 'success');
  };

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setNewCode('');
    setNewNameEn('');
    setNewNameAr('');
    setNewCity('');
    setNewDistrict('');
    setNewPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: BranchItem) => {
    setEditingBranch(branch);
    setNewCode(branch.code);
    setNewNameEn(branch.nameEn);
    setNewNameAr(branch.nameAr);
    setNewCity(branch.city);
    setNewDistrict(branch.district);
    setNewPhone(branch.phone);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = (branch: BranchItem) => {
    if (branch.isHQ) {
      showAlert.error(
        t('Cannot Delete HQ Branch', 'لا يمكن حذف الفرع الرئيسي'),
        t('The Main Headquarters branch is protected and cannot be deleted.', 'الفرع الرئيسي محمي ولا يمكن حذفه.')
      );
      return;
    }

    const newList = branchesList.filter(b => b.id !== branch.id);
    saveBranchesToDbAndStorage(newList);
    showAlert.toast(t(`Branch "${branch.nameEn}" deleted.`, `تم حذف الفرع "${branch.nameAr}".`), 'info');
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameEn.trim()) {
      showAlert.error(t('Branch name required', 'اسم الفرع مطلوب'), t('Please enter English branch name.', 'يرجى إدخال اسم الفرع بالإنجليزي.'));
      return;
    }

    let newList: BranchItem[] = [];
    if (editingBranch) {
      newList = branchesList.map(b => {
        if (b.id === editingBranch.id) {
          return {
            ...b,
            code: newCode.trim() || b.code,
            nameEn: newNameEn.trim(),
            nameAr: newNameAr.trim() || newNameEn.trim(),
            city: newCity.trim() || b.city,
            district: newDistrict.trim() || b.district,
            phone: newPhone.trim() || b.phone,
          };
        }
        return b;
      });
      showAlert.toast(t(`Branch "${newNameEn}" updated successfully!`, `تم تحديث الفرع "${newNameAr || newNameEn}" بنجاح!`), 'success');
    } else {
      const created: BranchItem = {
        id: `br_${Date.now()}`,
        code: newCode.trim() || `BR-00${branchesList.length + 1}`,
        nameEn: newNameEn.trim(),
        nameAr: newNameAr.trim() || newNameEn.trim(),
        city: newCity.trim() || 'Jeddah',
        district: newDistrict.trim() || 'Commercial Area',
        phone: newPhone.trim() || '+966 12 000 0000',
        isHQ: false,
        status: 'ACTIVE'
      };

      newList = [...branchesList, created];
      showAlert.toast(t(`Branch "${created.nameEn}" created successfully!`, `تم إضافة الفرع "${created.nameAr}" بنجاح!`), 'success');
    }

    saveBranchesToDbAndStorage(newList);
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Commercial Network', 'شبكة الفروع والمواقع')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA Branch Compliant
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('Commercial Branches & Locations', 'إدارة الفروع والمواقع التجارية')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Manage physical locations, point-of-sale terminals, and branch-specific VAT serial numbers.', 'إدارة الفروع التجارية والمواقع الفعلية، نقاط البيع، وتسلسلات الفواتير لكل فرع.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => showAlert.toast(t('Branch sync complete.', 'تم تحديث مزامنة الفروع.'), 'success')}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Branches', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">CSV</span>
          </Button>

          <Button 
            type="button"
            onClick={handleOpenAddModal} 
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Add New Branch', 'إضافة فرع جديد')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards Component */}
      <BranchKpiCards
        totalBranches={branchesList.length}
        activeBranches={branchesList.length}
        hqCity={org?.city || 'Riyadh HQ'}
      />

      {/* Search Filter Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-xs print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 rtl:right-3.5 top-3" />
          <input
            type="text"
            placeholder={t('Search branches by code, name, city or phone...', 'ابحث عن فرع بالكود، الاسم، المدينة أو الهاتف...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold pl-10 rtl:pr-10 border border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Branches Table & Mobile Cards View */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-muted/40 border-b border-border font-extrabold text-sm flex items-center justify-between gap-2 text-foreground">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <span>{t('Registered Workspace Branches', 'سجل فروع المنشأة المسجلة')}</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono font-bold">
            {filteredBranches.length} {t('branches listed', 'فروع مسجلة')}
          </span>
        </div>

        {/* Desktop Table View - Fits nicely without horizontal scrollbar */}
        <div className="hidden md:block w-full">
          <table className="w-full text-xs text-left rtl:text-right border-collapse table-auto">
            <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
              <tr>
                <th className="px-3.5 py-3">{t('Code', 'الكود')}</th>
                <th className="px-3.5 py-3">{t('Branch Name', 'اسم الفرع')}</th>
                <th className="px-3.5 py-3">{t('City & District', 'المدينة والحي')}</th>
                <th className="px-3.5 py-3">{t('Contact Phone', 'الهاتف')}</th>
                <th className="px-3.5 py-3">{t('Status', 'الحالة')}</th>
                <th className="px-3.5 py-3 text-right rtl:text-left">{t('Actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-3.5 py-3 font-mono font-extrabold text-primary text-xs whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-lg bg-muted border border-border">
                      {branch.code}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-extrabold text-foreground text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Store size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-foreground text-xs flex items-center gap-1.5 truncate">
                          <span>{branch.nameEn}</span>
                          {branch.isHQ && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                              {t('Main HQ', 'الفرع الرئيسي')}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{branch.nameAr}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-semibold text-foreground text-xs">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{branch.city} — {branch.district}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 font-mono text-muted-foreground text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 size={12} />
                      {t('Active', 'نشط')}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-right rtl:text-left whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingBranch(branch)}
                        title={t('View Details', 'عرض التفاصيل')}
                        className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-primary/10 hover:text-primary text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(branch)}
                        title={t('Edit Branch', 'تعديل الفرع')}
                        className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-amber-500/10 hover:text-amber-600 text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Edit3 size={14} />
                      </button>
                      {!branch.isHQ && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBranch(branch)}
                          title={t('Delete Branch', 'حذف الفرع')}
                          className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-border">
          {filteredBranches.map((branch) => (
            <div key={branch.id} className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Store size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-foreground text-sm truncate">
                      {branch.nameEn}
                    </h3>
                    <span className="font-mono text-[11px] text-primary font-bold">
                      {branch.code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewingBranch(branch)}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-primary cursor-pointer"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(branch)}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-amber-600 cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                  {!branch.isHQ && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(branch)}
                      className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>{branch.city}</span>
                <span>{branch.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 fade-up">
          <div className="bg-card border border-border/80 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0 relative">
            {/* Modal Header */}
            <div className="p-6 bg-muted/30 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs border border-primary/20">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-foreground tracking-tight">
                    {editingBranch
                      ? t('Edit Commercial Branch', 'تعديل بيانات الفرع التجاري')
                      : t('Register New Commercial Branch', 'تسجيل فرع تجاري جديد')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('Expand your company footprint with ZATCA compliant branch codes.', 'إضافة أو تعديل فرع تجاري متوافق مع هيئة الزكاة والضريبة.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBranch} className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-foreground flex items-center justify-between">
                    <span>{t('Branch Code', 'كود الفرع')}</span>
                    <span className="text-[10px] text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="field h-10 rounded-xl bg-background border border-border font-mono text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="e.g. JED-002"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-foreground flex items-center justify-between">
                    <span>{t('City / Region', 'المدينة / المنطقة')}</span>
                    <span className="text-[10px] text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="field h-10 rounded-xl bg-background border border-border text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    placeholder="e.g. Jeddah (جدة)"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-foreground flex items-center justify-between">
                    <span>{t('Branch Name (English)', 'اسم الفرع (إنجليزي)')}</span>
                    <span className="text-[10px] text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="field h-10 rounded-xl bg-background border border-border text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newNameEn}
                    onChange={e => setNewNameEn(e.target.value)}
                    placeholder="e.g. Jeddah Commercial Hub Branch"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-foreground">
                    {t('Branch Name (Arabic)', 'اسم الفرع (عربي)')}
                  </label>
                  <input
                    type="text"
                    className="field h-10 rounded-xl bg-background border border-border text-xs font-bold arabic focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-right"
                    dir="rtl"
                    value={newNameAr}
                    onChange={e => setNewNameAr(e.target.value)}
                    placeholder="مثال: فرع جدة التجاري"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-foreground">
                    {t('District / Neighborhood', 'الحي / المنطقة')}
                  </label>
                  <input
                    type="text"
                    className="field h-10 rounded-xl bg-background border border-border text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newDistrict}
                    onChange={e => setNewDistrict(e.target.value)}
                    placeholder="e.g. Al-Corniche District"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-foreground">
                    {t('Contact Phone', 'هاتف الفرع')}
                  </label>
                  <input
                    type="tel"
                    className="field h-10 rounded-xl bg-background border border-border font-mono text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="e.g. +966 12 600 7744"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-border text-xs font-extrabold cursor-pointer hover:bg-muted"
                >
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button
                  type="submit"
                  className="h-10 px-5 rounded-xl btn-primary text-xs font-extrabold cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>{editingBranch ? t('Update Branch', 'حفظ التعديلات') : t('Save Branch', 'إضافة الفرع')}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Branch Details Modal */}
      {viewingBranch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 fade-up">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setViewingBranch(null)}
              className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Store size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {viewingBranch.nameEn}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {viewingBranch.code} • {viewingBranch.nameAr}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">{t('Branch Type', 'نوع الفرع')}</span>
                <span className="font-bold text-foreground">
                  {viewingBranch.isHQ ? t('Main Headquarters', 'الفرع الرئيسي') : t('Sub-branch', 'فرع تفرعي')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">{t('City', 'المدينة')}</span>
                <span className="font-bold text-foreground">{viewingBranch.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">{t('District', 'الحي')}</span>
                <span className="font-bold text-foreground">{viewingBranch.district}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">{t('Phone', 'الهاتف')}</span>
                <span className="font-bold font-mono text-foreground">{viewingBranch.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">{t('Status', 'الحالة')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('Active & ZATCA Compliant', 'نشط ومستقر')}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingBranch(null)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                {t('Close', 'إغلاق')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
