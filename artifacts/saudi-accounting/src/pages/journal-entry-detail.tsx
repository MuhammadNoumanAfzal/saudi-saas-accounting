import { JournalEntryDetail } from '@/components/accounting/journal-entry-detail';
import { useParams } from 'wouter';

export function JournalEntryDetailPage() {
  const params = useParams();
  const id = params.entryId || params.id || '';
  return <JournalEntryDetail entryId={id} />;
}
