import { useRoute } from 'wouter';
import { BillDetail } from '@/components/purchases/bill-detail';

export function BillDetailPage() {
  const [, params] = useRoute('/finance/bills/:billId');
  const billId = params?.billId || '';

  return <BillDetail billId={billId} />;
}
