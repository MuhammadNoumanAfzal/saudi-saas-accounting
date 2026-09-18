import { useTranslation } from '@/lib/utils';
import { useListAuditLogs, getListAuditLogsQueryKey } from '@workspace/api-client-react';
import { Clock } from 'lucide-react';

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
      <h3 className="text-lg font-bold">{t('Activity History', 'سجل النشاط')}</h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="shimmer h-12 w-full rounded-xl" />)}
        </div>
      ) : !partyLogs.length ? (
        <div className="soft-card p-12 text-center border-dashed">
          <Clock size={24} className="mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-bold mb-2">{t('No recent activity', 'لا يوجد نشاط أخير')}</h3>
          <p className="text-sm text-muted-foreground">{t('Changes to this record will appear here.', 'ستظهر التغييرات على هذا السجل هنا.')}</p>
        </div>
      ) : (
        <div className="soft-card overflow-hidden divide-y divide-border">
          {partyLogs.map(log => (
            <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm">{log.action}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {log.actorName || t('System', 'النظام')}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
