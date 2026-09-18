import { useParams } from 'wouter';
import { CatalogProfile } from '@/components/catalog/catalog-profile';

export function CatalogItemDetail() {
  const params = useParams();
  const id = params.id;
  
  if (!id) return null;
  return <CatalogProfile id={id} />;
}
