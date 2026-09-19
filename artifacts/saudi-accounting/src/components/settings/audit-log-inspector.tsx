import { useState } from 'react';
import { useGetCurrentSession, useListAuditLogs } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/utils';
import {
  FileClock, Search, Filter, Eye, ShieldCheck, User, Globe, Activity,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export function AuditLogInspector() {
  const { t, isRtl } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: auditLogs, isLoading } = useListAuditLogs(orgId, {
    query: { enabled: !!orgId }
  });

  const logs = auditLogs || [];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase()) ||
      (log.actorName && log.actorName.toLowerCase().includes(search.toLowerCase()));
    const matchesEntity = !entityFilter || log.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('created')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (action.includes('posted') || action.includes('updated')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (action.includes('deleted') || action.includes('voided') || action.includes('cancelled')) return 'bg-red-500/10 text-red-600 border-red-500/20';
    return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Audit Log & Activity Governance', 'سجل النشاط وحوكمة النظام')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('Complete tamper-evident audit history of all user actions, transactions, and system configuration changes.', 'سجل تدقيق كامل لكافة عمليات المستخدمين والمعاملات المالية وتغييرات النظام.')}
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-muted/30">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder={t('Search by action, user, or entity...', 'البحث بحسب الإجراء أو المستخدم أو الوحدة...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rtl:pl-3 rtl:pr-9 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t('All Entity Types', 'جميع الوحدات')}</option>
              <option value="invoices">{t('Invoices', 'الفواتير')}</option>
              <option value="purchase-bills">{t('Purchase Bills', 'فواتير المشتريات')}</option>
              <option value="expenses">{t('Expenses', 'المصروفات')}</option>
              <option value="accounting">{t('Journal Entries', 'القيود اليومية')}</option>
              <option value="reports">{t('Reports', 'التقارير')}</option>
              <option value="dashboard">{t('Dashboard', 'لوحة التحكم')}</option>
              <option value="parties">{t('Parties', 'العملاء والموردون')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">{t('Loading audit logs...', 'جاري تحميل سجل النشاط...')}</Card>
      ) : (
        <Card className="border overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileClock className="w-5 h-5 text-primary" />
                <span>{t('Activity Audit Log History', 'سجل العمليات الإدارية والمالية')}</span>
              </CardTitle>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                {filteredLogs.length} {t('events', 'أحداث')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/40 text-xs text-muted-foreground uppercase border-b">
                <tr>
                  <th className="p-3 text-start">{t('Timestamp', 'التاريخ والوقت')}</th>
                  <th className="p-3 text-start">{t('Actor / User', 'المستخدم')}</th>
                  <th className="p-3 text-start">{t('Action Event', 'نوع الإجراء')}</th>
                  <th className="p-3 text-start">{t('Entity', 'الوحدة المحدثة')}</th>
                  <th className="p-3 text-start">{t('IP Address', 'عنوان IP')}</th>
                  <th className="p-3 text-end">{t('Payload Diff', 'التفاصيل')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {t('No audit log entries matching criteria.', 'لا توجد سجلات مطابقة للبحث.')}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Riyadh'
                        })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-xs truncate max-w-[120px]">
                            {log.actorName || t('Admin User', 'مدير النظام')}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs uppercase text-muted-foreground">
                        {log.entityType}
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="p-3 text-end">
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2 text-xs font-medium gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('Inspect Payload', 'عرض التفاصيل')}</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Payload Inspection Drawer */}
      <Sheet open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-xl md:max-w-2xl max-w-full overflow-y-auto p-6">
          <SheetHeader className="pb-4 border-b border-border pe-8">
            <SheetTitle className="flex items-center gap-2 font-mono text-base text-foreground">
              <Activity className="w-5 h-5 text-primary shrink-0" />
              <span className="break-all">{selectedLog?.action}</span>
            </SheetTitle>
            <SheetDescription className="text-xs font-mono break-all mt-1">
              Event ID: {selectedLog?.id}
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-6 pt-6 text-sm min-w-0 max-w-full overflow-hidden">
              {/* Event Metadata Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs">
                <div>
                  <span className="text-muted-foreground block">{t('Timestamp:', 'التاريخ والوقت:')}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {new Date(selectedLog.createdAt).toLocaleString(isRtl ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{t('IP Address:', 'عنوان IP:')}</span>
                  <span className="font-mono font-semibold text-foreground">{selectedLog.ipAddress || 'Internal'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{t('Entity Type:', 'الوحدة:')}</span>
                  <span className="font-mono font-semibold uppercase text-primary">{selectedLog.entityType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">{t('Entity ID:', 'معرف المعاملة:')}</span>
                  <span className="font-mono font-semibold truncate block break-all text-foreground">{selectedLog.entityId || 'N/A'}</span>
                </div>
              </div>

              {/* Payload Diff Section */}
              <div className="space-y-4 min-w-0 max-w-full">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  {t('Payload & Audit Metadata (JSON Diff)', 'تفاصيل البيانات المحفوظة')}
                </h4>

                {selectedLog.newValues && (
                  <div className="space-y-1.5 min-w-0 max-w-full">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {t('New Values / Operation Payload:', 'القيم المسجلة الجديدة:')}
                    </div>
                    <pre className="p-4 rounded-xl bg-muted font-mono text-xs overflow-x-auto border border-border text-foreground whitespace-pre-wrap break-all max-w-full min-w-0">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.previousValues && (
                  <div className="space-y-1.5 min-w-0 max-w-full">
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {t('Previous State Values:', 'القيم السابقة (قبل التعديل):')}
                    </div>
                    <pre className="p-4 rounded-xl bg-muted font-mono text-xs overflow-x-auto border border-border text-foreground whitespace-pre-wrap break-all max-w-full min-w-0">
                      {JSON.stringify(selectedLog.previousValues, null, 2)}
                    </pre>
                  </div>
                )}

                {!selectedLog.newValues && !selectedLog.previousValues && (
                  <div className="p-6 text-center text-muted-foreground text-xs bg-muted/20 rounded-xl border border-border">
                    {t('No state mutations recorded for this event.', 'لم تُسجل تغييرات في القيم لهذا الحدث.')}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
