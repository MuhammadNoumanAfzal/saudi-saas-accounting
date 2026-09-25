import { useTranslation, Button } from '@/lib/utils';
import type { Account } from '@workspace/api-client-react';
import { SkeletonTable } from '@/components/ui/platform-loader';
import { RowActions } from '@/components/ui/row-actions';
import { FolderTree, Plus, ShieldCheck, Tag } from 'lucide-react';

interface AccountTableProps {
  accounts: Account[];
  isLoading: boolean;
  search: string;
  typeFilter: string;
  onViewAccount?: (account: Account) => void;
  onEditAccount?: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  onCreateClick: () => void;
}

export function AccountTable({
  accounts,
  isLoading,
  search,
  typeFilter,
  onViewAccount,
  onEditAccount,
  onDeleteAccount,
  onCreateClick,
}: AccountTableProps) {
  const { t, isRtl } = useTranslation();

  const getTypeBadge = (accType: string) => {
    switch (accType) {
      case 'ASSET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'أصول' : 'Asset'}</span>
          </span>
        );
      case 'LIABILITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'التزامات' : 'Liability'}</span>
          </span>
        );
      case 'EQUITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'حقوق ملكية' : 'Equity'}</span>
          </span>
        );
      case 'REVENUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'إيرادات' : 'Revenue'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Tag size={10} />
            <span>{isRtl ? 'مصروفات' : 'Expense'}</span>
          </span>
        );
    }
  };

  const formatSubtype = (sub: string) => {
    switch (sub?.toUpperCase()) {
      case 'CURRENT_ASSET': return isRtl ? 'أصول متداولة' : 'Current Asset';
      case 'NON_CURRENT_ASSET': return isRtl ? 'أصول غير متداولة' : 'Non-Current Asset';
      case 'CURRENT_LIABILITY': return isRtl ? 'التزامات متداولة' : 'Current Liability';
      case 'LONG_TERM_LIABILITY': return isRtl ? 'التزامات طويلة الأجل' : 'Long-Term Liability';
      case 'EQUITY_DIRECT': return isRtl ? 'حقوق ملكية مباشرة' : 'Direct Equity';
      case 'OPERATING_REVENUE': return isRtl ? 'إيرادات تشغيلية' : 'Operating Revenue';
      case 'NON_OPERATING_REVENUE': return isRtl ? 'إيرادات غير تشغيلية' : 'Non-Operating Revenue';
      case 'OPERATING_EXPENSE': return isRtl ? 'مصروفات تشغيلية' : 'Operating Expense';
      case 'OTHER_EXPENSE': return isRtl ? 'مصروفات أخرى' : 'Other Expense';
      default: return sub ? sub.replace(/_/g, ' ') : '-';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{t('Loading Saudi SOCPA Standardized Chart of Accounts...', 'جاري تحميل شجرة الحسابات المعتمدة (SOCPA)...')}</span>
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center border-dashed">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
          <FolderTree size={28} />
        </div>
        <h3 className="text-lg font-black mb-1">{t('No accounts found', 'لا توجد حسابات')}</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {search || typeFilter 
            ? t('Try adjusting your search query or type filter.', 'تأكد من اختيار الفلاتر المناسبة أو تعديل كلمة البحث.')
            : t('Add custom ledger accounts to organize your financial structure according to SOCPA standards.', 'أضف حسابات دفتر الأستاذ لتنظيم هيكلك المالي وفق معايير الهيئة السعودية.')}
        </p>
        {!search && !typeFilter && (
          <Button className="btn-primary rounded-xl text-xs font-bold gap-2 cursor-pointer" onClick={onCreateClick}>
            <Plus size={16} /> {t('New Account', 'إضافة حساب جديد')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left rtl:text-right">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground border-b border-border font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Code', 'رمز الحساب')}</th>
              <th className="px-5 py-3.5">{t('Account Name', 'اسم الحساب')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Type', 'النوع')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Subtype', 'التصنيف الفرعي')}</th>
              <th className="px-5 py-3.5 whitespace-nowrap">{t('Account System', 'نوع الحساب')}</th>
              <th className="px-5 py-3.5 w-24 text-center whitespace-nowrap">{t('Action', 'إجراء')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {accounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-primary text-xs font-mono font-extrabold border border-border group-hover:border-primary/40 whitespace-nowrap">
                    {acc.code}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-extrabold text-foreground text-sm">{acc.nameArabic}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">{acc.nameEnglish}</div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {getTypeBadge(acc.type)}
                </td>
                <td className="px-5 py-4 text-muted-foreground text-xs font-semibold whitespace-nowrap">
                  {formatSubtype(acc.subtype)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {acc.isSystemAccount ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 whitespace-nowrap">
                      <ShieldCheck size={12} />
                      <span>{t('System', 'نظامي')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold text-[11px] border border-border whitespace-nowrap">
                      {t('Custom', 'مخصص')}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-center whitespace-nowrap">
                  <RowActions
                    onView={onViewAccount ? () => onViewAccount(acc) : undefined}
                    onEdit={onEditAccount ? () => onEditAccount(acc) : undefined}
                    onDelete={!acc.isSystemAccount ? () => onDeleteAccount(acc) : undefined}
                    deleteDisabled={acc.isSystemAccount}
                    viewLabel={t('View Account', 'عرض الحساب')}
                    editLabel={t('Edit Account', 'تعديل الحساب')}
                    deleteLabel={t('Delete Account', 'حذف الحساب')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards View */}
      <div className="md:hidden divide-y divide-border">
        {accounts.map((acc) => (
          <div key={acc.id} className="p-4 active:bg-primary/5 transition-colors space-y-3 hover:bg-muted/20">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-foreground text-sm truncate">{acc.nameArabic}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{acc.nameEnglish}</div>
                <div className="text-xs text-muted-foreground mt-1.5 flex gap-2 items-center flex-wrap">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded-md font-bold text-[11px] border border-border text-primary whitespace-nowrap">
                    {acc.code}
                  </span>
                  {getTypeBadge(acc.type)}
                </div>
              </div>
              <div className="shrink-0">
                <RowActions
                  onView={onViewAccount ? () => onViewAccount(acc) : undefined}
                  onEdit={onEditAccount ? () => onEditAccount(acc) : undefined}
                  onDelete={!acc.isSystemAccount ? () => onDeleteAccount(acc) : undefined}
                  deleteDisabled={acc.isSystemAccount}
                  viewLabel={t('View', 'عرض')}
                  editLabel={t('Edit', 'تعديل')}
                  deleteLabel={t('Delete', 'حذف')}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-2.5 border-t border-border/60">
              <div className="text-xs font-semibold text-muted-foreground truncate">
                {formatSubtype(acc.subtype)}
              </div>
              <div>
                {acc.isSystemAccount ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">{t('System Account', 'حساب نظامي')}</span>
                ) : (
                  <span className="text-muted-foreground font-semibold text-[11px]">{t('Custom Account', 'حساب مخصص')}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
