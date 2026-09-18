import { useTranslation } from '@/lib/utils';
import { UserProfile } from '@clerk/react';
import { ShieldAlert } from 'lucide-react';

export function SecuritySettings() {
  const { t } = useTranslation();

  return (
    <div className="max-w-[800px] space-y-8 fade-up pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Security', 'الأمان')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Manage your password, connected accounts, and security baseline.', 'إدارة كلمة المرور، الحسابات المتصلة، وأساسيات الأمان.')}</p>
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
        <ShieldAlert size={18} className="text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-foreground mb-1">{t('Multi-Factor Authentication (MFA) is upcoming', 'المصادقة المتعددة العوامل قادمة قريباً')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('Workspace administrators will soon be able to enforce MFA for all team members. For now, you can manage your personal security settings below.', 'سيتمكن مسؤولو مساحة العمل قريباً من فرض المصادقة المتعددة لجميع أعضاء الفريق. في الوقت الحالي، يمكنك إدارة إعدادات الأمان الشخصية الخاصة بك أدناه.')}
          </p>
        </div>
      </div>

      <div className="soft-card overflow-hidden">
        <UserProfile 
          routing="hash" 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full max-w-none shadow-none border-0 rounded-none bg-transparent",
              navbar: "hidden", // Hide clerk sidebar to avoid double-navigation confusion
              pageScrollBox: "p-0",
            }
          }}
        />
      </div>
    </div>
  );
}
