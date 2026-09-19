import { AppShell } from '@/components/layout/app-shell';
import { ExecutiveDashboard } from '@/components/dashboard/executive-dashboard';

export function FinanceOverview() {
  return (
    <AppShell>
      <ExecutiveDashboard />
    </AppShell>
  );
}
