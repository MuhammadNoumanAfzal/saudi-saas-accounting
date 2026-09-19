import { AppShell } from '@/components/layout/app-shell';
import { AccountLedgerReport } from '@/components/reports/account-ledger-report';

export function AccountLedgerPage() {
  return (
    <AppShell>
      <AccountLedgerReport />
    </AppShell>
  );
}
