import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { customFetch, useGetCurrentSession } from '@workspace/api-client-react';
import { Download, Plus, RefreshCw, Search, Store, X } from 'lucide-react';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import { queryClient } from '@/lib/queryClient';
import { useTranslation, Button } from '@/lib/utils';
import { RowActions } from '@/components/ui/row-actions';

type BranchStatus = 'ACTIVE' | 'INACTIVE';

type Branch = {
  id: string;
  code: string;
  nameEnglish: string;
  nameArabic?: string | null;
  vatNumber?: string | null;
  commercialRegistrationNumber?: string | null;
  buildingNumber?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  additionalNumber?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  status: BranchStatus;
  isMain: boolean;
};

type BranchForm = Omit<Branch, 'id'>;

const emptyForm: BranchForm = {
  code: '',
  nameEnglish: '',
  nameArabic: '',
  vatNumber: '',
  commercialRegistrationNumber: '',
  buildingNumber: '',
  street: '',
  district: '',
  city: '',
  province: '',
  postalCode: '',
  additionalNumber: '',
  country: 'Saudi Arabia',
  phone: '',
  email: '',
  status: 'ACTIVE',
  isMain: false,
};

const identityFields: Array<[keyof BranchForm, string, boolean]> = [
  ['code', 'Branch Code', true],
  ['nameEnglish', 'Name English', true],
  ['nameArabic', 'Name Arabic', false],
  ['vatNumber', 'VAT Number', false],
  ['commercialRegistrationNumber', 'CR Number', false],
];

const addressFields: Array<[keyof BranchForm, string, boolean]> = [
  ['buildingNumber', 'Building Number', false],
  ['street', 'Street', false],
  ['district', 'District', false],
  ['city', 'City', false],
  ['province', 'Province / Region', false],
  ['postalCode', 'Postal Code', false],
  ['additionalNumber', 'Additional Number', false],
  ['country', 'Country', false],
];

const contactFields: Array<[keyof BranchForm, string, boolean]> = [
  ['phone', 'Phone', false],
  ['email', 'Email', false],
];

function toForm(branch: Branch): BranchForm {
  return {
    code: branch.code || '',
    nameEnglish: branch.nameEnglish || '',
    nameArabic: branch.nameArabic || '',
    vatNumber: branch.vatNumber || '',
    commercialRegistrationNumber: branch.commercialRegistrationNumber || '',
    buildingNumber: branch.buildingNumber || '',
    street: branch.street || '',
    district: branch.district || '',
    city: branch.city || '',
    province: branch.province || '',
    postalCode: branch.postalCode || '',
    additionalNumber: branch.additionalNumber || '',
    country: branch.country || 'Saudi Arabia',
    phone: branch.phone || '',
    email: branch.email || '',
    status: branch.status,
    isMain: branch.isMain,
  };
}

