import { queryClient } from '@/lib/queryClient';
import { 
  getListInvoicesQueryKey,
  getListQuotationsQueryKey,
  getGetCustomersQueryKey,
  getGetDashboardAnalyticsQueryKey,
  customFetch
} from '@workspace/api-client-react';

export function prefetchSalesModule(orgId: string, moduleHref: string) {
  if (!orgId) return;

  if (moduleHref === '/finance' || moduleHref === '/finance/overview') {
    queryClient.prefetchQuery({
      queryKey: getGetDashboardAnalyticsQueryKey(orgId),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/dashboard/analytics`),
      staleTime: 5 * 60 * 1000,
    });
  } else if (moduleHref.includes('/finance/invoices')) {
    const params = { page: 1, pageSize: 20, search: undefined, status: undefined, invoiceType: undefined };
    queryClient.prefetchQuery({
      queryKey: getListInvoicesQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/invoices?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });
  } else if (moduleHref.includes('/finance/quotations')) {
    const params = { page: 1, pageSize: 20, search: undefined, status: undefined };
    queryClient.prefetchQuery({
      queryKey: getListQuotationsQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/quotations?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });
  } else if (moduleHref.includes('/finance/customers')) {
    const params = { page: 1, pageSize: 20, search: undefined, status: undefined };
    queryClient.prefetchQuery({
      queryKey: getGetCustomersQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/customers?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });
  }
}
