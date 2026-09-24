import { PublicLayout } from '@/components/layout/public-layout';
import { useTranslation } from '@/lib/utils';
import { 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck, 
  Zap, 
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Link } from 'wouter';

export function ZatcaGuidePage() {
  const { isRtl, t } = useTranslation();

  return (
    <PublicLayout>
      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-20">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-4">
            <QrCode size={14} className="text-[#d4af37]" />
            <span>{t('ZATCA Fatoora Compliance Guide', 'دليل الامتثال لبرنامج فاتورة (هيئة الزكاة)')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#071f19]">
            {t('Everything You Need to Know About', 'كل ما تحتاج معرفته عن')} <br />
            <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">
              {t('ZATCA Phase 1 & Phase 2', 'الفوترة الإلكترونية المرحلة الأولى والثانية')}
            </span>
          </h1>
          <p className="mt-4 text-base text-[#485d56]">
            {t(
              'Understand how KHANBAS NEXUS automates 100% of Saudi ZATCA e-invoicing compliance, clearance APIs, and Base64 TLV QR codes.',
              'تعرف على كيفية قيام منصة نكسس بأتمتة متطلبات الفوترة الإلكترونية والربط الفوري وتشفير رموز QR بالكامل.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
          
          {/* Phase 1 Box */}
          <div className="rounded-3xl border border-[#e2dcce] bg-white p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all cursor-pointer">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#176752]/10 border border-[#176752]/30 px-3.5 py-1 text-xs font-bold text-[#176752] mb-6">
              <span>{t('Phase 1: Generation Phase', 'المرحلة الأولى: مرحلة الإصدار')}</span>
            </div>
            <h3 className="text-2xl font-bold text-[#071f19] mb-4">
              {t('Base64 TLV QR Codes & Immutable Records', 'رموز QR بترميز TLV والسجلات المحمية')}
            </h3>
            <p className="text-xs text-[#5c726a] leading-relaxed mb-6">
              {t(
                'Mandated since December 4, 2021. All Saudi businesses must issue electronic invoices with structured data and TLV Base64 QR codes containing 5 mandatory fields.',
                'إلزامية لجميع المنشآت بالسعودية. تتضمن إصدار فواتير إلكترونية برموز QR تحتوي 5 حقول رئيسية مع منع التعديل اليدوي.'
              )}
            </p>

            <ul className="space-y-3 text-xs text-[#3e524b]">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> {t('5-Tag TLV Base64 QR Code Generation', 'إنشاء رمز QR بـ 5 حقول TLV Base64')}</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> {t('Prohibition of manual or edited invoices', 'حظر التعديل اليدوي أو إلغاء الفواتير مجهولة السبب')}</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> {t('Dual Arabic / English invoice headers', 'عناوين فواتير مزدوجة باللغة العربية والإنجليزية')}</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#176752]" /> {t('Automatic 15% Saudi VAT calculation', 'احتساب ضريبة القيمة المضافة 15% تلقائياً')}</li>
            </ul>
          </div>

          {/* Phase 2 Box */}
          <div className="rounded-3xl border border-[#071f19] bg-[#071f19] text-white p-8 lg:p-10 shadow-xl cursor-pointer">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/20 border border-[#d4af37] px-3.5 py-1 text-xs font-bold text-[#fef08a] mb-6">
              <span>{t('Phase 2: Integration Phase', 'المرحلة الثانية: مرحلة الربط والتكامل')}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              {t('Direct ZATCA Fatoora Portal API Sync', 'الربط المباشر مع منصة فاتورة عبر API')}
            </h3>
            <p className="text-xs text-[#a3b8b0] leading-relaxed mb-6">
              {t(
                'Rolled out in progressive revenue waves. Mandates direct API clearance for B2B tax invoices and 24-hour reporting for B2C simplified invoices.',
                'تتطلب الربط الفوري المباشر واعتماد الفواتير الضريبية (B2B) والإبلاغ خلال 24 ساعة للفواتير المبسطة (B2C).'
              )}
            </p>

            <ul className="space-y-3 text-xs text-[#c3d4cd]">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> {t('Real-Time B2B Clearance API', 'اعتماد فوري للفواتير الضريبية عبر API')}</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> {t('B2C 24-Hour Reporting API', 'إبلاغ آلي خلال 24 ساعة للفواتير المبسطة')}</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> {t('Cryptographic ECDSA Stamp Signatures', 'ختم وتوقيع مشفر ECDSA secp256k1')}</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#6ee7b7]" /> {t('Previous Invoice Hash (PIH) SHA-256 Chain', 'سلسلة هاش الفواتير السابقة SHA-256')}</li>
            </ul>
          </div>

        </div>

        <div className="mt-16 text-center">
          <Link href="/sign-up" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-sm font-bold shadow-xl shadow-[#176752]/25 hover:scale-[1.03] transition-all cursor-pointer">
            <span>{t('Start Issuing ZATCA Invoices Free', 'ابدأ إصدار فواتير معتمدة مجاناً')}</span>
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>

      </section>
    </PublicLayout>
  );
}
