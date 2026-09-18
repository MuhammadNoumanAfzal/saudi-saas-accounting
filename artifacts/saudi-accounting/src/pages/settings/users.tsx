import { useGetCurrentSession } from '@workspace/api-client-react';
import { useTranslation } from '@/lib/utils';
import { Users, Mail, ShieldAlert } from 'lucide-react';

export function UsersSettings() {
  const { data: session } = useGetCurrentSession();
  const { t } = useTranslation();
  
  const user = session?.user;
  const role =
    session?.organizations?.find(
      item => item.organization.id === session.preferences.currentOrganizationId,
    )?.role ?? session?.organizations?.[0]?.role;

  return (
    <div className="max-w-[800px] space-y-8 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Users & Roles', 'المستخدمون والأدوار')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Manage team access and permissions.', 'إدارة وصول الفريق والصلاحيات.')}</p>
      </div>

      <div className="soft-card p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-lg">{user?.displayName || t('Current User', 'المستخدم الحالي')}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Mail size={14} /> {user?.email}
            </div>
          </div>
          <div className="ms-auto flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wider">
            <Users size={14} />
            {role || t('Owner', 'المالك')}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 flex items-start gap-4">
          <div className="p-2 bg-background rounded-lg shadow-sm text-muted-foreground mt-1">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1">{t('Invitations are currently unavailable', 'الدعوات غير متاحة حالياً')}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[500px]">
              {t('Team invitations and role management will be enabled once email delivery configuration is finalized in the next release.', 'سيتم تفعيل دعوات الفريق وإدارة الأدوار بمجرد الانتهاء من إعدادات تسليم البريد الإلكتروني في التحديث القادم.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
