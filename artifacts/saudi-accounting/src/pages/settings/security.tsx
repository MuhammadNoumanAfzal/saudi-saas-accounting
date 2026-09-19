import { useTranslation } from '@/lib/utils';
import { UserProfile, useUser } from '@clerk/react';
import { ShieldAlert, ShieldCheck, KeyRound, Lock, Smartphone, User, History } from 'lucide-react';

export function SecuritySettings() {
  const { t } = useTranslation();
  const { user } = useUser();

  return (
    <div className="max-w-[1000px] space-y-8 fade-up pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Security & Account', 'الأمان والحساب')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Manage your profile credentials, active sessions, and security baseline.', 'إدارة بيانات الاعتماد، الجلسات النشطة، وأساسيات الأمان.')}
        </p>
      </div>

      {/* Security Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="soft-card p-5 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Baseline Security', 'الأمان الأساسي')}</div>
            <div className="text-sm font-bold text-foreground mt-0.5">{t('SOCPA & ZATCA Active', 'تشفير وطني نشط')}</div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {t('256-bit TLS encryption with audit trail tracking.', 'تشفير 256 بت مع تتبع سجل التدقيق.')}
            </p>
          </div>
        </div>

        <div className="soft-card p-5 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Multi-Factor Auth', 'المصادقة الثنائية')}</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {user?.twoFactorEnabled ? t('Enabled', 'مفعلة') : t('Enforcement Pending', 'في انتظار التفعيل')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {user?.twoFactorEnabled 
                ? t('Your account is protected with 2FA.', 'حسابك محمي بالمصادقة الثنائية.') 
                : t('Workspace admins will soon require 2FA for all users.', 'سيتطلب المسؤولون قريبًا 2FA لجميع المستخدمين.')}
            </p>
          </div>
        </div>

        <div className="soft-card p-5 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <User size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Account Status', 'حالة الحساب')}</div>
            <div className="text-sm font-bold text-foreground mt-0.5 truncate max-w-[170px]">
              {user?.primaryEmailAddress?.emailAddress || t('Verified User', 'مستخدم موثق')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {t('Primary identity authenticated.', 'تم التحقق من الهوية الأساسية.')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
        <ShieldAlert size={18} className="text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm text-foreground mb-1">{t('Multi-Factor Authentication (MFA) is upcoming', 'المصادقة المتعددة العوامل قادمة قريباً')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('Workspace administrators will soon be able to enforce MFA for all team members. For now, you can manage your password, emails, and connected devices below.', 'سيتمكن مسؤولو مساحة العمل قريباً من فرض المصادقة المتعددة لجميع أعضاء الفريق. في الوقت الحالي، يمكنك إدارة كلمة المرور، البريد الإلكتروني، والأجهزة المتصلة أدناه.')}
          </p>
        </div>
      </div>

      {/* Clerk UserProfile Card */}
      <div className="soft-card p-6 overflow-hidden">
        <UserProfile 
          routing="hash" 
          appearance={{
            elements: {
              rootBox: "w-full max-w-full overflow-hidden",
              cardBox: "w-full max-w-full shadow-none border-0 bg-transparent p-0",
              card: "w-full max-w-full shadow-none border-0 bg-transparent p-0 flex flex-col sm:flex-row gap-6",
              navbar: "border-b sm:border-b-0 sm:border-r border-border pb-4 sm:pb-0 sm:pr-6 sm:me-2 flex sm:flex-col gap-1 shrink-0 w-full sm:w-52",
              navbarButtons: "flex sm:flex-col gap-1 w-full",
              navbarButton: "text-foreground font-medium rounded-xl px-3 py-2.5 text-xs sm:text-sm hover:bg-muted font-sans text-start justify-start transition-colors w-full flex items-center gap-2",
              navbarButtonActive: "bg-primary/10 text-primary font-bold hover:bg-primary/15",
              pageScrollBox: "p-0 min-w-0 flex-1 overflow-x-auto w-full",
              profilePage: "p-0 min-w-0 w-full max-w-full space-y-6",
              headerTitle: "text-xl font-bold text-foreground tracking-tight",
              headerSubtitle: "text-xs sm:text-sm text-muted-foreground",
              profileSectionTitleText: "font-bold text-sm text-foreground",
              profileSectionTitle: "border-b border-border/50 pb-2 mb-4",
              profileSectionContent: "w-full overflow-x-auto",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm transition-all shadow-sm",
              formButtonReset: "bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl px-4 py-2 font-medium text-xs sm:text-sm transition-all",
              badge: "bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider",
              userPreviewMainIdentifier: "font-bold text-foreground text-sm",
              userPreviewSecondaryIdentifier: "text-xs text-muted-foreground",
              avatarImageActionsUpload: "bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg px-2.5 py-1.5",
            }
          }}
        />
      </div>
    </div>
  );
}

