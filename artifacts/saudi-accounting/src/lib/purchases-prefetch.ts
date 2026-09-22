import { queryClient } from '@/lib/queryClient';
import { 
  getListPurchaseBillsQueryKey,
  getListExpensesQueryKey,
  getGetSuppliersQueryKey,
  customFetch
} from '@workspace/api-client-react';

export function prefetchPurchasesModule(orgId: string, moduleHref: string) {
  if (!orgId) return;

  if (moduleHref.includes('/finance/bills')) {
    const params = { page: 1, pageSize: 20, search: undefined, status: undefined };
    queryClient.prefetchQuery({
      queryKey: getListPurchaseBillsQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/purchase-bills?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });
  } else if (moduleHref.includes('/finance/expenses')) {
    const params = { page: 1, pageSize: 20, search: undefined, category: undefined };
    queryClient.prefetchQuery({
      queryKey: getListExpensesQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/expenses?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });
  } else if (moduleHref.includes('/finance/suppliers')) {
    const params = { page: 1, pageSize: 20, search: undefined, status: undefined };
    queryClient.prefetchQuery({
      queryKey: getGetSuppliersQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/suppliers?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });
  }
}
