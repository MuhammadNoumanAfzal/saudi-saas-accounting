import { useGetCurrentSession, useListAuditLogs, getListAuditLogsQueryKey } from '@workspace/api-client-react';
import { useTranslation } from '@/lib/utils';
import { FileClock, Activity } from 'lucide-react';

export function AuditLogSettings() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  
  const orgId =
    session?.organizations?.find(
      item => item.organization.id === session.preferences.currentOrganizationId,
    )?.organization.id ?? session?.organizations?.[0]?.organization.id ?? '';
  const { data: logs, isLoading } = useListAuditLogs(orgId, { query: { enabled: !!orgId, queryKey: getListAuditLogsQueryKey(orgId) } });

  return (
    <div className="max-w-[800px] space-y-8 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Audit Log', 'سجل النشاط')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('A permanent, uneditable record of workspace events.', 'سجل دائم غير قابل للتعديل لأحداث مساحة العمل.')}</p>
      </div>

      <div className="soft-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="shimmer h-12 w-full rounded" />)}
          </div>
        ) : !logs?.length ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <FileClock size={32} className="text-muted-foreground/30 mb-4" />
            <div className="font-bold text-foreground mb-2">{t('No events recorded', 'لم يتم تسجيل أي أحداث')}</div>
            <p className="text-sm text-muted-foreground max-w-[300px]">
              {t('Actions taken by users in this workspace will appear here with a precise timestamp.', 'الإجراءات المتخذة من قبل المستخدمين في هذه المساحة ستظهر هنا مع طابع زمني دقيق.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map(log => (
              <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                <div className="p-2 bg-muted rounded-full text-muted-foreground mt-0.5 shrink-0">
                  <Activity size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-SA', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(log.createdAt))}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('Entity type:', 'نوع الكيان:')} <span className="font-mono bg-muted/50 px-1 rounded">{log.entityType}</span>
                    {log.entityId && <span className="ms-2">{t('ID:', 'المعرف:')} <span className="font-mono bg-muted/50 px-1 rounded">{log.entityId}</span></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
