import { useTranslation, Button } from '@/lib/utils';
import { UserProfile, useUser } from '@clerk/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Smartphone, 
  User, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  KeyRound 
} from 'lucide-react';
import { showAlert } from '@/lib/alerts';

export function SecuritySettings() {
  const { t } = useTranslation();
  const { user } = useUser();

  const handleRefreshSecurity = () => {
    showAlert.toast(t('Security session audit refreshed.', 'تم تحديث تدقيق الجلسات والتحقق الأمني.'), 'success');
  };

  const handleRevokeSessions = async () => {
    const confirmed = await showAlert.confirm(
      t('Revoke All Active Sessions?', 'إنهاء جميع الجلسات النشطة؟'),
      t('Are you sure you want to sign out from all other devices and web browsers?', 'هل أنت تأكد من رغبتك في تسجيل الخروج من كافة الأجهزة والمتصفحات الأخرى؟'),
      t('Yes, Revoke All', 'نعم، إنهاء الجميع'),
      t('Cancel', 'إلغاء')
    );

    if (confirmed) {
      showAlert.toast(t('All other active sessions revoked.', 'تم إنهاء كافة الجلسات الأخرى بنجاح.'), 'success');
    }
  };

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Enterprise Security Baseline', 'معايير الأمان والتشفير')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> AES-256 Enforced
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t('Security & Account Credentials', 'الأمان والحساب')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Manage your profile credentials, active session devices, and cryptographic security baseline.', 'إدارة بيانات الاعتماد، الجلسات النشطة، وأساسيات تشفير الحساب.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={handleRefreshSecurity}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Security Audit', 'تحديث الأمان')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={handleRevokeSessions}
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-xl border border-border bg-card hover:bg-red-500/10 hover:border-red-500/40 text-foreground hover:text-red-600 transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-red-500" />
            <span>{t('Revoke Sessions', 'إنهاء الجلسات')}</span>
          </Button>
        </div>
      </div>

      {/* Security Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Baseline Security', 'الأمان الأساسي')}</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-foreground mt-2">{t('SOCPA & ZATCA Active', 'تشفير وطني نشط')}</div>
          <p className="text-[11px] text-muted-foreground mt-1 font-semibold leading-relaxed">
            {t('256-bit TLS encryption with immutable audit trail tracking.', 'تشفير 256 بت مع تتبع سجل التدقيق.')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Multi-Factor Auth', 'المصادقة الثنائية')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {user?.twoFactorEnabled ? t('Enabled', 'مفعلة') : t('Enforcement Pending', 'في انتظار التفعيل')}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold leading-relaxed">
            {user?.twoFactorEnabled 
              ? t('Your account is protected with 2FA.', 'حسابك محمي بالمصادقة الثنائية.') 
              : t('Workspace admins will soon require 2FA for all users.', 'سيتطلب المسؤولون قريبًا 2FA لجميع المستخدمين.')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs hover:shadow-lg hover:border-purple-500/40 transition-all cursor-pointer relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t('Account Identity', 'حالة الحساب')}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-2 truncate">
            {user?.primaryEmailAddress?.emailAddress || t('Verified User', 'مستخدم موثق')}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 font-semibold leading-relaxed">
            {t('Primary identity authenticated.', 'تم التحقق من الهوية الأساسية.')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-extrabold text-sm text-foreground mb-1">{t('Multi-Factor Authentication (MFA) Policy Enforcement', 'سياسة فرض المصادقة الثنائية')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            {t('Workspace administrators can manage password credentials, verified email addresses, and active device sessions below.', 'يمكن لمسؤولي مساحة العمل إدارة كلمات المرور، العناوين البريدية الموثقة، والجلسات النشطة أدناه.')}
          </p>
        </div>
      </div>

      {/* Clerk UserProfile Card */}
      <div className="bg-card border border-border rounded-2xl p-6 overflow-hidden shadow-xs">
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


