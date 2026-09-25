import { useState, useMemo } from 'react';
import { useGetCurrentSession } from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { 
  Users, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  UserPlus, 
  Search, 
  ShieldAlert, 
  Download,
  UserCheck
} from 'lucide-react';
import { UserKpiCards } from '@/components/settings/user-kpi-cards';
import { showAlert } from '@/lib/alerts';

export function UsersSettings() {
  const { data: session, isLoading, refetch } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentUser = session?.user;
  const currentRole =
    session?.organizations?.find(
      item => item.organization.id === session?.preferences?.currentOrganizationId,
    )?.role ?? session?.organizations?.[0]?.role ?? 'Owner';

  // Live session account user
  const teamMembers = useMemo(() => {
    const list = [
      {
        id: currentUser?.id || 'usr_session',
        displayName: currentUser?.displayName || session?.user?.displayName || 'Muhammad Nouman Afzal',
        email: currentUser?.email || session?.user?.email || 'makeuse928@gmail.com',
        role: currentRole || 'Workspace Owner & Lead Admin',
        status: 'ACTIVE',
        isOwner: true,
        lastActive: 'Active Now (الآن)'
      }
    ];

    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(m => 
      m.displayName.toLowerCase().includes(term) || 
      m.email.toLowerCase().includes(term) || 
      m.role.toLowerCase().includes(term)
    );
  }, [currentUser, currentRole, searchTerm]);

  const activeCount = teamMembers.filter(m => m.status === 'ACTIVE').length;
  const adminCount = teamMembers.filter(m => m.isOwner || m.role.toLowerCase().includes('admin') || m.role.toLowerCase().includes('owner')).length;

  const handleExportRoster = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Active'];
    const rows = teamMembers.map(m => [
      `"${m.displayName}"`,
      `"${m.email}"`,
      `"${m.role}"`,
      `"${m.status}"`,
      `"${m.lastActive}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `team_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert.toast(t('Team roster exported to CSV!', 'تم تصدير قائمة الفريق إلى CSV!'), 'success');
  };

  const handleInviteUser = () => {
    showAlert.info(
      t('Invite Team Member', 'دعوة عضو جديد'),
      t('Team invitations and role management will be enabled once email delivery configuration is finalized in the next release.', 'سيتم تفعيل دعوات الفريق وإدارة الأدوار بمجرد الانتهاء من إعدادات تسليم البريد الإلكتروني في التحديث القادم.')
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
              <span>{t('Team & Governance', 'الفريق والصلاحيات')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> SOCPA RBAC Enabled
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {t('Users & Roles Management', 'المستخدمون والأدوار')}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Manage team members, assign granular accounting permissions, and audit user sessions.', 'إدارة أعضاء الفريق، تعيين الصلاحيات المحاسبية الدقيقة، وتدقيق الجلسات.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Roster', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleExportRoster}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">CSV</span>
          </Button>

          <Button 
            type="button"
            onClick={handleInviteUser} 
            className="h-9 px-3.5 rounded-xl btn-primary shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('Invite User', 'دعوة عضو جديد')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards Component */}
      <UserKpiCards
        totalUsers={teamMembers.length}
        adminCount={adminCount}
        activeCount={activeCount}
        isLoading={isLoading}
      />

      {/* Search Filter Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl shadow-xs print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 rtl:right-3.5 top-3" />
          <input
            type="text"
            placeholder={t('Search users by name, email or role...', 'ابحث عن مستخدم بالاسم، البريد الإلكتروني أو الدور...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field bg-background h-10 w-full rounded-xl text-xs font-extrabold pl-10 rtl:pr-10 border border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Team Roster Table & Mobile Cards */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-muted/40 border-b border-border font-extrabold text-sm flex items-center justify-between gap-2 text-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{t('Workspace Team Roster', 'قائمة أعضاء الفريق')}</span>
          </div>
          <span className="text-xs text-muted-foreground font-mono font-bold">
            {teamMembers.length} {t('members listed', 'أعضاء مسجلون')}
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('User Member', 'اسم العضو')}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('Email Address', 'البريد الإلكتروني')}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('Assigned Role', 'الدور الموكل')}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t('Last Active', 'آخر تواجد')}</th>
                <th className="px-5 py-3.5 text-right rtl:text-left whitespace-nowrap">{t('Status', 'الحالة')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap font-extrabold text-foreground text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                        {member.displayName[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                          <span>{member.displayName}</span>
                          {member.isOwner && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                              {t('Owner', 'المالك')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-muted-foreground text-xs">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{member.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-extrabold text-primary text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-muted-foreground text-xs">
                    {member.lastActive}
                  </td>
                  <td className="px-5 py-4 text-right rtl:text-left whitespace-nowrap">
                    {member.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        <UserCheck size={14} />
                        {t('Active Account', 'نشط')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                        <ShieldAlert size={14} />
                        {t('Invite Pending', 'في انتظار القبول')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="md:hidden divide-y divide-border">
          {teamMembers.map((member) => (
            <div key={member.id} className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                    {member.displayName[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-foreground text-sm truncate">
                      {member.displayName}
                    </h3>
                    <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                  </div>
                </div>
                {member.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                    <UserCheck size={12} />
                    {t('Active', 'نشط')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shrink-0">
                    <ShieldAlert size={12} />
                    {t('Pending', 'معلق')}
                  </span>
                )}
              </div>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{member.role}</span>
                <span className="text-muted-foreground">{member.lastActive}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

