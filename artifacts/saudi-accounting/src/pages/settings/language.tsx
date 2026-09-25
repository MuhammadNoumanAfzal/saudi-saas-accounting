import { useGetCurrentSession, useUpdateUserPreferences, getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { showAlert } from '@/lib/alerts';
import { Languages, Globe, CheckCircle2, Clock, DollarSign, Calendar, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';

export function LanguageSettings() {
  const { data: session, refetch } = useGetCurrentSession({
    query: { staleTime: 10 * 60 * 1000 }
  });
  const { t } = useTranslation();
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
            : 'Language switched to English successfully.',
          'success'
        );
      }
    });
  };

  return (
    <div className="space-y-6 fade-up pb-16 print:p-0 print:m-0 print:space-y-0">
      {/* Luxury Header & Action Toolbar Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase tracking-wider border border-primary/20">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{t('Localization & Regional Baseline', 'التوطين والمعايير الإقليمية')}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck size={13} /> ZATCA & SOCPA Bilingual Standard
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Languages className="w-6 h-6 text-primary" />
            <span>{t('Language & Regional Preferences', 'اللغة والإعدادات الإقليمية')}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Choose your interface display language, LTR/RTL text layout, and Saudi regional number formats.', 'إدارة لغة الواجهة، اتجاه النص من اليمين لليسار، وتنسيق الأرقام والعملات الإقليمية.')}
          </p>
        </div>

        {/* Uniform Single-Line Action Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          <Button
            type="button"
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 text-foreground hover:text-primary transition-all duration-200 text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            title={t('Refresh Settings', 'تحديث')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">{t('Refresh', 'تحديث')}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setLanguage('en')}
            variant={currentLang === 'en' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 px-3.5 rounded-xl font-bold transition-all text-xs cursor-pointer shrink-0 ${currentLang === 'en' ? 'btn-primary' : 'bg-card border-border'}`}
          >
            English (EN)
          </Button>

          <Button
            type="button"
            onClick={() => setLanguage('ar')}
            variant={currentLang === 'ar' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 px-3.5 rounded-xl font-bold transition-all text-xs cursor-pointer shrink-0 ${currentLang === 'ar' ? 'btn-primary' : 'bg-card border-border'}`}
          >
            العربية (AR)
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Language Selection Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Languages size={18} className="text-primary" />
              <span>{t('Interface Language & Layout', 'لغة الواجهة والتنسيق')}</span>
            </h2>
            <span className="text-xs text-muted-foreground">{t('Current Active:', 'النشط حالياً:')} <strong className="text-primary uppercase font-mono">{currentLang}</strong></span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setLanguage('en')}
              className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                currentLang === 'en' 
                  ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20' 
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className={`p-3 rounded-xl font-black text-xl shrink-0 ${currentLang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                EN
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-base font-black ${currentLang === 'en' ? 'text-primary' : 'text-foreground'}`}>English</span>
                  {currentLang === 'en' && <CheckCircle2 size={18} className="text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Left-to-right (LTR) layout direction</p>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] font-mono text-muted-foreground">
                  Preview: "Saudi SaaS Accounting Platform"
                </div>
              </div>
            </button>

            <button
              onClick={() => setLanguage('ar')}
              className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                currentLang === 'ar' 
                  ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20' 
                  : 'border-border bg-card hover:border-primary/40'
              }`}
              dir="rtl"
            >
              <div className={`p-3 rounded-xl font-black text-xl arabic shrink-0 ${currentLang === 'ar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                ع
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-base font-black arabic ${currentLang === 'ar' ? 'text-primary' : 'text-foreground'}`}>العربية</span>
                  {currentLang === 'ar' && <CheckCircle2 size={18} className="text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2 arabic font-medium">تنسيق الواجهة من اليمين إلى اليسار (RTL)</p>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[11px] arabic text-muted-foreground">
                  معاينة: "منصة خانـباس نكسس للمحاسبة السعودية"
                </div>
              </div>
            </button>
          </div>
        </div>
        
        {/* Regional Defaults Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-4">
            <Globe size={18} className="text-primary" />
            <span>{t('Regional & Currency Baseline', 'المعايير الإقليمية والعملة')}</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <DollarSign size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">{t('Default Currency', 'العملة الأساسية')}</div>
                <div className="text-sm font-black text-foreground mt-0.5">SAR — Saudi Riyal</div>
                <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Fixed to 15% ZATCA VAT rate', 'ضريبة 15% معتمدة')}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">{t('Standard Timezone', 'المنطقة الزمنية')}</div>
                <div className="text-sm font-black text-foreground mt-0.5">Asia/Riyadh (GMT+3)</div>
                <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Riyadh local audit stamps', 'أختام التوقيت المحلي')}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase">{t('Calendar Basis', 'التقويم المعتمد')}</div>
                <div className="text-sm font-black text-foreground mt-0.5">Gregorian & Hijri</div>
                <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{t('Umm al-Qura aligned', 'مطابق لتقويم أم القرى')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


