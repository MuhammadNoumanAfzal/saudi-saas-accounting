import { useState, useEffect } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { getErrorMessage } from '@/lib/form-errors';
import { useCreateAccount } from '@workspace/api-client-react';
import type { Account } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';
import { getListAccountsQueryKey } from '@workspace/api-client-react';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter 
} from '@/components/ui/sheet';
import { Landmark, Save, ShieldCheck } from 'lucide-react';

interface AccountCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  initialAccount?: Account | null;
  onSuccess: () => void;
}

export function AccountCreateSheet({
  open,
  onOpenChange,
  orgId,
  initialAccount,
  onSuccess,
}: AccountCreateSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const createMutation = useCreateAccount();

  const [code, setCode] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [nameArabic, setNameArabic] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [subtype, setSubtype] = useState('OPERATING_EXPENSE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = Boolean(initialAccount);

  useEffect(() => {
    if (initialAccount) {
      setCode(initialAccount.code || '');
      setNameEnglish(initialAccount.nameEnglish || '');
      setNameArabic(initialAccount.nameArabic || '');
      setType(initialAccount.type || 'EXPENSE');
      setSubtype(initialAccount.subtype || 'OPERATING_EXPENSE');
    } else {
      setCode('');
      setNameEnglish('');
      setNameArabic('');
      setType('EXPENSE');
      setSubtype('OPERATING_EXPENSE');
    }
    setErrorMsg('');
  }, [initialAccount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code || !nameEnglish || !nameArabic) {
      setErrorMsg(t('All fields marked * are required', 'جميع الحقول المحددة بـ * مطلوبة'));
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing && initialAccount) {
        await customFetch(`/api/organizations/${orgId}/accounting/accounts/${initialAccount.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nameEnglish,
            nameArabic,
            type,
            subtype,
          }),
        });
        showAlert.toast(t('Account Updated Successfully!', 'تم تحديث الحساب بنجاح!'), 'success');
      } else {
        await createMutation.mutateAsync({
          organizationId: orgId,
          data: {
            code,
            nameEnglish,
            nameArabic,
            type: type as any,
            subtype,
          },
        });
        showAlert.toast(t('Account Created Successfully!', 'تم إنشاء الحساب بنجاح!'), 'success');
      }

      queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey(orgId) });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(getErrorMessage(err, t('Failed to save account', 'تعذر حفظ الحساب')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border p-6 overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Landmark className="w-3.5 h-3.5 text-primary" />
              <span>{t('SOCPA Standard', 'معيار المحاسبة السعودي')}</span>
            </span>
          </div>
          <SheetTitle className="text-xl font-black text-foreground">
            {isEditing ? t('Edit Account', 'تعديل الحساب') : t('Create New Account', 'إضافة حساب جديد')}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {t('Configure general ledger account under Saudi SOCPA standardized chart of accounts.', 'قم بإعداد حساب دفتر الأستاذ العام وفق الدليل المحاسبي السعودي المعتمد.')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-foreground">
              {t('Account Code *', 'رمز الحساب *')}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 50600"
              disabled={isEditing}
              required
              className="field bg-background h-10 rounded-xl w-full text-xs font-mono font-bold disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-foreground">
              {t('Arabic Name *', 'اسم الحساب باللغة العربية *')}
            </label>
            <input
              type="text"
              value={nameArabic}
              onChange={(e) => setNameArabic(e.target.value)}
              placeholder="مثال: مصروفات تسويق إلكتروني"
              required
              className="field bg-background h-10 rounded-xl w-full text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-foreground">
              {t('English Name *', 'اسم الحساب باللغة الإنجليزية *')}
            </label>
            <input
              type="text"
              value={nameEnglish}
              onChange={(e) => setNameEnglish(e.target.value)}
              placeholder="e.g. Digital Marketing Expense"
              required
              className="field bg-background h-10 rounded-xl w-full text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-foreground">
              {t('Account Category *', 'نوع الحساب الرئيسي *')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="field bg-background h-10 rounded-xl w-full text-xs font-semibold cursor-pointer"
            >
              <option value="ASSET">{t('ASSET (أصول)', 'ASSET (أصول)')}</option>
              <option value="LIABILITY">{t('LIABILITY (التزامات)', 'LIABILITY (التزامات)')}</option>
              <option value="EQUITY">{t('EQUITY (حقوق ملكية)', 'EQUITY (حقوق ملكية)')}</option>
              <option value="REVENUE">{t('REVENUE (إيرادات)', 'REVENUE (إيرادات)')}</option>
              <option value="EXPENSE">{t('EXPENSE (مصروفات)', 'EXPENSE (مصروفات)')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-foreground">
              {t('Subtype', 'التصنيف الفرعي')}
            </label>
            <select
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              className="field bg-background h-10 rounded-xl w-full text-xs font-semibold cursor-pointer"
            >
              <option value="CURRENT_ASSET">CURRENT_ASSET</option>
              <option value="NON_CURRENT_ASSET">NON_CURRENT_ASSET</option>
              <option value="CURRENT_LIABILITY">CURRENT_LIABILITY</option>
              <option value="LONG_TERM_LIABILITY">LONG_TERM_LIABILITY</option>
              <option value="EQUITY_DIRECT">EQUITY_DIRECT</option>
              <option value="OPERATING_REVENUE">OPERATING_REVENUE</option>
              <option value="NON_OPERATING_REVENUE">NON_OPERATING_REVENUE</option>
              <option value="OPERATING_EXPENSE">OPERATING_EXPENSE</option>
              <option value="OTHER_EXPENSE">OTHER_EXPENSE</option>
            </select>
          </div>

          <div className="pt-3 p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>{t('SOCPA Compliance Note', 'ملاحظة المعيار المحاسبي')}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {t('New accounts will be registered into the organization general ledger under standard SOCPA structure.', 'سيتم تسجيل الحساب الجديد في دفتر الأستاذ العام وفق الشجرة المعتمدة.')}
            </p>
          </div>

          <SheetFooter className="pt-4 border-t border-border flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold px-4 cursor-pointer"
            >
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="btn-primary rounded-xl text-xs font-bold px-5 gap-1.5 cursor-pointer"
            >
              <Save size={14} />
              <span>{submitting ? t('Saving...', 'جاري الحفظ...') : t('Save Account', 'حفظ الحساب')}</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
