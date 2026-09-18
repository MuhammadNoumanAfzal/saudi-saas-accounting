import { useTranslation } from '@/lib/utils';
import { Store, Zap } from 'lucide-react';

export function BranchesSettings() {
  const { t } = useTranslation();

  return (
    <div className="max-w-[800px] space-y-8 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Branches', 'الفروع')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Manage physical locations and point-of-sale settings.', 'إدارة المواقع الفعلية وإعدادات نقاط البيع.')}</p>
      </div>

      <div className="soft-card p-12 flex flex-col items-center justify-center text-center">
        <Store size={40} className="text-muted-foreground/30 mb-6" />
        <h2 className="text-lg font-bold mb-2">{t('Multi-branch support is upcoming', 'دعم الفروع المتعددة قادم')}</h2>
        <p className="text-sm text-muted-foreground max-w-[400px]">
          {t('Your workspace currently operates as a single branch. Future updates will allow separate inventory and reporting per location.', 'تعمل مساحة عملك حالياً كفرع واحد. ستتيح التحديثات المستقبلية فصل المخزون والتقارير لكل موقع.')}
        </p>
      </div>
    </div>
  );
}

export function ZatcaSettings() {
  const { t } = useTranslation();

  return (
    <div className="max-w-[800px] space-y-8 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('ZATCA Integration', 'تكامل هيئة الزكاة والضريبة')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Manage Phase 2 electronic invoicing compliance.', 'إدارة المرحلة الثانية من الفوترة الإلكترونية.')}</p>
      </div>

      <div className="soft-card p-12 flex flex-col items-center justify-center text-center border-accent/20">
        <Zap size={40} className="text-accent mb-6" />
        <h2 className="text-lg font-bold mb-2">{t('E-Invoicing Phase 2 Ready', 'جاهز للمرحلة الثانية من الفوترة')}</h2>
        <p className="text-sm text-muted-foreground max-w-[450px]">
          {t('Mizan is architected for full ZATCA compliance. The integration portal will open automatically when your organization is requested to connect to the FATOORA platform.', 'تم تصميم ميزان للتوافق الكامل مع هيئة الزكاة والضريبة. ستُفتح بوابة الربط تلقائياً عندما يُطلب من منشأتك الربط بمنصة فاتورة.')}
        </p>
      </div>
    </div>
  );
}
