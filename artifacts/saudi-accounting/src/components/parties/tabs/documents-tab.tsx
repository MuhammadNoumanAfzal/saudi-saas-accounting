import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { useListPartyDocuments, getListPartyDocumentsQueryKey } from '@workspace/api-client-react';
import { FileText, Plus, Download, Trash2, FolderOpen, FileCheck } from 'lucide-react';

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
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            <span>{t('Commercial & Legal Documents', 'المستندات التجارية والقانونية')}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('CR copies, ZATCA tax certificates, contracts, and attachments.', 'نسخ السجلات التجارية، الشهادات الضريبية والعقود.')}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Document upload is coming soon', 'رفع المستندات سيكون متاحاً قريباً'))}
          className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer border border-border hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Plus size={15} />
          <span>{t('Upload Document', 'رفع مستند')}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="shimmer h-16 w-full rounded-2xl" />)}
        </div>
      ) : !documents?.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center border-dashed shadow-2xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <FileText size={24} />
          </div>
          <h3 className="font-extrabold text-sm mb-1">{t('No documents uploaded yet', 'لا توجد مستندات مرفوعة بعد')}</h3>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm">{t('Keep your customer record verified by uploading ZATCA certificates or CR files.', 'حافظ على توثيق بيانات العميل برفع السجل التجاري والشهادات الضريبية.')}</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => showAlert.warning(t('Coming Soon', 'قريباً'), t('Document upload is coming soon', 'رفع المستندات سيكون متاحاً قريباً'))}
            className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Plus size={15} /> {t('Upload First Document', 'رفع أول مستند')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="bg-card border border-border/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <FileCheck size={20} />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-foreground">{doc.fileName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-primary">{doc.documentType}</span>
                    <span>•</span>
                    <span className="font-mono">{((doc.size || 0) / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <Download size={15} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
