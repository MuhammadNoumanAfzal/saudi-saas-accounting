import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  usePreviewCatalogImport,
  useConfirmCatalogImport,
  downloadCatalogImportTemplate,
  getListCatalogItemsQueryKey,
  getGetDashboardSummaryQueryKey
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X, DownloadCloud } from 'lucide-react';

export function CatalogImportSheet({ 
  open, 
  onOpenChange, 
  orgId
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  orgId: string;
}) {
  const { t, isRtl } = useTranslation();

  const previewImport = usePreviewCatalogImport();
  const confirmImport = useConfirmCatalogImport();

  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const reset = () => {
    setFile(null);
    setCsvContent('');
    setStep('upload');
    setPreviewData(null);
    setImportResult(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadCatalogImportTemplate(orgId);
      const url = URL.createObjectURL(new Blob([blob as any]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalog_import_template.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to download template', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(f);
  };

  const handlePreview = () => {
    if (!csvContent) return;
    previewImport.mutate({
      organizationId: orgId,
      data: { csv: csvContent }
    }, {
      onSuccess: (data) => {
        setPreviewData(data);
        setStep('preview');
      }
    });
  };

  const handleConfirm = () => {
    confirmImport.mutate({
      organizationId: orgId,
      data: { rows: previewData.rows }
    }, {
      onSuccess: (data) => {
        setImportResult(data);
        setStep('result');
        queryClient.invalidateQueries({ queryKey: getListCatalogItemsQueryKey(orgId) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(orgId) });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 border-b border-border bg-card/50">
          <SheetTitle className="text-xl font-bold">
            {t('Import Products & Services', 'استيراد المنتجات والخدمات')}
          </SheetTitle>
          <SheetDescription>
            {t('Add multiple items at once using a CSV file.', 'إضافة عدة أصناف دفعة واحدة باستخدام ملف CSV.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="soft-card p-5 bg-muted/20">
                <h3 className="font-bold mb-2">{t('1. Download Template', '1. تحميل القالب')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('Use our template to ensure your data is formatted correctly.', 'استخدم قالبنا لضمان تنسيق بياناتك بشكل صحيح.')}</p>
                <Button variant="secondary" onClick={handleDownloadTemplate}>
                  <DownloadCloud size={16} /> {t('Download CSV Template', 'تحميل قالب CSV')}
                </Button>
              </div>

              <div className="soft-card p-5">
                <h3 className="font-bold mb-2">{t('2. Upload Data', '2. رفع البيانات')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('Select your completed CSV file.', 'اختر ملف CSV المكتمل.')}</p>
                
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <UploadCloud size={32} className="text-muted-foreground/50 mb-4" />
                  {file ? (
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <FileText size={16} className="text-primary" />
                      {file.name}
                      <button onClick={() => { setFile(null); setCsvContent(''); }} className="ml-2 text-destructive hover:underline p-1"><X size={14}/></button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-semibold mb-1">{t('Click to upload or drag and drop', 'انقر للرفع أو اسحب وأفلت')}</div>
                      <div className="text-xs text-muted-foreground mb-4">CSV (max 5MB)</div>
                      <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl">
                        {t('Select File', 'اختيار ملف')}
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-6 fade-up">
              <div className="grid grid-cols-2 gap-4">
                <div className="soft-card p-4">
                  <div className="text-sm font-medium text-muted-foreground">{t('Valid Rows', 'الصفوف الصالحة')}</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{previewData.validRows}</div>
                </div>
                <div className="soft-card p-4">
                  <div className="text-sm font-medium text-muted-foreground">{t('Errors', 'الأخطاء')}</div>
                  <div className={`text-2xl font-bold ${previewData.errors?.length ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {previewData.errors?.length || 0}
                  </div>
                </div>
              </div>

              {previewData.errors?.length > 0 && (
                <div className="soft-card overflow-hidden">
                  <div className="p-3 bg-destructive/10 text-destructive font-bold text-sm border-b border-destructive/20 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {t('Please fix these errors before importing:', 'يرجى إصلاح هذه الأخطاء قبل الاستيراد:')}
                  </div>
                  <div className="max-h-64 overflow-y-auto p-0">
                    <table className="w-full text-sm text-left rtl:text-right">
                      <thead className="bg-muted/30 text-xs">
                        <tr><th className="px-4 py-2">{t('Row', 'الصف')}</th><th className="px-4 py-2">{t('Error', 'الخطأ')}</th></tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewData.errors.map((err: any, i: number) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-mono">{err.row}</td>
                            <td className="px-4 py-2 text-destructive">{err.error || err.field}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="h-full flex flex-col items-center justify-center text-center fade-up">
              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('Import Successful', 'تم الاستيراد بنجاح')}</h2>
              <p className="text-muted-foreground mb-6">
                {t(`Successfully imported ${importResult.imported} records.`, `تم استيراد ${importResult.imported} سجلات بنجاح.`)}
              </p>
              <Button variant="primary" onClick={() => handleOpenChange(false)}>{t('Done', 'تم')}</Button>
            </div>
          )}
        </div>

        {step !== 'result' && (
          <div className="p-6 border-t border-border bg-card/50 flex gap-3 mt-auto">
            <Button variant="secondary" onClick={() => handleOpenChange(false)} className="flex-1">
              {t('Cancel', 'إلغاء')}
            </Button>
            {step === 'upload' && (
              <Button variant="primary" onClick={handlePreview} disabled={!file || previewImport.isPending} className="flex-1">
                {previewImport.isPending ? t('Processing...', 'جاري المعالجة...') : t('Preview', 'معاينة')}
              </Button>
            )}
            {step === 'preview' && (
              <Button variant="primary" onClick={handleConfirm} disabled={confirmImport.isPending || previewData?.errors?.length > 0} className="flex-1">
                {confirmImport.isPending ? t('Importing...', 'جاري الاستيراد...') : t('Confirm Import', 'تأكيد الاستيراد')}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
