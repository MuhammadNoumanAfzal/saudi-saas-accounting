import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import type { PartyAddress } from '@workspace/api-client-react';
import { MapPin, Plus, Edit, Trash2, Building, Navigation } from 'lucide-react';

export function AddressesTab({ partyId, orgId, addresses }: { partyId: string, orgId: string, addresses: PartyAddress[] }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <span>{t('Registered Addresses', 'العناوين والافتتاحيات المسجلة')}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('Billing, shipping, and national address registry.', 'عناوين الفوترة، الشحن، والنواحي الضريبية الوطنية.')}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Address editing is coming soon', 'إضافة وتعديل العناوين ستكون متاحة قريباً'))}
          className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer border border-border hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Plus size={15} />
          <span>{t('Add Address', 'إضافة عنوان')}</span>
        </Button>
      </div>

      {!addresses?.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center border-dashed shadow-2xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <MapPin size={24} />
          </div>
          <h3 className="font-extrabold text-sm mb-1">{t('No addresses added yet', 'لا توجد عناوين مضافة بعد')}</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm">{t('Add Saudi national address or billing locations for ZATCA tax invoices.', 'أضف العنوان الوطني السعودي أو عناوين الفوترة للربط الفواتير.')}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Address editing is coming soon', 'إضافة وتعديل العناوين ستكون متاحة قريباً'))}
            className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Plus size={15} /> {t('Add First Address', 'إضافة أول عنوان')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map(a => (
            <div key={a.id} className="bg-card border border-border/80 rounded-2xl p-5 flex flex-col relative shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all">
              <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto flex gap-1.5">
                {a.isDefaultBilling && (
                  <span className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                    {t('Billing Address', 'عنوان الفوترة')}
                  </span>
                )}
                {a.isDefaultShipping && (
                  <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                    {t('Shipping Address', 'عنوان الشحن')}
                  </span>
                )}
              </div>
              <div className="font-black text-sm text-foreground flex items-center gap-2 mb-2">
                <Building size={16} className="text-primary shrink-0" />
                <span>{a.label || t('Registered Location', 'موقع المنشأة')}</span>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1 font-medium leading-relaxed">
                {a.buildingNumber && <div className="font-semibold text-foreground">{a.buildingNumber} {a.street}</div>}
                {!a.buildingNumber && a.street && <div className="font-semibold text-foreground">{a.street}</div>}
                {a.district && <div>{a.district}</div>}
                <div className="font-mono">{a.city} {a.postalCode ? `• ${a.postalCode}` : ''}</div>
                {a.province && <div>{a.province}</div>}
                <div className="text-primary font-semibold flex items-center gap-1 mt-1">
                  <Navigation size={12} />
                  <span>{a.country || 'Saudi Arabia (المملكة العربية السعودية)'}</span>
                </div>
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
