import { PartyProfile } from '@/components/parties/party-profile';
import { useParams } from 'wouter';

export function SupplierDetail() {
  const params = useParams();
  return <PartyProfile role="supplier" id={params.id!} />;
}
