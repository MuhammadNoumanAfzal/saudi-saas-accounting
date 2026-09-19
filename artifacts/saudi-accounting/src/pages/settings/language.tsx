import { useGetCurrentSession, useUpdateUserPreferences, getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useTranslation } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';
import { Languages, Globe, CheckCircle2, Clock, DollarSign, Calendar } from 'lucide-react';

export function LanguageSettings() {
  const { data: session } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  const update = useUpdateUserPreferences();

  const currentLang = session?.preferences?.language || 'en';

  const setLanguage = (language: 'en' | 'ar') => {
    if (language === currentLang) return;
    update.mutate({ data: { language } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentSessionQueryKey() });
        showAlert.toast(
          language === 'ar' 
            ? 'تم تغيير اللغة إلى العربية بنجاح.' 
            : 'Language switched to English successfully.'
        );
      }
    });
  };

  return (
    <div className="max-w-[1000px] space-y-8 fade-up pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Languages className="w-6 h-6 text-primary" />
          <span>{t('Language & Regional Preferences', 'اللغة والإعدادات الإقليمية')}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Choose your interface display language, text direction, and regional number formats.', 'إدارة لغة الواجهة، اتجاه النص، وتنسيق الأرقام الإقليمية.')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Selection Card */}
        <div className="soft-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Languages size={18} className="text-primary" />
              <span>{t('Interface Language & Layout', 'لغة الواجهة والتنسيق')}</span>
            </h2>
            <span className="text-xs text-muted-foreground">{t('Current Active:', 'النشط حالياً:')} <strong className="text-primary uppercase">{currentLang}</strong></span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setLanguage('en')}
              className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                currentLang === 'en' 
                  ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20' 
                  : 'border-border/70 bg-card hover:border-primary/40'
              }`}
            >
              <div className={`p-3 rounded-xl font-bold text-xl shrink-0 ${currentLang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                EN
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-base font-bold ${currentLang === 'en' ? 'text-primary' : 'text-foreground'}`}>English</span>
                  {currentLang === 'en' && <CheckCircle2 size={18} className="text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2">Left-to-right (LTR) layout direction</p>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] font-mono text-muted-foreground">
                  Preview: "Saudi SaaS Accounting Platform"
                </div>
              </div>
            </button>

            <button
              onClick={() => setLanguage('ar')}
              className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-right transition-all ${
                currentLang === 'ar' 
                  ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20' 
                  : 'border-border/70 bg-card hover:border-primary/40'
              }`}
              dir="rtl"
            >
              <div className={`p-3 rounded-xl font-bold text-xl arabic shrink-0 ${currentLang === 'ar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                ع
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-base font-bold arabic ${currentLang === 'ar' ? 'text-primary' : 'text-foreground'}`}>العربية</span>
                  {currentLang === 'ar' && <CheckCircle2 size={18} className="text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2 arabic">تنسيق الواجهة من اليمين إلى اليسار (RTL)</p>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] arabic text-muted-foreground">
                  معاينة: "منصة خانـباس نكسس للمحاسبة السعودية"
                </div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Regional Defaults Card */}
        <div className="soft-card p-6 space-y-5">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <span>{t('Regional & Currency Baseline', 'المعايير الإقليمية والعملة')}</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <DollarSign size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">{t('Default Currency', 'العملة الأساسية')}</div>
                <div className="text-sm font-bold text-foreground mt-0.5">SAR — Saudi Riyal</div>
                <div className="text-[11px] text-muted-foreground mt-1">{t('Fixed to 15% ZATCA VAT rate', 'ضريبة 15% معتمدة')}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">{t('Standard Timezone', 'المنطقة الزمنية')}</div>
                <div className="text-sm font-bold text-foreground mt-0.5">Asia/Riyadh (GMT+3)</div>
                <div className="text-[11px] text-muted-foreground mt-1">{t('Riyadh local audit stamps', 'أختام التوقيت المحلي')}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">{t('Calendar Basis', 'التقويم المعتمد')}</div>
                <div className="text-sm font-bold text-foreground mt-0.5">Gregorian & Hijri</div>
                <div className="text-[11px] text-muted-foreground mt-1">{t('Umm al-Qura aligned', 'مطابق لتقويم أم القرى')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

