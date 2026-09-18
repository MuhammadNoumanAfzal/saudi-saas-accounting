import { useTranslation, Button } from '@/lib/utils';
import type { PartyAddress } from '@workspace/api-client-react';
import { MapPin, Plus, Edit, Trash } from 'lucide-react';

export function AddressesTab({ partyId, orgId, addresses }: { partyId: string, orgId: string, addresses: PartyAddress[] }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{t('Addresses', 'العناوين')}</h3>
        <Button variant="secondary" onClick={() => alert('Add address coming soon')}>
          <Plus size={16} />
          <span>{t('Add Address', 'إضافة عنوان')}</span>
        </Button>
      </div>

      {!addresses.length ? (
        <div className="soft-card p-12 text-center border-dashed">
          <h3 className="font-bold mb-2">{t('No addresses yet', 'لا توجد عناوين بعد')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('Add billing or shipping addresses.', 'أضف عناوين الفوترة أو الشحن.')}</p>
          <Button variant="secondary" onClick={() => alert('Add address coming soon')}>
            <Plus size={16} /> {t('Add Address', 'إضافة عنوان')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map(a => (
            <div key={a.id} className="soft-card p-4 flex flex-col relative">
              <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto flex gap-1">
                {a.isDefaultBilling && (
                  <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{t('Billing', 'فوترة')}</div>
                )}
                {a.isDefaultShipping && (
                  <div className="bg-accent/20 text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{t('Shipping', 'شحن')}</div>
                )}
              </div>
              <div className="font-bold mb-3">{a.label || t('Address', 'العنوان')}</div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                {a.buildingNumber && <div>{a.buildingNumber} {a.street}</div>}
                {!a.buildingNumber && a.street && <div>{a.street}</div>}
                {a.district && <div>{a.district}</div>}
                <div>{a.city} {a.postalCode}</div>
                {a.province && <div>{a.province}</div>}
                <div>{a.country || 'Saudi Arabia'}</div>
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
