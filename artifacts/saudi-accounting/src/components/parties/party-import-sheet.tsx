import { useState } from 'react';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  usePreviewPartyImport,
  useConfirmPartyImport,
  getGetCustomersQueryKey,
  getGetSuppliersQueryKey
} from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X, DownloadCloud, FileSpreadsheet, RefreshCw } from 'lucide-react';

export function PartyImportSheet({ 
  open, 
  onOpenChange, 
  role, 
  orgId
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  role: 'customer' | 'supplier';
  orgId: string;
}) {
  const { t, isRtl } = useTranslation();
  const isCustomer = role === 'customer';

  const previewImport = usePreviewPartyImport();
  const confirmImport = useConfirmPartyImport();

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

  const handleDownloadTemplate = () => {
    const csvTemplate = 
`partyType,businessNameEnglish,businessNameArabic,firstName,lastName,commercialRegistrationNumber,vatRegistered,vatNumber,city,primaryEmail,primaryPhone
organization,Al Rajhi Trading Co.,شركة الراجحي للتجارة,,,1010123456,true,300123456700003,Riyadh,info@alrajhi-trading.sa,+966114567890
organization,Saudi Technical Solutions,الحلول التقنية السعودية,,,1010987654,true,310987654300003,Jeddah,contact@sauditech.sa,+966126543210
individual,,,Ahmed,Al-Otaibi,,false,,Dammam,ahmed@example.com,+966501234567
`;
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${role}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      role: role as any,
      data: { csv: csvContent }
    }, {
      onSuccess: (data) => {
        setPreviewData(data);
        setStep('preview');
      },
      onError: (err: any) => {
        showAlert.error(t('Preview Failed', 'فشل المعاينة'), err?.message || t('Could not parse CSV file', 'تعذر تحليل ملف CSV'));
      }
    });
  };

  const handleConfirm = () => {
    if (!previewData?.rows) return;
    confirmImport.mutate({
      organizationId: orgId,
      role: role as any,
      data: { rows: previewData.rows }
    }, {
      onSuccess: (data) => {
        setImportResult(data);
        setStep('result');
        queryClient.invalidateQueries({ queryKey: getGetCustomersQueryKey(orgId) });
        queryClient.invalidateQueries({ queryKey: getGetSuppliersQueryKey(orgId) });
        showAlert.success(
          isCustomer ? t('Customers Imported!', 'تم استيراد العملاء!') : t('Suppliers Imported!', 'تم استيراد الموردين!'),
          t(`Successfully imported ${data.imported || previewData.rows.length} records into your database.`, `تم استيراد ${data.imported || previewData.rows.length} سجلات بنجاح إلى قاعدة البيانات.`)
        );
      },
      onError: (err: any) => {
        showAlert.error(t('Import Failed', 'فشل الاستيراد'), err?.message || t('Something went wrong during import', 'حدث خطأ ما أثناء الاستيراد'));
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col bg-background">
        <SheetHeader className="p-6 border-b border-border bg-card/50">
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={22} />
            {isCustomer ? t('Import Customers', 'استيراد العملاء') : t('Import Suppliers', 'استيراد الموردين')}
          </SheetTitle>
          <SheetDescription>
            {t('Add multiple customer or supplier profiles at once using a CSV file.', 'إضافة عدة ملفات عملاء أو موردين دفعة واحدة باستخدام ملف CSV.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="soft-card p-5 bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <DownloadCloud size={20} className="text-primary mt-1 shrink-0" />
                  <div>
                    <h3 className="font-bold text-foreground text-base mb-1">{t('1. Download CSV Template', '1. تحميل قالب CSV')}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('Download our pre-formatted CSV template featuring pre-filled ZATCA VAT numbers and Saudi city columns.', 'تحميل قالب CSV المنسق مسبقاً ويتضمن أرقام ضريبية متوافقة مع هيئة الزكاة والضريبة والجمارك ومدن سعودية.')}
                    </p>
                    <Button variant="secondary" onClick={handleDownloadTemplate} className="gap-2 bg-background border-border shadow-sm">
                      <DownloadCloud size={16} />
                      {t('Download Sample CSV', 'تحميل نموذج CSV')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="soft-card p-5">
                <h3 className="font-bold text-foreground text-base mb-2">{t('2. Select & Upload File', '2. اختيار ورفع الملف')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('Choose your completed CSV file to preview records before saving.', 'اختر ملف CSV المكتمل لمعاينة السجلات قبل الحفظ.')}</p>
                
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-card/40 hover:bg-card/70 transition-colors">
                  <UploadCloud size={40} className="text-primary/60 mb-3" />
                  {file ? (
                    <div className="flex items-center gap-3 bg-muted p-3 rounded-xl border border-border">
                      <FileText size={20} className="text-primary" />
                      <div className="text-left rtl:text-right">
                        <div className="text-sm font-bold text-foreground">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button onClick={() => { setFile(null); setCsvContent(''); }} className="ml-3 text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors">
                        <X size={16}/>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-semibold mb-1 text-foreground">{t('Click to upload or drag and drop', 'انقر للرفع أو اسحب وأفلت')}</div>
                      <div className="text-xs text-muted-foreground mb-4">Supported format: .csv</div>
                      <label className="btn-primary cursor-pointer inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
                        <UploadCloud size={16} />
                        {t('Select CSV File', 'اختيار ملف CSV')}
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
                <div className="soft-card p-4 bg-emerald-500/10 border-emerald-500/20">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">{t('Valid Rows', 'الصفوف الصالحة')}</div>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{previewData.validRows || previewData.rows?.length || 0}</div>
                </div>
                <div className="soft-card p-4 bg-destructive/10 border-destructive/20">
                  <div className="text-xs font-semibold text-destructive uppercase">{t('Validation Errors', 'أخطاء التحقق')}</div>
                  <div className={`text-3xl font-bold mt-1 ${previewData.errors?.length ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {previewData.errors?.length || 0}
                  </div>
                </div>
              </div>

              {previewData.errors?.length > 0 ? (
                <div className="soft-card overflow-hidden border-destructive/30">
                  <div className="p-3 bg-destructive/10 text-destructive font-bold text-sm border-b border-destructive/20 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {t('Fix validation errors before confirming:', 'يرجى إصلاح أخطاء التحقق قبل التأكيد:')}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-muted text-muted-foreground uppercase font-mono">
                        <tr>
                          <th className="px-3 py-2">{t('Row', 'الصف')}</th>
                          <th className="px-3 py-2">{t('Field', 'الحقل')}</th>
                          <th className="px-3 py-2">{t('Error Message', 'رسالة الخطأ')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewData.errors.map((err: any, i: number) => (
                          <tr key={i} className="hover:bg-destructive/5">
                            <td className="px-3 py-2 font-mono font-bold">{err.row}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">{err.field}</td>
                            <td className="px-3 py-2 text-destructive font-medium">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {previewData.rows?.length > 0 && (
                <div className="soft-card overflow-hidden">
                  <div className="p-3 bg-muted/40 font-bold text-sm border-b border-border flex items-center justify-between">
                    <span>{t('Data Preview', 'معاينة البيانات')} ({previewData.rows.length} {t('rows', 'صفوف')})</span>
                    <button onClick={() => setStep('upload')} className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                      <RefreshCw size={12} /> {t('Re-upload', 'إعادة الرفع')}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-x-auto overflow-y-auto">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-muted/60 text-muted-foreground uppercase">
                        <tr>
                          <th className="px-3 py-2 font-medium">{t('Type', 'النوع')}</th>
                          <th className="px-3 py-2 font-medium">{t('Name', 'الاسم')}</th>
                          <th className="px-3 py-2 font-medium">{t('VAT Number', 'الرقم الضريبي')}</th>
                          <th className="px-3 py-2 font-medium">{t('CR Number', 'السجل التجاري')}</th>
                          <th className="px-3 py-2 font-medium">{t('City', 'المدينة')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewData.rows.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="px-3 py-2 capitalize font-mono text-muted-foreground">{row.partyType || 'organization'}</td>
                            <td className="px-3 py-2 font-semibold">{row.businessNameEnglish || row.displayName || [row.firstName, row.lastName].filter(Boolean).join(' ')}</td>
                            <td className="px-3 py-2 font-mono">{row.vatNumber || '-'}</td>
                            <td className="px-3 py-2 font-mono">{row.commercialRegistrationNumber || '-'}</td>
                            <td className="px-3 py-2 font-medium">{row.city || '-'}</td>
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
            <div className="py-12 flex flex-col items-center justify-center text-center fade-up">
              <div className="h-20 w-20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-500/5">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">{t('Import Successful!', 'تم الاستيراد بنجاح!')}</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                {t(`Successfully imported ${importResult.imported || previewData?.rows?.length || 0} records into your customer/supplier master list.`, `تم استيراد ${importResult.imported || previewData?.rows?.length || 0} سجل بنجاح إلى قائمة العملاء والموردين.`)}
              </p>
              <Button variant="primary" onClick={() => handleOpenChange(false)} className="px-8 py-2.5">
                {t('Done', 'تم')}
              </Button>
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
                {previewImport.isPending ? t('Parsing CSV...', 'جاري تحليل CSV...') : t('Preview Data', 'معاينة البيانات')}
              </Button>
            )}
            {step === 'preview' && (
              <Button variant="primary" onClick={handleConfirm} disabled={confirmImport.isPending || previewData?.errors?.length > 0} className="flex-1">
                {confirmImport.isPending ? t('Importing...', 'جاري الاستيراد...') : t('Confirm & Save Records', 'تأكيد وحفظ السجلات')}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
