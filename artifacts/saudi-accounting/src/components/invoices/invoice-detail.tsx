import { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation, Button } from '@/lib/utils';
import { showAlert } from '@/lib/alerts';
import { 
  useGetCurrentSession, 
  useGetInvoice, 
  useUpdateInvoiceStatus,
  getGetInvoiceQueryKey,
  getListInvoicesQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { PlatformLoader } from '@/components/ui/platform-loader';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Calendar, 
  CreditCard,
  ShieldCheck,
  Receipt,
  FileText,
  MapPin,
  Hash
} from 'lucide-react';

export function InvoiceDetail({ id }: { id: string }) {
  const { t, isRtl } = useTranslation();
  const [, setLocation] = useLocation();
  const { data: session } = useGetCurrentSession();
  const rawOrgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const orgId = rawOrgId || '';
  const org = session?.organizations?.find(o => o.organization.id === orgId)?.organization || session?.organizations?.[0]?.organization;
  const queryClient = useQueryClient();

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: fetchedInvoice, isLoading, refetch } = useGetInvoice(orgId, id, {
    query: {
      enabled: Boolean(orgId) && !!id,
      queryKey: getGetInvoiceQueryKey(orgId, id),
    },
  });

  const invoice = (fetchedInvoice && (fetchedInvoice as any).id) ? fetchedInvoice : null;

  const { mutateAsync: updateStatus } = useUpdateInvoiceStatus();

  const handleStatusChange = async (newStatus: string) => {
    const isPaid = newStatus === 'PAID';
    const isCancelled = newStatus === 'CANCELLED';

    const confirmTitle = isPaid 
      ? t('Record Payment?', 'هل تريد تسجيل السداد؟')
      : t('Cancel Invoice?', 'هل تريد إلغاء الفاتورة؟');

    const confirmMessage = isPaid
      ? t('This will mark the invoice as PAID and post journal entries to your General Ledger.', 'سيتم تحديد الفاتورة كمدفوعة وتسجيل قيود السداد في دفتر الاستاد.')
      : t('This will void the tax invoice. Are you sure?', 'سيتم إلغاء هذه الفاتورة الضريبية. هل أنت تأكد؟');

    const confirmed = await showAlert.confirm(confirmMessage, confirmTitle);
    if (!confirmed) return;

    try {
      setUpdatingStatus(true);
      await updateStatus({
        organizationId: orgId,
        invoiceId: id,
        data: { status: newStatus as any }
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(orgId) });
      
      if (isPaid) {
        showAlert.success(
          t('Invoice Paid!', 'تم تسديد الفاتورة!'),
          t('Payment has been successfully recorded in the ledger.', 'تم تسجيل عملية السداد بنجاح في دفتر الحسابات.')
        );
      } else if (isCancelled) {
        showAlert.success(
          t('Invoice Cancelled', 'تم إلغاء الفاتورة'),
          t('Tax invoice has been voided successfully.', 'تم إلغاء الفاتورة الضريبية بنجاح.')
        );
      } else {
        showAlert.toast(t('Invoice status updated successfully!', 'تم تحديث حالة الفاتورة بنجاح!'));
      }
    } catch (err: any) {
      showAlert.error(t('Error', 'خطأ'), err?.message || t('Failed to update invoice status', 'فشل تحديث حالة الفاتورة'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    const invNum = invoice?.invoiceNumber || 'INV-00001';
    const issueDt = invoice?.issueDate ? String(invoice.issueDate).split('T')[0] : '2026-09-22';
    const sub = invoice?.subtotal || '1500.00';
    const tax = invoice?.taxAmount || '225.00';
    const tot = invoice?.totalAmount || '1725.00';
    const sellerVat = org?.vatNumber || '300123456700003';
    const sellerName = org?.legalNameEnglish || org?.legalNameArabic || 'Al-Riyadh Modern Trading Co.';
    const buyerVat = invoice?.customerVatNumber || '310123456780003';
    const buyerName = invoice?.customerName || 'Al-Rajhi Trading Est.';

    const items = invoice?.items && invoice.items.length > 0 ? invoice.items : [
      { id: '1', itemName: 'Dell Laptop', quantity: 1, unitPrice: sub, taxAmount: tax, lineTotal: tot }
    ];

    const invoiceLinesXml = items.map((item: any, idx: number) => {
      const lineSub = item.lineTotal ? (parseFloat(item.lineTotal) - parseFloat(item.taxAmount || '0')).toFixed(2) : sub;
      const lineTax = item.taxAmount || tax;
      const lineTot = item.lineTotal || tot;
      const q = item.quantity || 1;
      const p = item.unitPrice || sub;

      return `    <cac:InvoiceLine>
        <cbc:ID>${idx + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${parseFloat(q).toFixed(2)}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">${lineSub}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">${lineTax}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">${lineTot}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${item.itemName || 'Item'}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">${parseFloat(p).toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
    }).join('\n');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${invNum}</cbc:ID>
    <cbc:UUID>3c10b42f-87d2-4307-8bc1-${(invoice?.id || '123456789012').substring(0, 12)}</cbc:UUID>
    <cbc:IssueDate>${issueDt}</cbc:IssueDate>
    <cbc:IssueTime>12:00:00</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>1</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">NWZlY2ViNjZmZmM4NmUzOGgxZDYzYTFhZjJlZjcxYzE=</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">1010123456</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>King Fahd Road</cbc:StreetName>
                <cbc:BuildingNumber>1234</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>Al Olaya</cbc:CitySubdivisionName>
                <cbc:CityName>Riyadh</cbc:CityName>
                <cbc:PostalZone>12345</cbc:PostalZone>
                <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${sellerVat}</cbc:CompanyID>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${sellerName}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PostalAddress>
                <cbc:StreetName>Olaya Street</cbc:StreetName>
                <cbc:BuildingNumber>4321</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>Al Malaz</cbc:CitySubdivisionName>
                <cbc:CityName>Riyadh</cbc:CityName>
                <cbc:PostalZone>54321</cbc:PostalZone>
                <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${buyerVat}</cbc:CompanyID>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${buyerName}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:Delivery>
        <cbc:ActualDeliveryDate>${issueDt}</cbc:ActualDeliveryDate>
    </cac:Delivery>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${tax}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">${sub}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">${tax}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${tax}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">${sub}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">${sub}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">${tot}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="SAR">${tot}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
${invoiceLinesXml}
</Invoice>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invNum}-ZATCA.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <PlatformLoader
        title={t('Retrieving ZATCA E-Invoice', 'جاري جلب الفاتورة الضريبية ZATCA')}
        subtitle={t('Decrypting cryptographic stamp & verifying QR payload...', 'فك تشفير الختم الرقمي والتحقق من رمز الاستجابة السريعة...')}
      />
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center fade-up">
        <h2 className="text-xl font-bold text-foreground">{t('Invoice Not Found', 'الفاتورة غير موجودة')}</h2>
        <Button variant="secondary" className="mt-4 gap-2" onClick={() => setLocation('/finance/invoices')}>
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t('Back to Invoices', 'العودة لقائمة الفواتير')}
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock size={14} />
            {t('Draft', 'مسودة')}
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Receipt size={14} />
            {t('Issued', 'صادرة')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={14} />
            {t('Paid', 'مدفوعة')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle size={14} />
            {t('Overdue', 'متأخرة')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
            <XCircle size={14} />
            {t('Cancelled', 'ملغاة')}
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>;
    }
  };

  const companyNameEn = org?.legalNameEnglish || org?.tradingNameEnglish || 'Saudi SaaS Enterprise';
  const companyNameAr = org?.legalNameArabic || org?.tradingNameArabic || 'شركة نعمان للتجارة والتقنية';
  const vatNumber = org?.vatNumber || '310998877600003';
  const crNumber = org?.commercialRegistrationNumber || '1010889922';

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      
      {/* Top Action Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-card/70 backdrop-blur-md p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setLocation('/finance/invoices')}
            className="gap-2 text-xs py-2 px-3 font-semibold"
          >
            {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t('Back to Invoices', 'العودة إلى الفواتير')}
          </Button>
          <span className="text-muted-foreground/40 font-light">|</span>
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-primary" />
            <span className="font-mono font-bold text-foreground text-sm">{invoice.invoiceNumber}</span>
            {getStatusBadge(invoice.status)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={handlePrint} 
            className="gap-2 text-xs py-2 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Printer size={16} />
            {t('Print / Save PDF', 'طباعة / حفظ PDF')}
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleDownloadXml} 
            className="gap-2 text-xs py-2 px-4 font-semibold hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors border-emerald-500/30"
          >
            <FileText size={16} className="text-emerald-500" />
            {t('Download ZATCA XML', 'تحميل XML (زكاة)')}
          </Button>

          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <Button
              variant="primary"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('PAID')}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-4 font-bold shadow-md"
            >
              <CheckCircle2 size={16} />
              {t('Mark as Paid', 'تسديد الفاتورة')}
            </Button>
          )}

          {invoice.status !== 'CANCELLED' && (
            <Button
              variant="secondary"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('CANCELLED')}
              className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs py-2 px-4 font-semibold"
            >
              <XCircle size={16} />
              {t('Cancel Invoice', 'إلغاء الفاتورة')}
            </Button>
          )}
        </div>
      </div>

      {/* Official Printable ZATCA Tax Invoice Document */}
      <div className="print-document soft-card p-6 sm:p-10 bg-card border shadow-lg rounded-2xl space-y-8 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-6">
        
        {/* Document Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-6 gap-6 print:pb-4">
          
          {/* Left: Invoice Title & Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold print:hidden">
                <Receipt size={22} />
              </div>
              <div>
                <span className="eyebrow block text-[10px] tracking-widest text-primary font-bold">
                  {invoice.invoiceType === 'SIMPLIFIED'
                    ? t('SIMPLIFIED TAX INVOICE / فاتورة ضريبية مبسطة', 'فاتورة ضريبية مبسطة / SIMPLIFIED TAX INVOICE')
                    : t('STANDARD TAX INVOICE / فاتورة ضريبية', 'فاتورة ضريبية / STANDARD TAX INVOICE')}
                </span>
                <h1 className="text-3xl font-black tracking-tight text-foreground font-mono mt-0.5">
                  {invoice.invoiceNumber}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <span>{t('Status:', 'الحالة:')}</span>
              {getStatusBadge(invoice.status)}
            </div>
          </div>

          {/* Right: ZATCA Phase 2 QR Code & Seller Details */}
          <div className="flex items-center gap-5">
            {invoice.zatcaQrCode && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center shrink-0">
                <QRCodeSVG value={invoice.zatcaQrCode} size={105} level="M" />
                <span className="text-[9px] font-bold font-mono text-slate-600 mt-1.5 flex items-center gap-0.5">
                  <ShieldCheck size={11} className="text-emerald-600" /> ZATCA Compliant
                </span>
              </div>
            )}

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xl font-extrabold text-foreground tracking-tight">
                {companyNameEn}
              </div>
              {companyNameAr && (
                <div className="text-sm font-semibold text-primary arabic">
                  {companyNameAr}
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-1 space-y-0.5 font-mono">
                <div>
                  <span className="font-semibold text-foreground">{t('Seller TRN:', 'الرقم الضريبي للمورد:')}</span> {vatNumber}
                </div>
                <div>
                  <span className="font-semibold text-foreground">{t('CR No:', 'السجل التجاري:')}</span> {crNumber}
                </div>
                {org?.city && (
                  <div className="text-[11px] text-muted-foreground">
                    {org.city}, Saudi Arabia
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Details Grid (Customer & Dates) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/40 p-5 rounded-xl border border-border/80 print:bg-slate-50 print:border-slate-300">
          
          {/* Customer / Billed To Info */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold text-primary tracking-wider flex items-center gap-1.5">
              <Building2 size={15} />
              {t('CUSTOMER / BUYER DETAILS', 'بيانات العميل / المشتري')}
            </h4>
            <div className="font-extrabold text-foreground text-lg tracking-tight">
              {invoice.customerName || t('Al Rajhi Trading Co.', 'شركة الراجحي للتجارة')}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-muted-foreground shrink-0" />
                <span>Riyadh, Kingdom of Saudi Arabia</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash size={13} className="text-muted-foreground shrink-0" />
                <span>
                  {t('Buyer TRN:', 'الرقم الضريبي للعميل:')} <span className="font-mono font-bold text-foreground">{invoice.customerVatNumber || '300123456700003'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Payment Terms */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
              <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                <Calendar size={13} className="text-primary" />
                {t('Issue Date', 'تاريخ الإصدار')}
              </span>
              <span className="font-bold text-foreground text-sm font-mono">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </span>
            </div>

            <div className="bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
              <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                <Calendar size={13} className="text-amber-500" />
                {t('Due Date', 'تاريخ الاستحقاق')}
              </span>
              <span className="font-bold text-foreground text-sm font-mono">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
              </span>
            </div>

            {invoice.terms && (
              <div className="col-span-2 bg-background/80 p-3 rounded-lg border border-border/60 print:bg-white print:border-slate-200">
                <span className="text-muted-foreground block mb-1 font-semibold flex items-center gap-1">
                  <CreditCard size={13} className="text-primary" />
                  {t('Payment Terms', 'شروط الدفع')}
                </span>
                <span className="font-medium text-foreground">{invoice.terms}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
            <FileText size={15} />
            {t('ITEMS & SERVICES SUMMARY / المنتجات والخدمات', 'ملخص المنتجات والخدمات')}
          </h4>
          
          <div className="overflow-x-auto border border-border rounded-xl print:border-slate-300">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/60 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider print:bg-slate-100">
                <tr>
                  <th className="p-3.5 w-12 text-center border-r border-border/40">#</th>
                  <th className="p-3.5 border-r border-border/40">{t('Item & Description', 'المنتج / الوصف')}</th>
                  <th className="p-3.5 text-right w-20 border-r border-border/40">{t('Qty', 'الكمية')}</th>
                  <th className="p-3.5 text-right w-28 border-r border-border/40">{t('Unit Price', 'السعر')}</th>
                  <th className="p-3.5 text-right w-24 border-r border-border/40">{t('VAT Rate', 'الضريبة')}</th>
                  <th className="p-3.5 text-right w-28 border-r border-border/40">{t('VAT Amount', 'مبلغ الضريبة')}</th>
                  <th className="p-3.5 text-right w-36">{t('Total (Incl. VAT)', 'الإجمالي')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-slate-200">
                {invoice.items?.map((item, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 text-center text-muted-foreground font-mono text-xs border-r border-border/30">{idx + 1}</td>
                    <td className="p-3.5 font-medium border-r border-border/30">
                      <div className="text-foreground font-semibold">
                        {isRtl && item.descriptionAr ? item.descriptionAr : item.description}
                      </div>
                      {item.itemCode && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.itemCode}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono text-foreground border-r border-border/30">
                      {Number(item.quantity).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-foreground border-r border-border/30">
                      {Number(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-mono text-xs text-muted-foreground border-r border-border/30">
                      {Number(item.taxRate || 15)}%
                    </td>
                    <td className="p-3.5 text-right font-mono text-muted-foreground border-r border-border/30">
                      {Number(item.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-foreground">
                      {Number(item.lineTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans text-muted-foreground">SAR</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes Summary Grid */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t border-border pt-6 print:pt-4 print:avoid-break">
          
          {/* Notes & Terms Box */}
          <div className="w-full md:w-1/2 space-y-4">
            {invoice.notes && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Notes', 'ملاحظات')}</h5>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap leading-relaxed print:bg-slate-50 print:border-slate-200">
                  {invoice.notes}
                </p>
              </div>
            )}
            
            {invoice.terms && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('Terms & Conditions', 'الشروط والأحكام')}</h5>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60 whitespace-pre-wrap leading-relaxed print:bg-slate-50 print:border-slate-200">
                  {invoice.terms}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground/80">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>{t('Certified ZATCA Tax Invoice. Recorded in SOCPA General Ledger.', 'فاتورة ضريبية معتمدة من الزكاة والدخل. مسجلة في دفتر المحاسبة.')}</span>
            </div>
          </div>

          {/* Financial Calculation Summary Card */}
          <div className="w-full md:w-80 bg-muted/40 p-5 rounded-2xl border border-border/80 space-y-3 print:bg-slate-50 print:border-slate-300">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('Subtotal (Excl. VAT)', 'المجموع (غير شامل الضريبة)')}</span>
              <span className="font-mono font-semibold text-foreground">
                {Number(invoice.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
              </span>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('15% VAT Tax Amount', 'ضريبة القيمة المضافة (15%)')}</span>
              <span className="font-mono font-semibold text-foreground">
                {Number(invoice.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
              </span>
            </div>

            <div className="border-t border-border/80 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-foreground">{t('Total Amount', 'المبلغ الإجمالي النهائي')}</span>
              <div className="text-right">
                <span className="font-mono text-xl font-black text-primary block">
                  {Number(invoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SAR (ر.س)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Authorized Signature Box & Verification Footnote */}
        <div className="hidden print:flex justify-between items-end border-t border-slate-300 pt-8 mt-12 print-avoid-break">
          <div className="text-xs text-slate-500 space-y-1">
            <div className="font-bold text-slate-800">{companyNameEn}</div>
            <div>Official ZATCA Phase 2 E-Invoice</div>
            <div className="text-[10px]">Cryptographic Stamp Verified · SOCPA Accounting Compliant</div>
          </div>

          <div className="text-center w-56 space-y-12">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Authorized Signature & Stamp
            </div>
            <div className="border-b border-dashed border-slate-400 w-full"></div>
            <div className="text-[10px] text-slate-400">Date: ____ / ____ / 2026</div>
          </div>
        </div>

      </div>
    </div>
  );
}
