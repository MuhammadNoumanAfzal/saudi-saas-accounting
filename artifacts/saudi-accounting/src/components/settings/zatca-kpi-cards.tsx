import { useTranslation } from '@/lib/utils';
import { ShieldCheck, Zap, QrCode, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ZatcaKpiCardsProps {
  csidActive: boolean;
  envMode: 'sandbox' | 'production';
  testPassed?: boolean;
}

export function ZatcaKpiCards({ csidActive, envMode, testPassed }: ZatcaKpiCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
      {/* CSID Security Certificate Status */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {t('CSID Certificate', 'شهادة CSID')}
          </span>
          <div className={`p-2 rounded-xl transition-colors ${
            csidActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20'
          }`}>
            <ShieldCheck size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-xl font-black tracking-tight ${csidActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
            {csidActive ? t('Active & Stamp', 'مفعّلة وموثّقة') : t('Onboard Needed', 'مطلوب التوثيق')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
          <span>{csidActive ? t('ECDSA secp256k1', 'توقيع مشفّر ECDSA') : t('No certificate issued', 'لم يتم إصدار شهادة')}</span>
          <span className={`font-semibold ${csidActive ? 'text-emerald-600' : 'text-amber-600'}`}>
            {csidActive ? '● Valid' : '○ Pending'}
          </span>
        </div>
      </div>

      {/* ZATCA Environment */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {t('Target Environment', 'البيئة المستهدفة')}
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Zap size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tight text-foreground capitalize">
            {envMode === 'sandbox' ? t('Sandbox Testnet', 'بيئة التجربة Sandbox') : t('FATOORA Production', 'إنتاج FATOORA')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
          <span>{t('API Clearance', 'ربط الفوترة')}</span>
          <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold">
            {envMode === 'sandbox' ? 'Simulation API' : 'Live ZATCA Gateway'}
          </span>
        </div>
      </div>

      {/* Phase 2 QR & TLV Standard */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {t('E-Invoice Compliance', 'معيار الفوترة 2.1')}
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 transition-colors">
            <QrCode size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tight text-foreground">
            Phase 1 & Phase 2
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
          <span>{t('Base64 TLV Encoding', 'ترميز TLV للباركود')}</span>
          <span className="text-purple-600 dark:text-purple-400 font-semibold">UBL 2.1 XML</span>
        </div>
      </div>

      {/* Compliance API Clearance Status */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            {t('Compliance Test', 'فحص الجاهزية')}
          </span>
          <div className={`p-2 rounded-xl transition-colors ${
            testPassed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'
          }`}>
            {testPassed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-xl font-black tracking-tight ${testPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
            {testPassed ? t('100% Passed', 'ناجح 100%') : t('Ready to Test', 'جاهز للاختبار')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
          <span>{t('Simulated Clearance', 'محاكاة الفسح')}</span>
          <span className="font-semibold text-primary">{t('Instant Verify', 'التحقق الفوري')}</span>
        </div>
      </div>
    </div>
  );
}
