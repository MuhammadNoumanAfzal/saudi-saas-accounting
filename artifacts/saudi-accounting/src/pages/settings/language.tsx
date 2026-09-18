import { useGetCurrentSession, useUpdateUserPreferences, getGetCurrentSessionQueryKey } from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { queryClient } from '@/lib/queryClient';
import { Languages, Globe } from 'lucide-react';

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
        // Document direction update is handled in AppShell, but we might need a small reload for layout shifts if required, though React handles it well usually.
      }
    });
  };

  return (
    <div className="max-w-[800px] space-y-8 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Language & Region', 'اللغة والمنطقة')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Set your personal workspace language.', 'تعيين لغة مساحة العمل الشخصية الخاصة بك.')}</p>
      </div>

      <div className="soft-card p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Languages size={18} className="text-muted-foreground" />
          {t('Interface Language', 'لغة الواجهة')}
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setLanguage('en')}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${currentLang === 'en' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
          >
            <div className={`p-2 rounded-lg font-bold text-lg leading-none ${currentLang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              En
            </div>
            <div>
              <div className={`text-sm font-bold mb-0.5 ${currentLang === 'en' ? 'text-primary' : 'text-foreground'}`}>English</div>
              <div className="text-xs text-muted-foreground">Left-to-right interface</div>
            </div>
          </button>

          <button
            onClick={() => setLanguage('ar')}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 text-right transition-all ${currentLang === 'ar' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}`}
            dir="rtl"
          >
            <div className={`p-2 rounded-lg font-bold text-lg leading-none arabic ${currentLang === 'ar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              ع
            </div>
            <div>
              <div className={`text-sm font-bold mb-0.5 arabic ${currentLang === 'ar' ? 'text-primary' : 'text-foreground'}`}>العربية</div>
              <div className="text-xs text-muted-foreground arabic">واجهة من اليمين لليسار</div>
            </div>
          </button>
        </div>
      </div>
      
      <div className="soft-card p-6 border-dashed bg-muted/10">
        <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
          <Globe size={18} className="text-muted-foreground" />
          {t('Organization Region', 'منطقة المنشأة')}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {t('Currency, timezone, and fiscal year settings belong to the organization and affect all users. You can change them in the Organization profile.', 'تتبع إعدادات العملة والمنطقة الزمنية والسنة المالية المنشأة وتؤثر على جميع المستخدمين. يمكنك تغييرها في ملف المنشأة.')}
        </p>
      </div>
    </div>
  );
}
