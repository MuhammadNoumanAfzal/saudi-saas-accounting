import { AppShell } from '@/components/layout/app-shell';
import { ProfitLossReport } from '@/components/reports/profit-loss-report';

export function ProfitLossPage() {
  return (
    <AppShell>
      <ProfitLossReport />
    </AppShell>
  );
}
