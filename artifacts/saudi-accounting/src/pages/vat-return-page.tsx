import { AppShell } from '@/components/layout/app-shell';
import { ZatcaVatReturnReport } from '@/components/reports/zatca-vat-return-report';

export function VatReturnPage() {
  return (
    <AppShell>
      <ZatcaVatReturnReport />
    </AppShell>
  );
}
