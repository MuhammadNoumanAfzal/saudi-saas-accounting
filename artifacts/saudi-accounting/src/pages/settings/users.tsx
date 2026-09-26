import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { customFetch, useGetCurrentSession } from '@workspace/api-client-react';
import { Download, Edit3, Eye, RefreshCw, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { RowActions } from '@/components/ui/row-actions';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import { queryClient } from '@/lib/queryClient';
import { useTranslation, Button } from '@/lib/utils';

type Role = 'owner' | 'admin' | 'accountant' | 'sales' | 'purchasing' | 'viewer';
type Member = { id: string; organizationId: string; userId: string | null; role: Role; branchId?: string | null; status: string; createdAt: string; displayName: string; email: string; type?: 'member' | 'invitation' };
type Branch = { id: string; code: string; nameEnglish: string; nameArabic?: string | null; status: string };

const roleOptions: Role[] = ['admin', 'accountant', 'sales', 'purchasing', 'viewer'];
const emptyForm = { displayName: '', email: '', role: 'accountant' as Role, branchId: '', status: 'ACTIVE' };

export function UsersSettings() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const currentRole = (session?.organizations?.find((item) => item.organization.id === orgId)?.role || session?.organizations?.[0]?.role || 'viewer') as Role;
  const canManage = currentRole === 'owner' || currentRole === 'admin';
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);

  const membersKey = ['organization-members', orgId];
  const branchesKey = ['organization-branches', orgId];
  const { data: members = [], isLoading, refetch } = useQuery({ queryKey: membersKey, queryFn: () => customFetch<Member[]>(`/api/organizations/${orgId}/members`, { responseType: 'json' }), enabled: Boolean(orgId) });
  const { data: branches = [] } = useQuery({ queryKey: branchesKey, queryFn: () => customFetch<Branch[]>(`/api/organizations/${orgId}/branches`, { responseType: 'json' }), enabled: Boolean(orgId) });

  const saveMutation = useMutation({
    mutationFn: () => customFetch<Member>(editing ? `/api/organizations/${orgId}/members/${editing.id}` : `/api/organizations/${orgId}/members`, { method: editing ? 'PATCH' : 'POST', responseType: 'json', body: JSON.stringify({ ...form, branchId: form.branchId || null }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: membersKey }); setOpen(false); setEditing(null); showAlert.toast(editing ? t('User updated', 'تم تحديث المستخدم') : t('Invitation saved', 'تم حفظ الدعوة'), 'success'); },
    onError: (err) => showAlert.error(t('Save failed', 'فشل الحفظ'), getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customFetch(`/api/organizations/${orgId}/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: membersKey }); showAlert.toast(t('Access removed', 'تم إلغاء الوصول'), 'success'); },
    onError: (err) => showAlert.error(t('Remove failed', 'فشل الإزالة'), getErrorMessage(err)),
  });

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || [m.displayName, m.email, m.role, m.status, branchLabel(m.branchId)].some((v) => v?.toLowerCase().includes(q));
  });

  function branchLabel(branchId?: string | null) {
    if (!branchId) return t('All branches', 'كل الفروع');
    const branch = branches.find((item) => item.id === branchId);
    return branch ? `${branch.code} - ${isRtl ? branch.nameArabic || branch.nameEnglish : branch.nameEnglish}` : branchId;
  }

  function roleLabel(role: Role) {
    const labels: Record<Role, string> = { owner: t('Owner', 'مالك'), admin: t('Admin', 'مدير'), accountant: t('Accountant', 'محاسب'), sales: t('Sales', 'مبيعات'), purchasing: t('Purchases', 'مشتريات'), viewer: t('Viewer', 'مشاهد') };
    return labels[role] || role;
  }

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (member: Member) => { setEditing(member); setForm({ displayName: member.displayName, email: member.email, role: member.role, branchId: member.branchId || '', status: member.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }); setOpen(true); };
  const removeMember = async (member: Member) => {
    const ok = await showAlert.confirm(t('Remove access?', 'إزالة الوصول؟'), t(`Remove ${member.displayName} from this organization?`, `إزالة ${member.displayName} من المنشأة؟`), t('Yes, remove', 'نعم، إزالة'), t('Cancel', 'إلغاء'));
    if (ok) deleteMutation.mutate(member.id);
  };

  const exportCsv = () => {
    const rows = filtered.map((m) => [m.displayName, m.email, m.role, branchLabel(m.branchId), m.status, m.type || 'member'].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([['Name','Email','Role','Branch','Status','Type'].join(','), ...rows].join('\n'), { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `users_roles_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="space-y-6 fade-up pb-16">
    <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div><h1 className="text-2xl font-black text-foreground">{t('Users & Roles', 'المستخدمون والأدوار')}</h1><p className="text-sm text-muted-foreground mt-1">{t('Manage real organization memberships, invitations, roles, and branch scope.', 'إدارة العضويات والدعوات والأدوار ونطاق الفروع من قاعدة البيانات.')}</p></div>
      <div className="flex gap-2"><Button variant="secondary" onClick={()=>refetch()}><RefreshCw size={16}/>{t('Refresh','تحديث')}</Button><Button variant="secondary" onClick={exportCsv}><Download size={16}/>CSV</Button>{canManage && <Button onClick={openCreate}><UserPlus size={16}/>{t('Invite User','دعوة مستخدم')}</Button>}</div>
    </header>

    <div className="grid gap-4 md:grid-cols-3"><div className="soft-card p-4"><div className="text-xs text-muted-foreground font-bold uppercase">{t('Total users','إجمالي المستخدمين')}</div><div className="text-3xl font-black">{members.length}</div></div><div className="soft-card p-4"><div className="text-xs text-muted-foreground font-bold uppercase">{t('Active','نشط')}</div><div className="text-3xl font-black text-emerald-600">{members.filter(m=>m.status==='ACTIVE').length}</div></div><div className="soft-card p-4"><div className="text-xs text-muted-foreground font-bold uppercase">{t('Pending invitations','الدعوات المعلقة')}</div><div className="text-3xl font-black text-amber-600">{members.filter(m=>m.type==='invitation' || m.status==='PENDING').length}</div></div></div>

    <div className="soft-card overflow-hidden"><div className="p-4 border-b"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="field pl-9 h-10 w-full bg-background" placeholder={t('Search users, roles, branch...', 'بحث بالمستخدم أو الدور أو الفرع...')} /></div></div>
      {isLoading ? <div className="p-8 text-sm text-muted-foreground">{t('Loading users...', 'جاري تحميل المستخدمين...')}</div> : filtered.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto mb-3 text-muted-foreground/40" size={42}/><h3 className="font-bold">{t('No users found', 'لا يوجد مستخدمون')}</h3><p className="text-sm text-muted-foreground mt-1">{t('Invite real users by email. No demo users are shown.', 'ادع مستخدمين حقيقيين بالبريد. لا توجد بيانات وهمية.')}</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-4 text-left">{t('User','المستخدم')}</th><th className="p-4 text-left">{t('Email','البريد')}</th><th className="p-4 text-left">{t('Role','الدور')}</th><th className="p-4 text-left">{t('Branch','الفرع')}</th><th className="p-4 text-left">{t('Status','الحالة')}</th><th className="p-4 text-right">{t('Actions','الإجراءات')}</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((member)=><tr key={member.id} className="hover:bg-muted/30"><td className="p-4 font-bold">{member.displayName}<div className="text-xs text-muted-foreground">{member.type === 'invitation' ? t('Pending invitation','دعوة معلقة') : t('Member','عضو')}</div></td><td className="p-4 font-mono text-xs text-muted-foreground">{member.email}</td><td className="p-4"><span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold">{roleLabel(member.role)}</span></td><td className="p-4 text-muted-foreground">{branchLabel(member.branchId)}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${member.status==='ACTIVE'?'bg-emerald-500/10 text-emerald-600':member.status==='PENDING'?'bg-amber-500/10 text-amber-600':'bg-muted text-muted-foreground'}`}>{member.status}</span></td><td className="p-4"><RowActions onView={()=>setViewing(member)} onEdit={canManage ? ()=>openEdit(member) : undefined} onDelete={canManage && member.role !== 'owner' ? ()=>removeMember(member) : undefined} viewLabel={t('View','عرض')} editLabel={t('Edit','تعديل')} deleteLabel={t('Remove','إزالة')} /></td></tr>)}</tbody></table></div>}
    </div>

    {open && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={(e)=>{e.preventDefault(); saveMutation.mutate();}} className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl"><div className="p-5 border-b flex justify-between"><div><h2 className="font-black text-lg">{editing?t('Edit User Access','تعديل صلاحية المستخدم'):t('Invite User','دعوة مستخدم')}</h2><p className="text-xs text-muted-foreground">{editing?t('Update role, status, and branch scope.', 'تحديث الدور والحالة ونطاق الفرع.'):t('If the email is not registered yet, a pending DB invitation is created.', 'إذا لم يكن البريد مسجلاً سيتم إنشاء دعوة معلقة في قاعدة البيانات.')}</p></div><button type="button" onClick={()=>setOpen(false)}><X size={20}/></button></div><div className="p-5 grid gap-4"><label className="space-y-1"><span className="text-xs font-bold">{t('Full name','الاسم الكامل')}</span><input required value={form.displayName} onChange={(e)=>setForm({...form,displayName:e.target.value})} className="field h-10 w-full bg-background" /></label><label className="space-y-1"><span className="text-xs font-bold">{t('Email','البريد')}</span><input required type="email" disabled={Boolean(editing)} value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="field h-10 w-full bg-background disabled:opacity-70" /></label><div className="grid sm:grid-cols-2 gap-4"><label className="space-y-1"><span className="text-xs font-bold">{t('Role','الدور')}</span><select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value as Role})} className="field h-10 w-full bg-background">{roleOptions.map((role)=><option key={role} value={role}>{roleLabel(role)}</option>)}</select></label><label className="space-y-1"><span className="text-xs font-bold">{t('Status','الحالة')}</span><select value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})} className="field h-10 w-full bg-background"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="PENDING">PENDING</option></select></label></div><label className="space-y-1"><span className="text-xs font-bold">{t('Branch scope','نطاق الفرع')}</span><select value={form.branchId} onChange={(e)=>setForm({...form,branchId:e.target.value})} className="field h-10 w-full bg-background"><option value="">{t('All branches','كل الفروع')}</option>{branches.map((branch)=><option key={branch.id} value={branch.id}>{branch.code} - {isRtl ? branch.nameArabic || branch.nameEnglish : branch.nameEnglish}</option>)}</select></label></div><div className="p-5 border-t flex justify-end gap-2"><Button type="button" variant="secondary" onClick={()=>setOpen(false)}>{t('Cancel','إلغاء')}</Button><Button disabled={saveMutation.isPending}>{saveMutation.isPending?t('Saving...','جاري الحفظ...'):t('Save','حفظ')}</Button></div></form></div>}
    {viewing && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 shadow-2xl"><div className="flex justify-between mb-4"><h2 className="font-black text-xl">{viewing.displayName}</h2><button onClick={()=>setViewing(null)}><X size={20}/></button></div><div className="grid gap-3 text-sm"><div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Email</span><span className="font-mono">{viewing.email}</span></div><div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Role</span><span className="font-bold">{roleLabel(viewing.role)}</span></div><div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Branch</span><span className="font-bold text-right">{branchLabel(viewing.branchId)}</span></div><div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Status</span><span className="font-bold">{viewing.status}</span></div></div></div></div>}
  </div>;
}