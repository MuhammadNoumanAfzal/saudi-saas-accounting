import { useTranslation, Button } from '@/lib/utils';
import { useListPartyDocuments, getListPartyDocumentsQueryKey } from '@workspace/api-client-react';
import { FileText, Plus, Download, Edit, Trash } from 'lucide-react';

export function DocumentsTab({ partyId, orgId }: { partyId: string, orgId: string }) {
  const { t } = useTranslation();
  
  const { data: documents, isLoading } = useListPartyDocuments(orgId, partyId, {
    query: { 
      enabled: !!orgId && !!partyId,
      queryKey: getListPartyDocumentsQueryKey(orgId, partyId)
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{t('Documents', 'المستندات')}</h3>
        <Button variant="secondary" onClick={() => alert('Upload document coming soon')}>
          <Plus size={16} />
          <span>{t('Upload', 'رفع')}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="shimmer h-16 w-full rounded-xl" />)}
        </div>
      ) : !documents?.length ? (
        <div className="soft-card p-12 text-center border-dashed">
          <h3 className="font-bold mb-2">{t('No documents', 'لا توجد مستندات')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('Upload commercial registration, tax certificates, etc.', 'قم برفع السجل التجاري، الشهادات الضريبية، إلخ.')}</p>
          <Button variant="secondary" onClick={() => alert('Upload document coming soon')}>
            <Plus size={16} /> {t('Upload Document', 'رفع مستند')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="soft-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">{doc.fileName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{doc.documentType} • {(doc.size || 0) / 1024} KB</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                  <Download size={16} />
                </Button>
                <Button variant="ghost" className="h-8 w-8 p-0 text-destructive">
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
