import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { customFetch, useGetCurrentSession } from '@workspace/api-client-react';
import { CheckCircle2, Download, RefreshCw, Search, UserPlus, Users, X } from 'lucide-react';
import { RowActions } from '@/components/ui/row-actions';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import { queryClient } from '@/lib/queryClient';
import { useTranslation, Button } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

type Role = 'owner' | 'admin' | 'accountant' | 'sales' | 'purchasing' | 'viewer';
type MemberType = 'member' | 'invitation';
type InviteStatus = 'PENDING' | 'APPROVED' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED' | string;

type Member = {
  id: string;
  organizationId: string;
  userId: string | null;
  role: Role;
  branchId?: string | null;
  status: InviteStatus;
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
  const isInvitation = (member: Member) => member.type === 'invitation';
  const canApproveInvitation = (member: Member) => canApprove && isInvitation(member) && member.status === 'PENDING';

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

  const activeOwnerCount = members.filter((member) => member.type !== 'invitation' && member.role === 'owner' && member.status === 'ACTIVE').length;
  const isEditingLastActiveOwner = Boolean(editing && editing.type !== 'invitation' && editing.role === 'owner' && editing.status === 'ACTIVE' && activeOwnerCount <= 1);

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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: membersKey });
      const message = result.type === 'invitation' && result.status === 'APPROVED'
        ? t('Approved. Waiting for user sign-in.', 'Approved. Waiting for user sign-in.')
        : t('Invitation approved and user activated.', 'Invitation approved and user activated.');
      showAlert.toast(message, 'success');
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateUserForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim() || form.displayName.trim().length < 2) {
      errors.displayName = isRtl ? 'الاسم الكامل مطلوب (حرفين على الأقل)' : 'Full name is required (at least 2 characters)';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      errors.email = isRtl ? 'يرجى إدخال عنوان بريد إلكتروني صحيح' : 'Please enter a valid email address';
    }
    if (isEditingLastActiveOwner && (form.role !== 'owner' || form.status !== 'ACTIVE')) {
      errors.owner = t('At least one active owner is required. Add another owner before changing this user.', 'At least one active owner is required. Add another owner before changing this user.');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({ displayName: member.displayName, email: member.email, role: member.role, branchId: member.branchId || '', status: member.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    setFormErrors({});
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
        <div className="soft-card p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{t('Waiting owner approval', 'Waiting owner approval')}</div><div className="text-3xl font-black text-amber-600">{members.filter((member) => member.type === 'invitation' && (member.status === 'PENDING' || member.status === 'APPROVED')).length}</div></div>
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
                    <td className="p-4 font-bold">{member.displayName}<div className="text-xs text-muted-foreground">{member.type === 'invitation' ? (member.status === 'APPROVED' ? t('Approved, waiting sign-in', 'Approved, waiting sign-in') : t('Waiting owner approval', 'Waiting owner approval')) : t('Member', 'Member')}</div></td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{member.email}</td>
                    <td className="p-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{roleLabel(member.role)}</span></td>
                    <td className="p-4 text-muted-foreground">{branchLabel(member.branchId)}</td>
                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : member.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' : member.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>{member.status}</span></td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canApproveInvitation(member) && (
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background">
          <SheetHeader className="p-6 border-b border-border bg-card/50">
            <SheetTitle className="text-xl font-bold">
              {editing ? t('Edit User Access', 'Edit User Access') : t('Invite User', 'Invite User')}
            </SheetTitle>
            <SheetDescription>
              {editing ? t('Update role, status, and branch scope.', 'Update role, status, and branch scope.') : t('New invitations require owner approval before workspace access.', 'New invitations require owner approval before workspace access.')}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={(event) => { event.preventDefault(); if (validateUserForm()) saveMutation.mutate(); }} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between space-y-6">
            <div className="grid gap-4">
              {Object.keys(formErrors).length > 0 && (
                <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold space-y-1">
                  <div className="font-bold">⚠️ {isRtl ? 'يرجى تصحيح الأخطاء التالية:' : 'Please fix highlighted errors:'}</div>
                  <ul className="list-disc list-inside font-normal">
                    {Object.values(formErrors).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <label className="space-y-1">
                <span className="text-xs font-bold">{t('Full name', 'Full name')} <span className="text-red-500">*</span></span>
                <input required value={form.displayName} onChange={(event) => { setForm({ ...form, displayName: event.target.value }); if (formErrors.displayName) setFormErrors(prev => ({ ...prev, displayName: '' })); }} className={`field h-10 w-full bg-background ${formErrors.displayName ? 'border-red-500' : ''}`} />
                {formErrors.displayName && <p className="text-[11px] font-medium text-red-500">{formErrors.displayName}</p>}
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold">{t('Email', 'Email')} <span className="text-red-500">*</span></span>
                <input required type="email" disabled={Boolean(editing)} value={form.email} onChange={(event) => { setForm({ ...form, email: event.target.value }); if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' })); }} className={`field h-10 w-full bg-background disabled:opacity-70 ${formErrors.email ? 'border-red-500' : ''}`} />
                {formErrors.email && <p className="text-[11px] font-medium text-red-500">{formErrors.email}</p>}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1"><span className="text-xs font-bold">{t('Role', 'Role')}</span><select disabled={isEditingLastActiveOwner} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })} className="field h-10 w-full bg-background disabled:opacity-70">{roleOptions.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
                <label className="space-y-1"><span className="text-xs font-bold">{t('Status', 'Status')}</span><select disabled={isEditingLastActiveOwner} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="field h-10 w-full bg-background disabled:opacity-70"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label>
              </div>
              {isEditingLastActiveOwner && (<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">{t('This is the last active owner. Add another owner before changing role or deactivating access.', 'This is the last active owner. Add another owner before changing role or deactivating access.')}</div>)}
              <label className="space-y-1"><span className="text-xs font-bold">{t('Branch scope', 'Branch scope')}</span><select value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value })} className="field h-10 w-full bg-background"><option value="">{t('All branches', 'All branches')}</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.code} - {isRtl ? branch.nameArabic || branch.nameEnglish : branch.nameEnglish}</option>)}</select></label>
            </div>
            <div className="flex justify-end gap-2 border-t pt-5">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('Cancel', 'Cancel')}</Button>
              <Button disabled={saveMutation.isPending}>{saveMutation.isPending ? t('Saving...', 'Saving...') : t('Save', 'Save')}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(viewing)} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background">
          <SheetHeader className="p-6 border-b border-border bg-card/50">
            <SheetTitle className="text-xl font-bold">{viewing?.displayName}</SheetTitle>
            <SheetDescription>{t('User membership details and permissions', 'تفاصيل عضوية المستخدم والصلاحيات')}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="p-6 grid gap-4 text-sm flex-1 overflow-y-auto">
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Email</span><span className="font-mono">{viewing.email}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Role</span><span className="font-bold">{roleLabel(viewing.role)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Branch</span><span className="text-right font-bold">{branchLabel(viewing.branchId)}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Status</span><span className="font-bold">{viewing.status}</span></div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
