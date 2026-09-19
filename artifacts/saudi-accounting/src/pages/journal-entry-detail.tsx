import { useRoute } from 'wouter';
import { JournalEntryDetail } from '@/components/accounting/journal-entry-detail';

export function JournalEntryDetailPage() {
  const [, params] = useRoute('/accounting/journal-entries/:entryId');
  const entryId = params?.entryId || '';

  return <JournalEntryDetail entryId={entryId} />;
}
