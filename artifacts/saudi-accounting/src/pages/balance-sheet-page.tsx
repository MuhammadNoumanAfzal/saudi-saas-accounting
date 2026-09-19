import { AppShell } from '@/components/layout/app-shell';
import { BalanceSheetReport } from '@/components/reports/balance-sheet-report';

export function BalanceSheetPage() {
  return (
    <AppShell>
      <BalanceSheetReport />
    </AppShell>
  );
}
