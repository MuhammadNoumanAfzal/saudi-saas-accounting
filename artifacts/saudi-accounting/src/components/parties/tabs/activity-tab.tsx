import { useTranslation } from '@/lib/utils';
import { useListAuditLogs, getListAuditLogsQueryKey } from '@workspace/api-client-react';
import { Clock, History, Shield, Activity } from 'lucide-react';

export function ActivityTab({ partyId, orgId }: { partyId: string, orgId: string }) {
  const { t, isRtl } = useTranslation();
  
  const { data: logs, isLoading } = useListAuditLogs(orgId, {
    query: { 
      enabled: !!orgId,
      queryKey: getListAuditLogsQueryKey(orgId)
    }
  });

  const belongsToParty = (values: Record<string, unknown> | null | undefined) =>
    values?.partyId === partyId;
  const partyLogs = logs?.filter(log =>
    log.entityId === partyId ||
    belongsToParty(log.previousValues) ||
    belongsToParty(log.newValues)
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <History size={18} className="text-primary" />
            <span>{t('Activity Audit Log', 'سجل النشاط والتغييرات')}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('Immutable audit log tracking creation, edits, and status changes.', 'تتبع كامل للإضافات والتعديلات وتغيير الحالات.')}</p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-muted border border-border">
          {partyLogs.length} {t('Events', 'أحداث')}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-14 w-full rounded-2xl" />)}
        </div>
      ) : !partyLogs.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center border-dashed shadow-2xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Clock size={24} />
          </div>
          <h3 className="font-extrabold text-sm mb-1">{t('No recent activity recorded', 'لا يوجد نشاط مسجل مؤخراً')}</h3>
          <p className="text-xs text-muted-foreground max-w-sm">{t('Profile updates, role additions, and document changes will automatically be audited here.', 'ستظهر التعديلات وتحديثات الملف وتغييرات الحالة هنا تلقائياً.')}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60 shadow-2xs">
          {partyLogs.map(log => (
            <div key={log.id} className="p-4 hover:bg-primary/5 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-foreground">{log.action}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                    <Shield size={12} className="text-emerald-600" />
                    <span>{log.actorName || t('System Auditor', 'نظام التدقيق')}</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono font-semibold shrink-0">
                {new Date(log.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
