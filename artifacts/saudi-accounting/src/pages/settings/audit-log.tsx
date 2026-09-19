import { AppShell } from '@/components/layout/app-shell';
import { AuditLogInspector } from '@/components/settings/audit-log-inspector';

export function AuditLogSettings() {
  return (
    <AppShell>
      <AuditLogInspector />
    </AppShell>
  );
}
