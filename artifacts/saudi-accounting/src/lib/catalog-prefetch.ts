import { queryClient } from '@/lib/queryClient';
import { 
  getListCatalogItemsQueryKey,
  getListCatalogUnitsQueryKey,
  customFetch
} from '@workspace/api-client-react';

export function prefetchCatalogModule(orgId: string, moduleHref: string) {
  if (!orgId) return;

  if (moduleHref.includes('/finance/items')) {
    const params = { page: 1, pageSize: 20, search: undefined, type: undefined, status: undefined };
    queryClient.prefetchQuery({
      queryKey: getListCatalogItemsQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/catalog/items?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: getListCatalogUnitsQueryKey(orgId),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/catalog/units`),
      staleTime: 10 * 60 * 1000,
    });
  }
}
