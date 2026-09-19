import { InvoiceDetail } from '@/components/invoices/invoice-detail';
import { useParams } from 'wouter';

export function InvoiceDetailPage() {
  const params = useParams();
  return <InvoiceDetail id={params.invoiceId || params.id!} />;
}
