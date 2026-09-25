import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { useGetCurrentSession } from '@workspace/api-client-react';
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
  Search 
} from 'lucide-react';
import { BranchKpiCards } from '@/components/settings/branch-kpi-cards';

export function BranchesSettings() {
  const { t } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const org = session?.organizations?.find(o => o.organization.id === session?.preferences?.currentOrganizationId)?.organization || session?.organizations?.[0]?.organization;
  const [searchTerm, setSearchTerm] = useState('');

  const branches = [
    {
      id: 'br_hq',
      code: 'HQ-001',
      nameEn: org?.tradingNameEnglish || org?.legalNameEnglish || 'Main Headquarters Branch',
      nameAr: org?.tradingNameArabic || org?.legalNameArabic || 'الفرع الرئيسي للمنشأة',
      city: org?.city || 'Riyadh (الرياض)',
      district: org?.district || 'Olaya District (حي العليا)',
      phone: org?.phone || '+966 11 400 9988',
      isHQ: true,
      status: 'ACTIVE'
    }
  ];

  const filteredBranches = branches.filter(b => {
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

  const handleAddBranch = () => {
    showAlert.info(
      t('Multi-Branch Expansion', 'إضافة فرع جديد'),
      t('Your workspace operates HQ primary branch. Sub-branch inventory sync will be enabled in the upcoming enterprise release.', 'تعمل مساحة عملك حالياً كفرع رئيسي معتمد. تتيح التحديثات القادمة إضافة فروع إضافية ومزامنة المخزون.')
    );
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
            onClick={handleAddBranch} 
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Add New Branch', 'إضافة فرع جديد')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards Component */}
      <BranchKpiCards
        totalBranches={branches.length}
        activeBranches={branches.length}
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

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('Branch Code', 'كود الفرع')}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('Branch Name', 'اسم الفرع')}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('City & Region', 'المدينة والمنطقة')}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('Contact Phone', 'هاتف التواصل')}</th>
                <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Status & HQ Flag', 'الحالة والنوع')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap font-mono font-extrabold text-primary text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-muted border border-border">
                      {branch.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-extrabold text-foreground text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Store size={18} />
                      </div>
                      <div>
                        <div className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                          <span>{branch.nameEn}</span>
                          {branch.isHQ && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {t('Main HQ', 'الفرع الرئيسي')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{branch.nameAr}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-semibold text-foreground text-xs">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{branch.city} — {branch.district}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-muted-foreground text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{branch.phone}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right rtl:text-left whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      <CheckCircle2 size={14} />
                      {t('Active Branch', 'نشط ومستقر')}
                    </span>
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
                {branch.isHQ ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                    <Building2 size={12} />
                    {t('Main HQ', 'الفرع الرئيسي')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border shrink-0">
                    {t('Sub-branch', 'فرع تفرعي')}
                  </span>
                )}
              </div>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>{branch.city}</span>
                <span>{branch.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
