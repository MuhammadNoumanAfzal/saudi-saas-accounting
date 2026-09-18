import { useState } from 'react';
import { useGetCurrentSession, useGetDashboardSummary, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { useTranslation, Button } from '@/lib/utils';
import { Link } from 'wouter';
import { WalletCards, CreditCard, FileText, BarChart3, Clock3, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';

export function FinanceOverview() {
  const { data: session, isLoading: sessionLoading } = useGetCurrentSession();
  const { t, isRtl } = useTranslation();
  
  const selectedMembership =
    session?.organizations?.find(
      item => item.organization.id === session.preferences.currentOrganizationId,
    ) ?? session?.organizations?.[0];
  const orgId = selectedMembership?.organization.id || '';
  const organization = selectedMembership?.organization;
  
  const { data: summary, isLoading } = useGetDashboardSummary(orgId, { 
    query: { enabled: !!orgId, queryKey: getGetDashboardSummaryQueryKey(orgId) } 
  });

  const [checklistOpen, setChecklistOpen] = useState(() => {
    return localStorage.getItem('nexus_checklist_open') !== 'false';
  });

  const toggleChecklist = () => {
    const next = !checklistOpen;
    setChecklistOpen(next);
    localStorage.setItem('nexus_checklist_open', String(next));
  };

  const currentDate = new Intl.DateTimeFormat(isRtl ? 'ar-SA' : 'en-SA', { 
    dateStyle: 'long', 
    timeZone: 'Asia/Riyadh' 
  }).format(new Date());
  const riyadhHour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'Asia/Riyadh',
    }).format(new Date()),
  );
  const greeting =
    riyadhHour < 12
      ? t('Good morning', 'صباح الخير')
      : riyadhHour < 18
        ? t('Good afternoon', 'مساء الخير')
        : t('Good evening', 'مساء الخير');

  if (sessionLoading || (orgId && isLoading)) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="shimmer h-4 w-32 rounded" />
          <div className="shimmer h-10 w-64 rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="soft-card h-32 p-5"><div className="shimmer h-3 w-24 rounded" /><div className="shimmer mt-6 h-8 w-32 rounded" /></div>)}
        </div>
      </div>
    );
  }

  const isEmtpy = !summary || !summary.recentTransactions?.length;

  return (
    <div className="space-y-8 fade-up pb-12">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="text-primary text-xs font-bold uppercase tracking-wider mb-2">
            {t('KHANBAS NEXUS Finance', 'خانـباس نكسس المالية')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
             {greeting}, {isRtl ? (organization?.legalNameArabic || organization?.legalNameEnglish) : organization?.legalNameEnglish}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
             {t("Here's where your business stands today.", 'إليك وضع منشأتك اليوم.')}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm">
            {currentDate}
          </div>
        </div>
      </header>

      {/* Checklist */}
      <div className="soft-card overflow-hidden">
        <button 
          className={`w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-muted/30 ${checklistOpen ? 'border-b border-border' : ''}`}
          onClick={toggleChecklist}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="font-bold text-sm">{t('Getting Started', 'البدء')}</div>
               <div className="text-xs text-muted-foreground mt-0.5">{t('1 of 6 complete · 17%', 'اكتمل 1 من 6 · 17٪')}</div>
            </div>
          </div>
          <div className="text-muted-foreground transition-transform" style={{ transform: checklistOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </div>
        </button>
        
        {checklistOpen && (
          <div className="p-5 bg-card/50">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold line-through text-muted-foreground">{t('Complete company profile', 'إكمال ملف المنشأة')}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                   <div className="text-sm font-semibold">{t('Add your first customer', 'إضافة أول عميل')}</div>
                   <Link href="/sales" className="text-xs text-primary font-medium mt-1 inline-block">{t('Coming soon', 'قريباً')}</Link>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                   <div className="text-sm font-semibold">{t('Add a product or service', 'إضافة منتج أو خدمة')}</div>
                   <Link href="/products" className="text-xs text-primary font-medium mt-1 inline-block">{t('Coming soon', 'قريباً')}</Link>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                <div>
                   <div className="text-sm font-semibold">{t('Create your first invoice', 'إنشاء أول فاتورة')}</div>
                   <Link href="/sales" className="text-xs text-primary font-medium mt-1 inline-block">{t('Coming soon', 'قريباً')}</Link>
                </div>
              </div>
               <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                 <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                 <div><div className="text-sm font-semibold">{t('Review tax settings', 'مراجعة إعدادات الضريبة')}</div><Link href="/settings/organization" className="text-xs text-primary font-medium mt-1 inline-block">{t('Review settings', 'مراجعة الإعدادات')}</Link></div>
               </div>
               <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                 <Circle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                 <div><div className="text-sm font-semibold">{t('Connect ZATCA', 'الربط مع هيئة الزكاة والضريبة')}</div><Link href="/settings/zatca" className="text-xs text-primary font-medium mt-1 inline-block">{t('Not available yet', 'غير متاح بعد')}</Link></div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
             [t('Revenue', 'الإيرادات'), summary?.revenue || '0.00', WalletCards], 
             [t('Receivables', 'المستحقات'), summary?.receivables || '0.00', CreditCard], 
             [t('Expenses', 'المصروفات'), summary?.expenses || '0.00', FileText], 
             [t('Net profit', 'صافي الربح'), summary?.netProfit || '0.00', BarChart3]
          ].map(([label, value, Icon]) => (
            <div key={label as string} className="soft-card p-5 group">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-4">
                {label as string}
                <div className="p-2 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                 {summary?.currency || 'SAR'} {value as string}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                 {summary?.hasComparativeData ? (
                  <>
                    <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 0%</span>
                    {t('vs last period', 'مقارنة بالفترة الماضية')}
                  </>
                ) : t('No comparative data yet', 'لا توجد بيانات مقارنة بعد')}
              </div>
            </div>
          ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t('Cash Flow', 'التدفق النقدي')}</h2>
            <div className="flex items-center bg-card rounded-lg border border-border p-1">
              <button className="px-3 py-1 text-xs font-semibold rounded bg-background shadow-sm text-foreground">{t('This Month', 'هذا الشهر')}</button>
              <button className="px-3 py-1 text-xs font-semibold rounded text-muted-foreground hover:text-foreground transition-colors">{t('Quarter', 'الربع')}</button>
              <button className="px-3 py-1 text-xs font-semibold rounded text-muted-foreground hover:text-foreground transition-colors">{t('Year', 'السنة')}</button>
            </div>
          </div>
          
          <div className="soft-card h-[300px] flex flex-col items-center justify-center text-center p-6 border-dashed bg-card/30">
            <BarChart3 size={32} className="text-muted-foreground/40 mb-4" />
            <div className="text-sm font-bold text-foreground mb-1">{t('Awaiting financial activity', 'بانتظار النشاط المالي')}</div>
            <div className="text-xs text-muted-foreground max-w-[250px]">{t('Charts and trends will generate automatically as transactions are recorded.', 'سيتم إنشاء الرسوم البيانية والاتجاهات تلقائياً عند تسجيل العمليات.')}</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t('Recent Activity', 'النشاط الأخير')}</h2>
            <Link href="/settings/audit-log" className="text-xs font-semibold text-primary hover:underline">
              {t('View all', 'عرض الكل')}
            </Link>
          </div>

          <div className="soft-card overflow-hidden">
            {isEmtpy ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center p-6 text-center border-dashed">
                <Clock3 size={24} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm font-bold text-foreground mb-1">{t('Timeline is clear', 'الجدول الزمني فارغ')}</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">{t('Actions taken by your team will appear here.', 'الإجراءات المتخذة ستظهر هنا.')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {summary.recentTransactions.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div className="text-sm font-medium">{tx.label}</div>
                    <div className="text-sm font-bold">{summary.currency} {tx.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="soft-card p-5"><h2 className="font-bold">{t('Invoices', 'الفواتير')}</h2><div className="mt-4 grid grid-cols-2 gap-2 text-xs">{[t('Draft', 'مسودة'), t('Unpaid', 'غير مدفوعة'), t('Partially paid', 'مدفوعة جزئياً'), t('Paid', 'مدفوعة'), t('Overdue', 'متأخرة')].map(label => <div key={label} className="flex justify-between rounded-lg bg-muted/40 p-2"><span>{label}</span><b>0</b></div>)}</div><Button className="mt-4 w-full" onClick={() => alert(t('This feature is coming in the next setup stage.', 'هذه الميزة قادمة في مرحلة الإعداد التالية.'))}>{t('Create invoice', 'إنشاء فاتورة')}</Button></div>
        <div className="soft-card p-5"><h2 className="font-bold">{t('Outstanding receivables', 'المستحقات القائمة')}</h2><div className="mt-5 text-2xl font-bold">SAR 0.00</div><div className="mt-4 space-y-2 text-sm text-muted-foreground"><div className="flex justify-between"><span>{t('Overdue', 'متأخرة')}</span><b className="text-foreground">SAR 0.00</b></div><div className="flex justify-between"><span>{t('Customers with balances', 'عملاء لديهم أرصدة')}</span><b className="text-foreground">0</b></div></div></div>
        <div className="soft-card p-5"><h2 className="font-bold">{t('Expenses', 'المصروفات')}</h2><p className="mt-2 text-xs text-muted-foreground">{t('This month', 'هذا الشهر')}</p><div className="mt-3 text-2xl font-bold">SAR 0.00</div><p className="mt-4 text-sm text-muted-foreground">{t('No expenses recorded yet.', 'لم تُسجل مصروفات بعد.')}</p></div>
        <div className="soft-card p-5"><h2 className="font-bold">{t('VAT summary', 'ملخص ضريبة القيمة المضافة')}</h2><div className="mt-4 space-y-2 text-sm">{[[t('Output VAT', 'ضريبة المخرجات'), 'SAR 0.00'], [t('Input VAT', 'ضريبة المدخلات'), 'SAR 0.00'], [t('Net VAT', 'صافي الضريبة'), 'SAR 0.00']].map(([label, value]) => <div key={label} className="flex justify-between"><span className="text-muted-foreground">{label}</span><b>{value}</b></div>)}</div><p className="mt-4 text-xs text-muted-foreground">{t('No VAT transactions recorded. Nothing has been submitted to ZATCA.', 'لم تُسجل معاملات ضريبية ولم يتم تقديم أي بيانات إلى الهيئة.')}</p></div>
      </div>
    </div>
  );
}
