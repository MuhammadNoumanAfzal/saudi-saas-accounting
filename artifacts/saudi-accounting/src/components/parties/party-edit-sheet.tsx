import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  useUpdateCustomer, 
  useUpdateSupplier,
  getGetCustomerQueryKey,
  getGetSupplierQueryKey,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function PartyEditSheet({ 
  open, 
  onOpenChange, 
  role, 
  orgId, 
  partyData 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  role: 'customer' | 'supplier';
  orgId: string;
  partyData: any;
}) {
  const { t, isRtl } = useTranslation();
  const isCustomer = role === 'customer';

  const updateCustomer = useUpdateCustomer();
  const updateSupplier = useUpdateSupplier();

  const [type, setType] = useState<'organization' | 'individual'>('organization');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [arabicName, setArabicName] = useState('');
  
  const [vatRegistered, setVatRegistered] = useState(false);
  const [vatNumber, setVatNumber] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [street, setStreet] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [additionalNumber, setAdditionalNumber] = useState('');
  const [country, setCountry] = useState('Saudi Arabia');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [creditLimit, setCreditLimit] = useState('');
  const [taxTreatment, setTaxTreatment] = useState('standard');
  
  const [showMore, setShowMore] = useState(false);
  const [legalEn, setLegalEn] = useState('');
  const [legalAr, setLegalAr] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form when partyData changes
  useEffect(() => {
    if (open && partyData) {
      setType(partyData.partyType || 'organization');
      setNameEn(partyData.businessNameEnglish || partyData.displayName || '');
      setNameAr(partyData.businessNameArabic || '');
      setFirstName(partyData.firstName || '');
      setLastName(partyData.lastName || '');
      setArabicName(partyData.arabicName || '');
      setVatRegistered(Boolean(partyData.vatRegistered || partyData.vatNumber));
      setVatNumber(partyData.vatNumber || '');
      setCrNumber(partyData.commercialRegistrationNumber || '');
      setEmail(partyData.primaryEmail || '');
      setPhone(partyData.primaryPhone || '');
      const billingAddress = partyData.addresses?.find((address: any) => address.isDefaultBilling) ?? partyData.addresses?.[0];
      const roleSettings = partyData.roles?.find((item: any) => item.role === role) ?? partyData.roles?.[0];
      setCity(partyData.city || billingAddress?.city || '');
      setBuildingNumber(billingAddress?.buildingNumber || '');
      setStreet(billingAddress?.street || '');
      setDistrict(billingAddress?.district || '');
      setProvince(billingAddress?.province || '');
      setPostalCode(billingAddress?.postalCode || '');
      setAdditionalNumber(billingAddress?.additionalNumber || '');
      setCountry(billingAddress?.country || 'Saudi Arabia');
      setPaymentTerms(roleSettings?.paymentTerms || 'Net 30');
      setCreditLimit(roleSettings?.creditLimit || '');
      setTaxTreatment(roleSettings?.taxTreatment || 'standard');
      setLegalEn(partyData.legalNameEnglish || partyData.displayName || '');
      setLegalAr(partyData.legalNameArabic || partyData.businessNameArabic || '');
      setWebsite(partyData.website || '');
      setNotes(partyData.notes || '');
      setErrors({});
    }
  }, [open, partyData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalNameEn = nameEn.trim();
    const finalNameAr = nameAr.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    const newErrors: Record<string, string> = {};

    if (type === 'organization') {
      if (!finalNameEn) {
        newErrors.nameEn = t('Business Name (English) is required', 'اسم المنشأة باللغة الإنجليزية مطلوب');
      } else if (finalNameEn.length < 2) {
        newErrors.nameEn = t('Business Name (English) must be at least 2 characters', 'اسم المنشأة باللغة الإنجليزية يجب أن يكون حرفين على الأقل');
      }

      if (!finalNameAr) {
        newErrors.nameAr = t('Business Name (Arabic) is required', 'اسم المنشأة باللغة العربية مطلوب');
      } else if (finalNameAr.length < 2) {
        newErrors.nameAr = t('Business Name (Arabic) must be at least 2 characters', 'اسم المنشأة باللغة العربية يجب أن يكون حرفين على الأقل');
      }
    } else {
      if (!firstName.trim()) {
        newErrors.firstName = t('First name is required', 'الاسم الأول مطلوب');
      } else if (firstName.trim().length < 2) {
        newErrors.firstName = t('First name must be at least 2 characters', 'الاسم الأول يجب أن يكون حرفين على الأقل');
      }

      if (!lastName.trim()) {
        newErrors.lastName = t('Last name is required', 'اسم العائلة مطلوب');
      }

      if (!arabicName.trim()) {
        newErrors.arabicName = t('Arabic Name is required', 'الاسم بالعربي مطلوب');
      }
    }

    if (!trimmedEmail) {
      newErrors.email = t('Email address is required', 'البريد الإلكتروني مطلوب');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = t('Please enter a valid email address', 'يرجى أدخال بريد إلكتروني صحيح');
    }

    if (!trimmedPhone) {
      newErrors.phone = t('Phone number is required', 'رقم الهاتف مطلوب');
    } else if (trimmedPhone.length < 7) {
      newErrors.phone = t('Phone number must be at least 7 digits', 'رقم الهاتف يجب أن يكون 7 أرقام على الأقل');
    }
    
    if (vatRegistered) {
      if (!vatNumber.trim()) newErrors.vatNumber = t('VAT number is required', 'الرقم الضريبي مطلوب');
      else if (!/^\d{15}$/.test(vatNumber.trim())) newErrors.vatNumber = t('ZATCA VAT Number must be exactly 15 digits', 'الرقم الضريبي يجب أن يتكون من 15 رقماً');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const container = document.getElementById('edit-party-form-container');
      if (container) container.scrollTop = 0;
      return;
    }

    const previousLegalEn = partyData.legalNameEnglish || partyData.businessNameEnglish || partyData.displayName || '';
    const previousLegalAr = partyData.legalNameArabic || partyData.businessNameArabic || '';
    const nextLegalEn = legalEn.trim() && legalEn.trim() !== previousLegalEn ? legalEn.trim() : finalNameEn;
    const nextLegalAr = legalAr.trim() && legalAr.trim() !== previousLegalAr ? legalAr.trim() : finalNameAr;

    const payload = {
      partyType: type,
      businessNameEnglish: type === 'organization' ? finalNameEn : null,
      businessNameArabic: type === 'organization' ? (finalNameAr || null) : null,
      firstName: type === 'individual' ? firstName.trim() : null,
      lastName: type === 'individual' ? (lastName.trim() || null) : null,
      arabicName: type === 'individual' ? (arabicName.trim() || null) : null,
      vatRegistered,
      vatNumber: vatRegistered ? vatNumber.trim() : null,
      commercialRegistrationNumber: crNumber.trim() || null,
      primaryEmail: email.trim() || null,
      primaryPhone: phone.trim() || null,
      city: city.trim() || null,
      billingBuildingNumber: buildingNumber.trim() || null,
      billingStreet: street.trim() || null,
      billingDistrict: district.trim() || null,
      billingProvince: province.trim() || null,
      billingPostalCode: postalCode.trim() || null,
      billingAdditionalNumber: additionalNumber.trim() || null,
      billingCountry: country.trim() || 'Saudi Arabia',
      paymentTerms: paymentTerms.trim() || null,
      creditLimit: creditLimit.trim() || null,
      taxTreatment: taxTreatment.trim() || null,
      legalNameEnglish: type === 'organization' ? (nextLegalEn || null) : null,
      legalNameArabic: type === 'organization' ? (nextLegalAr || null) : null,
      website: website.trim() || null,
      notes: notes.trim() || null
    };

    const mutation = isCustomer ? updateCustomer : updateSupplier;
    
    mutation.mutate({
      organizationId: orgId,
      partyId: partyData.id,
      data: payload as any
    }, {
      onSuccess: () => {
        if (isCustomer) {
          queryClient.invalidateQueries({ queryKey: getGetCustomerQueryKey(orgId, partyData.id) });
          queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey(orgId) });
        } else {
          queryClient.invalidateQueries({ queryKey: getGetSupplierQueryKey(orgId, partyData.id) });
          queryClient.invalidateQueries({ queryKey: getGetSuppliersQueryKey(orgId) });
        }
        showAlert.toast(
          isCustomer ? t('Customer Updated Successfully!', 'تم تحديث العميل بنجاح!') : t('Supplier Updated Successfully!', 'تم تحديث المورد بنجاح!'),
          'success'
        );
        onOpenChange(false);
      },
      onError: (err: any) => {
        setErrors({ submit: err?.message || t('Something went wrong', 'حدث خطأ ما') });
        const container = document.getElementById('edit-party-form-container');
        if (container) container.scrollTop = 0;
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 border-b border-border bg-card/50">
          <SheetTitle className="text-xl font-bold">
            {isCustomer ? t('Edit Customer', 'تعديل العميل') : t('Edit Supplier', 'تعديل المورد')}
          </SheetTitle>
          <SheetDescription>
            {t('Update profile details and commercial terms.', 'تحديث معلومات السجل الشروحات التجارية.')}
          </SheetDescription>
        </SheetHeader>

        <div id="edit-party-form-container" className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="edit-party-form" onSubmit={handleSubmit} className="space-y-5">
            {errors.submit && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 font-medium">
                {errors.submit}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('Party Type', 'نوع الطرف')}</label>
              <div className="flex bg-muted/50 p-1 rounded-xl">
                <button type="button" onClick={() => setType('organization')} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${type === 'organization' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t('Organization', 'منشأة')}
                </button>
                <button type="button" onClick={() => setType('individual')} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${type === 'individual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t('Individual', 'فرد')}
                </button>
              </div>
            </div>

            {type === 'organization' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Business Name (English) *', 'اسم المنشأة (إنجليزي) *')}</label>
                  <input className={`field ${errors.nameEn ? 'border-destructive' : ''}`} value={nameEn} onChange={e => setNameEn(e.target.value)} />
                  {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Business Name (Arabic)', 'اسم المنشأة (عربي)')}</label>
                  <input className="field arabic" value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('First Name *', 'الاسم الأول *')}</label>
                  <input className={`field ${errors.firstName ? 'border-destructive' : ''}`} value={firstName} onChange={e => setFirstName(e.target.value)} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Last Name', 'اسم العائلة')}</label>
                  <input className="field" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold">{t('Arabic Name', 'الاسم بالعربي')}</label>
                  <input className="field arabic" value={arabicName} onChange={e => setArabicName(e.target.value)} dir="rtl" />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-border" checked={vatRegistered} onChange={e => setVatRegistered(e.target.checked)} />
                <span className="text-sm font-semibold">{t('VAT Registered', 'مسجل في ضريبة القيمة المضافة')}</span>
              </label>
              
              {vatRegistered && (
                <div className="space-y-1.5 mb-4 fade-up">
                  <label className="text-sm font-semibold">{t('VAT Registration Number', 'الرقم الضريبي')}</label>
                  <input className={`field ${errors.vatNumber ? 'border-destructive' : ''}`} value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="3xxxxxxxxxxxxx3" />
                  {errors.vatNumber ? (
                    <p className="text-xs text-destructive">{errors.vatNumber}</p>
                  ) : vatNumber.length === 15 ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('Format valid', 'الصيغة صحيحة')}</p>
                  ) : null}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Commercial Registration Number', 'رقم السجل التجاري')}</label>
                <input className="field" value={crNumber} onChange={e => setCrNumber(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Email', 'البريد الإلكتروني')}</label>
                <input type="email" className="field" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Phone', 'رقم الهاتف')}</label>
                <input type="tel" className="field" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold">{t('City', 'City')}</label>
                <input className="field" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Building Number', 'Building Number')}</label>
                <input className="field" value={buildingNumber} onChange={e => setBuildingNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Street', 'Street')}</label>
                <input className="field" value={street} onChange={e => setStreet(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('District', 'District')}</label>
                <input className="field" value={district} onChange={e => setDistrict(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Postal Code', 'Postal Code')}</label>
                <input className="field" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
              </div>
            </div>

            <div className="pt-2">
              <button type="button" onClick={() => setShowMore(!showMore)} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {t('More details', 'تفاصيل إضافية')}
              </button>
            </div>

            {showMore && (
              <div className="space-y-4 fade-up pt-2">
                {type === 'organization' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{t('Legal Name (En)', 'الاسم القانوني (إنجليزي)')}</label>
                      <input className="field" value={legalEn} onChange={e => setLegalEn(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold">{t('Legal Name (Ar)', 'الاسم القانوني (عربي)')}</label>
                      <input className="field arabic" value={legalAr} onChange={e => setLegalAr(e.target.value)} dir="rtl" />
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{t('Province / Region', 'Province / Region')}</label>
                    <input className="field" value={province} onChange={e => setProvince(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{t('Additional Number', 'Additional Number')}</label>
                    <input className="field" value={additionalNumber} onChange={e => setAdditionalNumber(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{t('Country', 'Country')}</label>
                    <input className="field" value={country} onChange={e => setCountry(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{t('Payment Terms', 'Payment Terms')}</label>
                    <select className="field" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                      <option value="Due on receipt">Due on receipt</option>
                      <option value="Net 7">Net 7</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 60">Net 60</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{t('Credit Limit', 'Credit Limit')}</label>
                    <input type="number" min="0" step="0.01" className="field" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{t('Tax Treatment', 'Tax Treatment')}</label>
                    <select className="field" value={taxTreatment} onChange={e => setTaxTreatment(e.target.value)}>
                      <option value="standard">Standard rated</option>
                      <option value="zero_rated">Zero rated</option>
                      <option value="exempt">Exempt</option>
                      <option value="out_of_scope">Out of scope</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Website', 'Website')}</label>
                  <input className="field" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Notes', 'ملاحظات')}</label>
                  <textarea className="field min-h-24 resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-border bg-card/50 flex flex-col gap-3 mt-auto">
          {Object.keys(errors).length > 0 && (
            <div className="p-2.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <span>⚠️ {Object.values(errors)[0]}</span>
            </div>
          )}
          <div className="flex gap-3 w-full">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="flex-1">
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" form="edit-party-form" variant="primary" className="flex-1" disabled={updateCustomer.isPending || updateSupplier.isPending}>
              {(updateCustomer.isPending || updateSupplier.isPending) ? t('Saving...', 'جاري الحفظ...') : t('Save Changes', 'حفظ التعديلات')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
