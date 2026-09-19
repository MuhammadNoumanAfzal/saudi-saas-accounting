import { QuotationDetail } from '@/components/quotations/quotation-detail';
import { useParams } from 'wouter';

export function QuotationDetailPage() {
  const params = useParams();
  return <QuotationDetail id={params.quotationId || params.id!} />;
}
