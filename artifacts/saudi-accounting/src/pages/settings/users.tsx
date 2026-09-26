import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { customFetch, useGetCurrentSession } from '@workspace/api-client-react';
import { CheckCircle2, Download, RefreshCw, Search, UserPlus, Users, X } from 'lucide-react';
import { RowActions } from '@/components/ui/row-actions';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import { queryClient } from '@/lib/queryClient';
import { useTranslation, Button } from '@/lib/utils';

type Role = 'owner' | 'admin' | 'accountant' | 'sales' | 'purchasing' | 'viewer';
type MemberType = 'member' | 'invitation';

type Member = {
  id: string;
  organizationId: string;
  userId: string | null;
  role: Role;
  branchId?: string | null;
  status: string;
  createdAt: string;
  displayName: string;
  email: string;
  type?: MemberType;
};

type Branch = { id: string; code: string; nameEnglish: string; nameArabic?: string | null; status: string };

type UserForm = { displayName: string; email: string; role: Role; branchId: string; status: string };

const roleOptions: Role[] = ['owner', 'admin', 'accountant', 'sales', 'purchasing', 'viewer'];
const emptyForm: UserForm = { displayName: '', email: '', role: 'accountant', branchId: '', status: 'ACTIVE' };

export function UsersSettings() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const currentRole = (session?.organizations?.find((item) => item.organization.id === orgId)?.role || session?.organizations?.[0]?.role || 'viewer') as Role;
  const canManage = currentRole === 'owner' || currentRole === 'admin';
  const canApprove = currentRole === 'owner';

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const membersKey = ['organization-members', orgId];
  const branchesKey = ['organization-branches', orgId];
  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: membersKey,
    queryFn: () => customFetch<Member[]>(`/api/organizations/${orgId}/members`, { responseType: 'json' }),
    enabled: Boolean(orgId),
  });
  const { data: branches = [] } = useQuery({
    queryKey: branchesKey,
    queryFn: () => customFetch<Branch[]>(`/api/organizations/${orgId}/branches`, { responseType: 'json' }),
    enabled: Boolean(orgId),
  });

  const branchLabel = (branchId?: string | null) => {
    if (!branchId) return t('All branches', 'All branches');
    const branch = branches.find((item) => item.id === branchId);
    return branch ? `${branch.code} - ${isRtl ? branch.nameArabic || branch.nameEnglish : branch.nameEnglish}` : branchId;
  };

  const roleLabel = (role: Role) => {
    const labels: Record<Role, string> = {
      owner: t('Owner', 'Owner'),
      admin: t('Admin', 'Admin'),
      accountant: t('Accountant', 'Accountant'),
      sales: t('Sales', 'Sales'),
      purchasing: t('Purchases', 'Purchases'),
      viewer: t('Viewer', 'Viewer'),
    };
    return labels[role];
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return members.filter((member) => !q || [member.displayName, member.email, member.role, member.status, branchLabel(member.branchId)].some((value) => value?.toLowerCase().includes(q)));
  }, [members, search, branches]);

  const saveMutation = useMutation({
    mutationFn: () => customFetch<Member>(editing ? `/api/organizations/${orgId}/members/${editing.id}` : `/api/organizations/${orgId}/members`, {
      method: editing ? 'PATCH' : 'POST',
      responseType: 'json',
      body: JSON.stringify({ ...form, branchId: form.branchId || null }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey });
      setOpen(false);
      setEditing(null);
      showAlert.toast(editing ? t('User updated', 'User updated') : t('Invitation saved', 'Invitation saved'), 'success');
    },
    onError: (err) => showAlert.error(t('Save failed', 'Save failed'), getErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: (member: Member) => customFetch<Member>(`/api/organizations/${orgId}/members/${member.id}`, {
      method: 'PATCH',
      responseType: 'json',
      body: JSON.stringify({ role: member.role, branchId: member.branchId || null, status: 'ACTIVE' }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey });
      showAlert.toast(t('Invitation approved', 'Invitation approved'), 'success');
    },
    onError: (err) => showAlert.error(t('Approval failed', 'Approval failed'), getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customFetch(`/api/organizations/${orgId}/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey });
      showAlert.toast(t('Access removed', 'Access removed'), 'success');
    },
    onError: (err) => showAlert.error(t('Remove failed', 'Remove failed'), getErrorMessage(err)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({ displayName: member.displayName, email: member.email, role: member.role, branchId: member.branchId || '', status: member.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    setOpen(true);
  };

  const approveInvitation = async (member: Member) => {
    const ok = await showAlert.confirm(
      t('Approve this user?', 'Approve this user?'),
      t(`${member.email} will become an active ${roleLabel(member.role)} in this organization.`, `${member.email} will become active.`),
      t('Approve', 'Approve'),
      t('Cancel', 'Cancel'),
    );
    if (ok) approveMutation.mutate(member);
  };

  const removeMember = async (member: Member) => {
    const ok = await showAlert.confirm(
      t('Remove access?', 'Remove access?'),
      t(`Remove ${member.displayName} from this organization?`, `Remove ${member.displayName} from this organization?`),
      t('Yes, remove', 'Yes, remove'),
      t('Cancel', 'Cancel'),
    );
    if (ok) deleteMutation.mutate(member.id);
  };

  const exportCsv = () => {
    const rows = filtered.map((member) => [member.displayName, member.email, member.role, branchLabel(member.branchId), member.status, member.type || 'member'].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
    const csv = [['Name', 'Email', 'Role', 'Branch', 'Status', 'Type'].join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `users_roles_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 fade-up pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">{t('Users & Roles', 'Users & Roles')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('Owner-approved memberships, roles, and branch access scope.', 'Owner-approved memberships, roles, and branch access scope.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => refetch()}><RefreshCw size={16} />{t('Refresh', 'Refresh')}</Button>
          <Button variant="secondary" onClick={exportCsv}><Download size={16} />CSV</Button>
          {canManage && <Button onClick={openCreate}><UserPlus size={16} />{t('Invite User', 'Invite User')}</Button>}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-card p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{t('Total records', 'Total records')}</div><div className="text-3xl font-black">{members.length}</div></div>
        <div className="soft-card p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{t('Active members', 'Active members')}</div><div className="text-3xl font-black text-emerald-600">{members.filter((member) => member.type !== 'invitation' && member.status === 'ACTIVE').length}</div></div>
        <div className="soft-card p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{t('Waiting owner approval', 'Waiting owner approval')}</div><div className="text-3xl font-black text-amber-600">{members.filter((member) => member.type === 'invitation' || member.status === 'PENDING').length}</div></div>
      </div>

      <div className="soft-card overflow-hidden">
        <div className="border-b p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="field h-10 w-full bg-background pl-9" placeholder={t('Search users, roles, branch...', 'Search users, roles, branch...')} />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-muted-foreground">{t('Loading users...', 'Loading users...')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 text-muted-foreground/40" size={42} />
            <h3 className="font-bold">{t('No users found', 'No users found')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('Invite real users by email. No demo users are shown.', 'Invite real users by email. No demo users are shown.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-4 text-left">{t('User', 'User')}</th>
                  <th className="p-4 text-left">{t('Email', 'Email')}</th>
                  <th className="p-4 text-left">{t('Role', 'Role')}</th>
                  <th className="p-4 text-left">{t('Branch', 'Branch')}</th>
                  <th className="p-4 text-left">{t('Status', 'Status')}</th>
                  <th className="p-4 text-right">{t('Actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30">
                    <td className="p-4 font-bold">{member.displayName}<div className="text-xs text-muted-foreground">{member.type === 'invitation' ? t('Waiting owner approval', 'Waiting owner approval') : t('Member', 'Member')}</div></td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{member.email}</td>
                    <td className="p-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{roleLabel(member.role)}</span></td>
                    <td className="p-4 text-muted-foreground">{branchLabel(member.branchId)}</td>
                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : member.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>{member.status}</span></td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canApprove && member.type === 'invitation' && (
                          <button type="button" onClick={() => approveInvitation(member)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle2 size={14} />{t('Approve', 'Approve')}
                          </button>
                        )}
                        <RowActions onView={() => setViewing(member)} onEdit={canManage ? () => openEdit(member) : undefined} onDelete={canManage && member.role !== 'owner' ? () => removeMember(member) : undefined} viewLabel={t('View', 'View')} editLabel={t('Edit', 'Edit')} deleteLabel={t('Remove', 'Remove')} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-black">{editing ? t('Edit User Access', 'Edit User Access') : t('Invite User', 'Invite User')}</h2>
                <p className="text-xs text-muted-foreground">{editing ? t('Update role, status, and branch scope.', 'Update role, status, and branch scope.') : t('New invitations require owner approval before workspace access.', 'New invitations require owner approval before workspace access.')}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <div className="grid gap-4 p-5">
              <label className="space-y-1"><span className="text-xs font-bold">{t('Full name', 'Full name')}</span><input required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} className="field h-10 w-full bg-background" /></label>
              <label className="space-y-1"><span className="text-xs font-bold">{t('Email', 'Email')}</span><input required type="email" disabled={Boolean(editing)} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="field h-10 w-full bg-background disabled:opacity-70" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1"><span className="text-xs font-bold">{t('Role', 'Role')}</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} className="field h-10 w-full bg-background">{roleOptions.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
                <label className="space-y-1"><span className="text-xs font-bold">{t('Status', 'Status')}</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="field h-10 w-full bg-background"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="PENDING">PENDING</option></select></label>
              </div>
              <label className="space-y-1"><span className="text-xs font-bold">{t('Branch scope', 'Branch scope')}</span><select value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })} className="field h-10 w-full bg-background"><option value="">{t('All branches', 'All branches')}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} - {isRtl ? branch.nameArabic || branch.nameEnglish : branch.nameEnglish}</option>)}</select></label>
            </div>
            <div className="flex justify-end gap-2 border-t p-5"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('Cancel', 'Cancel')}</Button><Button disabled={saveMutation.isPending}>{saveMutation.isPending ? t('Saving...', 'Saving...') : t('Save', 'Save')}</Button></div>
          </form>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex justify-between"><h2 className="text-xl font-black">{viewing.displayName}</h2><button onClick={() => setViewing(null)}><X size={20} /></button></div>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Email</span><span className="font-mono">{viewing.email}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Role</span><span className="font-bold">{roleLabel(viewing.role)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Branch</span><span className="text-right font-bold">{branchLabel(viewing.branchId)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Status</span><span className="font-bold">{viewing.status}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
