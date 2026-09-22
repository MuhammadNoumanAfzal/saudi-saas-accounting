import { queryClient } from '@/lib/queryClient';
import { 
  getListAccountsQueryKey,
  getListJournalEntriesQueryKey,
  getGetTrialBalanceQueryKey,
  customFetch
} from '@workspace/api-client-react';

export function prefetchAccountingModule(orgId: string, moduleHref: string) {
  if (!orgId) return;

  if (moduleHref.includes('/accounting/accounts')) {
    queryClient.prefetchQuery({
      queryKey: getListAccountsQueryKey(orgId),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/accounts`),
      staleTime: 10 * 60 * 1000,
    });
  } else if (moduleHref.includes('/accounting/journal-entries')) {
    const params = { page: 1, pageSize: 20, search: undefined, sourceDocumentType: undefined };
    queryClient.prefetchQuery({
      queryKey: getListJournalEntriesQueryKey(orgId, params as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/journal-entries?page=1&pageSize=20`),
      staleTime: 5 * 60 * 1000,
    });
  } else if (moduleHref.includes('/accounting/trial-balance')) {
    queryClient.prefetchQuery({
      queryKey: getGetTrialBalanceQueryKey(orgId, {} as any),
      queryFn: () => customFetch(`/api/v1/organizations/${orgId}/reports/trial-balance`),
      staleTime: 5 * 60 * 1000,
    });
  }
}
