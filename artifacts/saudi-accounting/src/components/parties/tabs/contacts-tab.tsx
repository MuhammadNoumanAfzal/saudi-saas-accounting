import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import type { PartyContact } from '@workspace/api-client-react';
import { 
  useCreatePartyContact,
  useUpdatePartyContact,
  useDeletePartyContact,
  getGetCustomerQueryKey,
  getGetSupplierQueryKey
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { UserPlus, MoreHorizontal, Check, Mail, Phone, Edit, Trash } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function ContactsTab({ partyId, orgId, contacts }: { partyId: string, orgId: string, contacts: PartyContact[] }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{t('Contacts', 'جهات الاتصال')}</h3>
        <Button variant="secondary" onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Contacts editing is coming soon', 'Contacts editing is coming soon'))}>
          <UserPlus size={16} />
          <span>{t('Add Contact', 'إضافة جهة اتصال')}</span>
        </Button>
      </div>

      {!contacts.length ? (
        <div className="soft-card p-12 text-center border-dashed">
          <h3 className="font-bold mb-2">{t('No contacts yet', 'لا توجد جهات اتصال بعد')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('Add people associated with this business.', 'أضف الأشخاص المرتبطين بهذه المنشأة.')}</p>
          <Button variant="secondary" onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Contacts editing is coming soon', 'Contacts editing is coming soon'))}>
            <UserPlus size={16} /> {t('Add Contact', 'إضافة جهة اتصال')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map(c => (
            <div key={c.id} className="soft-card p-4 flex flex-col relative">
              {c.isPrimary && (
                <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {t('Primary', 'رئيسي')}
                </div>
              )}
              <div className="font-bold text-lg">{c.firstName} {c.lastName}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{c.jobTitle || c.department || '-'}</div>
              
              <div className="mt-4 space-y-2 text-sm">
                {c.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} className="shrink-0" /> <span>{c.email}</span>
                  </div>
                )}
                {(c.phone || c.mobile) && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={14} className="shrink-0" /> <span>{c.mobile || c.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <Button variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <Edit size={14} /> {t('Edit', 'تعديل')}
                </Button>
                <Button variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive">
                  <Trash size={14} /> {t('Remove', 'إزالة')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
