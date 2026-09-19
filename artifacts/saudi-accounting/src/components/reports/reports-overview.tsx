import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/utils';
import { TrendingUp, Scale, FileText, BookOpen, ChevronRight, ArrowRight, Printer } from 'lucide-react';

export function ReportsOverview() {
  const { t, isRtl } = useTranslation();

  const reportCards = [
    {
      titleEn: "Profit & Loss Statement",
      titleAr: "قائمة الدخل (الأرباح والخسائر)",
      descEn: "Summary of revenues, cost of sales, operating expenses, and net profit.",
      descAr: "ملخص الإيرادات، تكلفة المبيعات، المصروفات التشغيلية، وصافي الربح.",
      href: "/reports/profit-and-loss",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      titleEn: "Balance Sheet",
      titleAr: "الميزانية العمومية",
      descEn: "Snapshot of organization assets, liabilities, and owner's equity.",
      descAr: "لقطة مالية لأصول المنشأة، التزاماتها، وحقوق الملكية.",
      href: "/reports/balance-sheet",
      icon: Scale,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      titleEn: "ZATCA VAT Return Report",
      titleAr: "إقرار ضريبة القيمة المضافة (هيئة الزكاة والضريبة)",
      descEn: "Official VAT declaration breakdown for output tax vs input tax recovery.",
      descAr: "ملخص إقرار الضريبة الرسمي لضريبة المخرجات ومدخلات الاسترداد.",
      href: "/reports/zatca-vat-return",
      icon: FileText,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      titleEn: "Statement of Account / Account Ledger",
      titleAr: "كشف حساب تفصيلي",
      descEn: "Detailed chronological ledger entries for specific accounts with running balance.",
      descAr: "حركات الحسابات الكلية والجزئية مع رصيد افتتاحي وختامي.",
      href: "/reports/account-ledger",
      icon: BookOpen,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('Financial Reports & Compliance', 'التقارير المالية والامتثال الزكوي')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('Access realtime financial statements and Saudi ZATCA VAT tax compliance reports.', 'عرض القوائم المالية الفورية وإقرارات ضريبة القيمة المضافة المعتمدة.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow relative overflow-hidden group">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1 pr-4 rtl:pr-0 rtl:pl-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {t(card.titleEn, card.titleAr)}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {t(card.descEn, card.descAr)}
                  </CardDescription>
                </div>
                <div className={`p-3 rounded-xl border ${card.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex justify-end">
                <Link href={card.href}>
                  <Button variant="secondary" className="gap-2 text-xs font-medium">
                    <span>{t('View Report', 'عرض التقرير')}</span>
                    {isRtl ? <ArrowRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
