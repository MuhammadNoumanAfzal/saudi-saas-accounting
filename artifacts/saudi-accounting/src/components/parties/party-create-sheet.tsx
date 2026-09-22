import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  useCreateCustomer, 
  useCreateSupplier,
  useCheckPartyDuplicates,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey,
  getGetDashboardSummaryQueryKey
} from '@workspace/api-client-react';
import { useDebounce } from '@/hooks/use-debounce';
import { queryClient } from '@/lib/queryClient';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import * as z from 'zod';

export function PartyCreateSheet({ 
  open, 
  onOpenChange, 
  role, 
  orgId, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  role: 'customer' | 'supplier';
  orgId: string;
  onSuccess: (id: string) => void;
}) {
  const { t, isRtl } = useTranslation();
  const isCustomer = role === 'customer';

  const createCustomer = useCreateCustomer();
  const createSupplier = useCreateSupplier();
  const checkDuplicates = useCheckPartyDuplicates();

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
  
  const [showMore, setShowMore] = useState(false);
  const [legalEn, setLegalEn] = useState('');
  const [legalAr, setLegalAr] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const debouncedNameEn = useDebounce(nameEn, 500);
  const debouncedVat = useDebounce(vatNumber, 500);
  const debouncedCr = useDebounce(crNumber, 500);

  // Check duplicates
  useEffect(() => {
    if (!open || !orgId) return;
    
    if (debouncedNameEn.length > 3 || debouncedVat.length > 5 || debouncedCr.length > 5) {
      checkDuplicates.mutate({
        organizationId: orgId,
        partyId: 'new',
        data: {
          businessNameEnglish: debouncedNameEn || undefined,
          vatNumber: debouncedVat || undefined,
          commercialRegistrationNumber: debouncedCr || undefined
        }
      }, {
        onSuccess: (res) => {
          if (res && res.length > 0) {
            const exact = res.find(r => r.strength === 'exact');
            if (exact) {
              setDuplicateWarning(t(`Exact match found: ${exact.displayName} (${exact.reason})`, `تم العثور على تطابق تام: ${exact.displayName} (${exact.reason})`));
            } else {
              setDuplicateWarning(t(`Possible duplicate: ${res[0].displayName}`, `تكرار محتمل: ${res[0].displayName}`));
            }
          } else {
            setDuplicateWarning(null);
          }
        },
        onError: () => setDuplicateWarning(null)
      });
    }
  }, [debouncedNameEn, debouncedVat, debouncedCr, open, orgId]);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setType('organization');
      setNameEn('');
      setNameAr('');
      setFirstName('');
      setLastName('');
      setArabicName('');
      setVatRegistered(false);
      setVatNumber('');
      setCrNumber('');
      setEmail('');
      setPhone('');
      setCity('');
      setShowMore(false);
      setLegalEn('');
      setLegalAr('');
      setWebsite('');
      setNotes('');
      setErrors({});
      setDuplicateWarning(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fallback: if Business Name En/Ar is empty, use Legal Name En/Ar if provided
    const finalNameEn = nameEn.trim() || legalEn.trim();
    const finalNameAr = nameAr.trim() || legalAr.trim();

    const newErrors: Record<string, string> = {};
    if (type === 'organization') {
      if (!finalNameEn && !finalNameAr) {
        newErrors.nameEn = t('Business Name (English or Arabic) is required (min 2 chars)', 'اسم المنشأة مطلوب بالإنجليزي أو العربي (حرفين على الأقل)');
        newErrors.nameAr = t('Business Name (English or Arabic) is required (min 2 chars)', 'اسم المنشأة مطلوب بالإنجليزي أو العربي (حرفين على الأقل)');
      } else {
        if (finalNameEn && finalNameEn.length < 2) {
          newErrors.nameEn = t('Business Name must be at least 2 characters', 'اسم المنشأة يجب أن يكون حرفين على الأقل');
        }
        if (finalNameAr && finalNameAr.length < 2) {
          newErrors.nameAr = t('Business Name must be at least 2 characters', 'اسم المنشأة يجب أن يكون حرفين على الأقل');
        }
      }
    } else {
      if (!firstName.trim()) {
        newErrors.firstName = t('First name is required', 'الاسم الأول مطلوب');
      } else if (firstName.trim().length < 2) {
        newErrors.firstName = t('First name must be at least 2 characters', 'الاسم الأول يجب أن يكون حرفين على الأقل');
      }
    }
    
    // VAT Number: If checked, must be trimmed and exactly 15 digits starting and ending with 3
    if (vatRegistered) {
      const trimmedVat = vatNumber.trim();
      if (!trimmedVat) {
        newErrors.vatNumber = t('VAT registration number is required when VAT registered', 'الرقم الضريبي مطلوب للمنشآت المسجلة ضريبياً');
      } else if (!/^3\d{13}3$/.test(trimmedVat)) {
        newErrors.vatNumber = t('ZATCA VAT number must be 15 digits starting and ending with 3 (e.g. 310123456780003)', 'الرقم الضريبي ZATCA يجب أن يتكون من 15 رقماً يبدأ وينتهي بـ 3');
      }
    }

    // Commercial Registration (CR): If provided, must be 10 numeric digits
    if (crNumber.trim()) {
      const trimmedCr = crNumber.trim();
      if (!/^\d{10}$/.test(trimmedCr)) {
        newErrors.crNumber = t('Commercial Registration (CR) must be exactly 10 digits', 'رقم السجل التجاري يجب أن يتكون من 10 أرقام بالضبط');
      }
    }

    // Email format validation
    if (email.trim()) {
      const trimmedEmail = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        newErrors.email = t('Please enter a valid email address', 'يرجى أدخال بريد إلكتروني صحيح');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert.error(
        t('Validation Error', 'خطأ في البيانات'),
        t('Please correct the highlighted errors before saving.', 'يرجى تصحيح الأخطاء المحددة قبل الحفظ.')
      );
      // Auto-scroll container to top to reveal error fields
      const container = document.getElementById('party-form-container');
      if (container) container.scrollTop = 0;
      return;
    }

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
      legalNameEnglish: legalEn.trim() || finalNameEn || null,
      legalNameArabic: legalAr.trim() || finalNameAr || null,
      website: website.trim() || null,
      notes: notes.trim() || null
    };

    const mutation = isCustomer ? createCustomer : createSupplier;
    
    mutation.mutate({
      organizationId: orgId,
      data: payload as any
    }, {
      onSuccess: (data) => {
        if (isCustomer) {
          queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey(orgId) });
        } else {
          queryClient.invalidateQueries({ queryKey: getGetSuppliersQueryKey(orgId) });
        }
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(orgId) });
        showAlert.success(
          isCustomer ? t('Customer Created!', 'تم إضافة العميل!') : t('Supplier Created!', 'تم إضافة المورد!'),
          t('Profile has been saved successfully.', 'تم حفظ الملف بنجاح.')
        );
        onSuccess(data.id);
      },
      onError: (err: any) => {
        setErrors({ submit: err?.message || t('Something went wrong', 'حدث خطأ ما') });
        const container = document.getElementById('party-form-container');
        if (container) container.scrollTop = 0;
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 border-b border-border bg-card/50">
          <SheetTitle className="text-xl font-bold">
            {isCustomer ? t('New Customer', 'عميل جديد') : t('New Supplier', 'مورد جديد')}
          </SheetTitle>
          <SheetDescription>
            {isCustomer 
              ? t('Create a new customer profile.', 'إنشاء ملف عميل جديد.') 
              : t('Create a new supplier profile.', 'إنشاء ملف مورد جديد.')}
          </SheetDescription>
        </SheetHeader>

        <div id="party-form-container" className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="party-form" onSubmit={handleSubmit} className="space-y-5">
            {errors.submit && (
              <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg text-sm border border-red-500/20 font-medium">
                {errors.submit}
              </div>
            )}

            {Object.keys(errors).length > 0 && !errors.submit && (
              <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg text-sm border border-red-500/20 font-medium flex gap-2 items-center">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{t('Please correct mandatory fields marked below.', 'يرجى تصحيح الحقول الإلزامية المحددة أدناه.')}</span>
              </div>
            )}

            {duplicateWarning && (
              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg text-sm border border-amber-500/20 font-medium flex gap-2 items-start">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">{t('Party Type', 'نوع الطرف')} <span className="text-red-500">*</span></label>
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
                  <label className="text-sm font-semibold">{t('Business Name (English)', 'اسم المنشأة (إنجليزي)')} <span className="text-red-500">*</span></label>
                  <input 
                    className={`field ${errors.nameEn ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                    value={nameEn} 
                    onChange={e => { setNameEn(e.target.value); if (errors.nameEn) setErrors(prev => ({ ...prev, nameEn: '' })); }} 
                    placeholder="e.g. Al-Riyadh Technology Co."
                  />
                  {errors.nameEn && <p className="text-xs font-medium text-red-500">{errors.nameEn}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Business Name (Arabic)', 'اسم المنشأة (عربي)')}</label>
                  <input 
                    className={`field arabic ${errors.nameAr ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                    value={nameAr} 
                    onChange={e => { setNameAr(e.target.value); if (errors.nameAr) setErrors(prev => ({ ...prev, nameAr: '' })); }} 
                    dir="rtl" 
                    placeholder="مثال: شركة تقنية الرياض"
                  />
                  {errors.nameAr && <p className="text-xs font-medium text-red-500">{errors.nameAr}</p>}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('First Name', 'الاسم الأول')} <span className="text-red-500">*</span></label>
                  <input 
                    className={`field ${errors.firstName ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                    value={firstName} 
                    onChange={e => { setFirstName(e.target.value); if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' })); }} 
                  />
                  {errors.firstName && <p className="text-xs font-medium text-red-500">{errors.firstName}</p>}
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
                  <label className="text-sm font-semibold">{t('VAT Registration Number', 'الرقم الضريبي')} <span className="text-red-500">*</span></label>
                  <input 
                    className={`field ${errors.vatNumber ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                    value={vatNumber} 
                    onChange={e => { setVatNumber(e.target.value); if (errors.vatNumber) setErrors(prev => ({ ...prev, vatNumber: '' })); }} 
                    placeholder="310123456780003" 
                  />
                  {errors.vatNumber ? (
                    <p className="text-xs font-medium text-red-500">{errors.vatNumber}</p>
                  ) : /^3\d{13}3$/.test(vatNumber.trim()) ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('Valid ZATCA 15-digit TIN format', 'صيغة الرقم الضريبي ZATCA صحيحة (15 رقم)')}</p>
                  ) : null}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Commercial Registration Number', 'رقم السجل التجاري (CR)')}</label>
                <input 
                  className={`field ${errors.crNumber ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                  value={crNumber} 
                  onChange={e => { setCrNumber(e.target.value); if (errors.crNumber) setErrors(prev => ({ ...prev, crNumber: '' })); }} 
                  placeholder="1010123456"
                />
                {errors.crNumber && <p className="text-xs font-medium text-red-500">{errors.crNumber}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Email', 'البريد الإلكتروني')}</label>
                <input 
                  type="email" 
                  className={`field ${errors.email ? 'border-red-500 bg-red-500/5 focus:ring-red-500/20' : ''}`} 
                  value={email} 
                  onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }} 
                  placeholder="name@domain.com"
                />
                {errors.email && <p className="text-xs font-medium text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{t('Phone', 'رقم الهاتف')}</label>
                <input type="tel" className="field" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-semibold">{t('City', 'المدينة')}</label>
                <input className="field" value={city} onChange={e => setCity(e.target.value)} />
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
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{t('Website', 'الموقع الإلكتروني')}</label>
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
            <div className="p-2.5 bg-red-500/10 text-red-500 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <span>⚠️ {Object.values(errors)[0]}</span>
            </div>
          )}
          <div className="flex gap-3 w-full">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="flex-1">
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button type="submit" form="party-form" variant="primary" className="flex-1" disabled={createCustomer.isPending || createSupplier.isPending}>
              {(createCustomer.isPending || createSupplier.isPending) ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
