import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import type { PartyContact } from '@workspace/api-client-react';
import { UserPlus, Mail, Phone, Edit, Trash2, UserCheck, Briefcase } from 'lucide-react';

export function ContactsTab({ partyId, orgId, contacts }: { partyId: string, orgId: string, contacts: PartyContact[] }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <UserCheck size={18} className="text-primary" />
            <span>{t('Associated Contacts', 'جهات الاتصال المرتبطة')}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('Key personnel and representatives for this account.', 'الأشخاص المعنيون وممثلو المنشأة.')}</p>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Contacts editing is coming soon', 'إضافة وتعديل جهات الاتصال ستكون متاحة قريباً'))}
          className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer border border-border hover:bg-primary/5 hover:text-primary transition-all"
        >
          <UserPlus size={15} />
          <span>{t('Add Contact', 'إضافة جهة اتصال')}</span>
        </Button>
      </div>

      {!contacts?.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center border-dashed shadow-2xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <UserCheck size={24} />
          </div>
          <h3 className="font-extrabold text-sm mb-1">{t('No contacts added yet', 'لا توجد جهات اتصال مضافة بعد')}</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm">{t('Add team members or representatives associated with this customer.', 'أضف ممثلي المنشأة أو الأشخاص المعنيين بالمتابعة.')}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Contacts editing is coming soon', 'إضافة وتعديل جهات الاتصال ستكون متاحة قريباً'))}
            className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
          >
            <UserPlus size={15} /> {t('Add First Contact', 'إضافة أول جهة اتصال')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map(c => (
            <div key={c.id} className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col relative shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all">
              {c.isPrimary && (
                <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto bg-primary/15 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
                  {t('Primary Contact', 'جهة اتصال رئيسية')}
                </div>
              )}
              <div className="font-black text-base text-foreground flex items-center gap-2">
                <span>{c.firstName} {c.lastName}</span>
              </div>
              <div className="text-xs font-semibold text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Briefcase size={13} className="text-muted-foreground" />
                <span>{c.jobTitle || c.department || t('Representative', 'ممثل')}</span>
              </div>
              
              <div className="mt-4 pt-3 border-t border-border space-y-2 text-xs font-medium">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail size={14} className="shrink-0 text-primary" /> 
                    <span className="truncate">{c.email}</span>
                  </a>
                )}
                {(c.phone || c.mobile) && (
                  <a href={`tel:${c.mobile || c.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Phone size={14} className="shrink-0 text-primary" /> 
                    <span className="font-mono">{c.mobile || c.phone}</span>
                  </a>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border/60 flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-muted-foreground hover:text-foreground">
                  <Edit size={13} /> {t('Edit', 'تعديل')}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-destructive hover:text-destructive">
                  <Trash2 size={13} /> {t('Remove', 'إزالة')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
