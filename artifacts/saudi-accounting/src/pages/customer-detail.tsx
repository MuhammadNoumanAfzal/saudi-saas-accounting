import { PartyProfile } from '@/components/parties/party-profile';
import { useParams } from 'wouter';

export function CustomerDetail() {
  const params = useParams();
  return <PartyProfile role="customer" id={params.id!} />;
}