export function BranchesSettings() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const queryKey = ['organization-branches', orgId];

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [viewing, setViewing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);

  const { data: branches = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => customFetch<Branch[]>(`/api/organizations/${orgId}/branches`, { responseType: 'json' }),
    enabled: Boolean(orgId),
  });

  useEffect(() => {
    if (!open) return;
    setForm(editing ? toForm(editing) : emptyForm);
  }, [open, editing]);

  const saveMutation = useMutation({
    mutationFn: () => customFetch<Branch>(editing ? `/api/organizations/${orgId}/branches/${editing.id}` : `/api/organizations/${orgId}/branches`, {
      method: editing ? 'PATCH' : 'POST',
      responseType: 'json',
      body: JSON.stringify(form),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showAlert.toast(editing ? t('Branch updated', 'Branch updated') : t('Branch created', 'Branch created'), 'success');
      setOpen(false);
      setEditing(null);
    },
    onError: (err) => showAlert.error(t('Save failed', 'Save failed'), getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (branchId: string) => customFetch(`/api/organizations/${orgId}/branches/${branchId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showAlert.toast(t('Branch deleted', 'Branch deleted'), 'success');
    },
    onError: (err) => showAlert.error(t('Delete failed', 'Delete failed'), getErrorMessage(err)),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return branches.filter((branch) => !q || [
      branch.code,
      branch.nameEnglish,
      branch.nameArabic,
      branch.city,
      branch.province,
      branch.phone,
      branch.email,
      branch.vatNumber,
      branch.commercialRegistrationNumber,
    ].some((value) => value?.toLowerCase().includes(q)));
  }, [branches, search]);

  const updateField = <K extends keyof BranchForm>(key: K, value: BranchForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const renderInput = ([key, label, required]: [keyof BranchForm, string, boolean]) => (
    <label key={key} className="space-y-1">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
        {t(label, label)}{required ? ' *' : ''}
      </span>
      <input
        required={required}
        type={key === 'email' ? 'email' : 'text'}
        value={String(form[key] ?? '')}
        onChange={(event) => updateField(key, event.target.value as never)}
        className="field h-10 w-full bg-background"
      />
    </label>
  );

  const exportCsv = () => {
    const header = ['Code', 'Name EN', 'Name AR', 'VAT Number', 'CR Number', 'City', 'Province', 'Status', 'Main'];
    const rows = filtered.map((branch) => [
      branch.code,
      branch.nameEnglish,
      branch.nameArabic || '',
      branch.vatNumber || '',
      branch.commercialRegistrationNumber || '',
      branch.city || '',
      branch.province || '',
      branch.status,
      branch.isMain ? 'YES' : 'NO',
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `branches_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const removeBranch = async (branch: Branch) => {
    const ok = await showAlert.confirm(
      t('Delete branch?', 'Delete branch?'),
      t(`Delete ${branch.nameEnglish}? This cannot be undone.`, `Delete ${branch.nameEnglish}? This cannot be undone.`),
      t('Yes, delete', 'Yes, delete'),
      t('Cancel', 'Cancel'),
    );
    if (ok) deleteMutation.mutate(branch.id);
  };

  const toggleStatus = (branch: Branch) => {
    customFetch(`/api/organizations/${orgId}/branches/${branch.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey });
        showAlert.toast(t('Branch status updated', 'Branch status updated'), 'success');
      })
      .catch((err) => showAlert.error(t('Update failed', 'Update failed'), getErrorMessage(err)));
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setOpen(true);
  };

  return (
    <div className="space-y-6 fade-up pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">{t('Branches', 'Branches')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('Manage real database-backed company branches and national address details.', 'Manage real database-backed company branches and national address details.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => refetch()}><RefreshCw size={16} />{t('Refresh', 'Refresh')}</Button>
          <Button variant="secondary" onClick={exportCsv}><Download size={16} />CSV</Button>
          <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} />{t('New Branch', 'New Branch')}</Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-card p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{t('Total branches', 'Total branches')}</div><div className="text-3xl font-black">{branches.length}</div></div>
        <div className="soft-card p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{t('Active', 'Active')}</div><div className="text-3xl font-black text-emerald-600">{branches.filter((branch) => branch.status === 'ACTIVE').length}</div></div>
        <div className="soft-card p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{t('Main branch', 'Main branch')}</div><div className="truncate text-lg font-black">{branches.find((branch) => branch.isMain)?.nameEnglish || '-'}</div></div>
      </div>

      <div className="soft-card overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="field h-10 w-full bg-background pl-9" placeholder={t('Search branches...', 'Search branches...')} />
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-sm text-muted-foreground">{t('Loading branches...', 'Loading branches...')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="mx-auto mb-3 text-muted-foreground/40" size={42} />
            <h3 className="font-bold">{t('No branches found', 'No branches found')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('Create your first real branch record.', 'Create your first real branch record.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-4 text-left">{t('Code', 'Code')}</th>
                  <th className="p-4 text-left">{t('Branch', 'Branch')}</th>
                  <th className="p-4 text-left">{t('Address', 'Address')}</th>
                  <th className="p-4 text-left">{t('Tax IDs', 'Tax IDs')}</th>
                  <th className="p-4 text-left">{t('Contact', 'Contact')}</th>
                  <th className="p-4 text-left">{t('Status', 'Status')}</th>
                  <th className="p-4 text-right">{t('Actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((branch) => (
                  <tr key={branch.id} className="hover:bg-muted/30">
                    <td className="p-4 font-mono font-bold text-primary">{branch.code}</td>
                    <td className="p-4"><div className="font-bold">{branch.nameEnglish}</div><div className="text-xs text-muted-foreground">{branch.nameArabic || '-'} {branch.isMain && <span className="ms-2 text-emerald-600">{t('Main', 'Main')}</span>}</div></td>
                    <td className="p-4 text-muted-foreground">{[branch.buildingNumber, branch.street, branch.district, branch.city, branch.province, branch.postalCode].filter(Boolean).join(', ') || '-'}</td>
                    <td className="p-4 text-muted-foreground"><div>VAT: {branch.vatNumber || '-'}</div><div>CR: {branch.commercialRegistrationNumber || '-'}</div></td>
                    <td className="p-4 text-muted-foreground"><div>{branch.email || '-'}</div><div>{branch.phone || '-'}</div></td>
                    <td className="p-4"><button onClick={() => toggleStatus(branch)} className={`rounded-full px-2.5 py-1 text-xs font-bold ${branch.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>{branch.status}</button></td>
                    <td className="p-4" onClick={(event) => event.stopPropagation()}><RowActions onView={() => setViewing(branch)} onEdit={() => openEdit(branch)} onDelete={branch.isMain ? undefined : () => removeBranch(branch)} viewLabel={t('View', 'View')} editLabel={t('Edit', 'Edit')} deleteLabel={t('Delete', 'Delete')} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-black">{editing ? t('Edit Branch', 'Edit Branch') : t('New Branch', 'New Branch')}</h2>
                <p className="text-xs text-muted-foreground">{t('All fields persist in PostgreSQL.', 'All fields persist in PostgreSQL.')}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted"><X size={20} /></button>
            </div>

            <div className="space-y-6 p-5">
              <section className="space-y-3">
                <h3 className="text-xs font-black uppercase text-muted-foreground">{t('Branch Identity', 'Branch Identity')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">{identityFields.map(renderInput)}</div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-black uppercase text-muted-foreground">{t('National Address', 'National Address')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">{addressFields.map(renderInput)}</div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-black uppercase text-muted-foreground">{t('Contact', 'Contact')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">{contactFields.map(renderInput)}</div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-black uppercase text-muted-foreground">{t('Controls', 'Controls')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex h-10 items-center gap-2 text-sm font-bold">
                    <input type="checkbox" checked={form.isMain} onChange={(event) => updateField('isMain', event.target.checked)} />
                    {t('Main branch', 'Main branch')}
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('Status', 'Status')}</span>
                    <select value={form.status} onChange={(event) => updateField('status', event.target.value as BranchStatus)} className="field h-10 w-full bg-background">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </label>
                </div>
              </section>
            </div>

            <div className="flex justify-end gap-2 border-t p-5">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>{t('Cancel', 'Cancel')}</Button>
              <Button disabled={saveMutation.isPending}>{saveMutation.isPending ? t('Saving...', 'Saving...') : t('Save Branch', 'Save Branch')}</Button>
            </div>
          </form>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex justify-between">
              <h2 className="text-xl font-black">{isRtl ? viewing.nameArabic || viewing.nameEnglish : viewing.nameEnglish}</h2>
              <button onClick={() => setViewing(null)}><X size={20} /></button>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {Object.entries(viewing).filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key)).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-border/60 p-3">
                  <div className="text-xs font-bold uppercase text-muted-foreground">{key}</div>
                  <div className="mt-1 font-semibold">{String(value ?? '-')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
