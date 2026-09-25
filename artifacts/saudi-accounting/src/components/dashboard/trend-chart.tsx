import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation, formatCurrency } from '@/lib/utils';
import { BarChart3, TrendingUp, Sparkles, Activity, Layers, ArrowUpRight } from 'lucide-react';
import type { DashboardAnalytics } from '@workspace/api-client-react';

interface TrendChartProps {
  analytics?: DashboardAnalytics;
  isRtl: boolean;
}

export function TrendChart({ analytics, isRtl }: TrendChartProps) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'svg' | 'bars' | 'profit'>('svg');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const trends = analytics?.monthlyTrends || [];

  // Prepare normalized points for SVG rendering
  const maxVal = Math.max(...trends.map(t => Math.max(Number(t.revenue || 0), Number(t.expenses || t.expense || 0))), 1000);
  
  const width = 600;
  const height = 200;
  const padding = 30;

  const pointsRev = trends.map((pt, i) => {
    const x = padding + (i / Math.max(1, trends.length - 1)) * (width - padding * 2);
    const rev = Number(pt.revenue || 0);
    const y = height - padding - (rev / maxVal) * (height - padding * 2);
    return { x, y, val: rev };
  });

  const pointsExp = trends.map((pt, i) => {
    const x = padding + (i / Math.max(1, trends.length - 1)) * (width - padding * 2);
    const exp = Number(pt.expenses || pt.expense || 0);
    const y = height - padding - (exp / maxVal) * (height - padding * 2);
    return { x, y, val: exp };
  });

  // Construct SVG paths
  const revPathStr = pointsRev.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');
  const expPathStr = pointsExp.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');
  
  const revAreaStr = pointsRev.length > 0 
    ? `${revPathStr} L ${pointsRev[pointsRev.length - 1].x},${height - padding} L ${pointsRev[0].x},${height - padding} Z`
    : '';

  const activePoint = hoveredIdx !== null ? trends[hoveredIdx] : trends[trends.length - 1];
  const activeRev = Number(activePoint?.revenue || 0);
  const activeExp = Number(activePoint?.expenses || activePoint?.expense || 0);
  const activeNet = activeRev - activeExp;
  const activeMonthLabel = activePoint ? ((isRtl ? activePoint.monthNameAr : activePoint.monthNameEn) || activePoint.month || 'Month') : '';

  return (
    <Card className="border-border bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            <span>{t('Revenue vs Expense 6-Month Trend', 'مقارنة الإيرادات والمصروفات (٦ أشهر)')}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Interactive SVG chart visualizer with cursor pointer tracking', 'رسم بياني تفاعلي لهوامش الأرباح والإيرادات')}
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveView('svg')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'svg' ? 'bg-card text-primary shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('Interactive SVG', 'رسم بياني')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('bars')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'bars' ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t('Bar Matrix', 'أعمدة')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('profit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'profit' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('Profit Grid', 'الأرباح')}</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Dynamic Tooltip Bar - Fully Mobile Responsive */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-primary/5 via-card to-amber-500/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-foreground">
              {hoveredIdx !== null ? `${t('Inspecting:', 'معاينة:')} ${activeMonthLabel}` : `${t('Latest Month:', 'الشهر الحالي:')} ${activeMonthLabel}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-mono w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-muted-foreground">{t('Revenue:', 'الإيراد:')}</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(activeRev, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-muted-foreground">{t('Expenses:', 'المصروف:')}</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">
                {formatCurrency(activeExp, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 border-l border-border pl-3 sm:pl-4 rtl:pl-0 rtl:pr-3 sm:rtl:pr-4 rtl:border-r">
              <span className="text-muted-foreground">{t('Net Margin:', 'صافي الأرباح:')}</span>
              <span className={`font-black ${activeNet >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(activeNet, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* VIEW 1: INTERACTIVE SVG AREA & LINE CHART */}
        {activeView === 'svg' && (
          <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible cursor-pointer">
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75].map((pct, i) => (
                <line
                  key={i}
                  x1={padding}
                  y1={height - padding - pct * (height - padding * 2)}
                  x2={width - padding}
                  y2={height - padding - pct * (height - padding * 2)}
                  stroke="currentColor"
                  className="text-border/60"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Area Fill */}
              {revAreaStr && <path d={revAreaStr} fill="url(#revGradient)" />}

              {/* Expense Line */}
              {expPathStr && (
                <path
                  d={expPathStr}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />
              )}

              {/* Revenue Line */}
              {revPathStr && (
                <path
                  d={revPathStr}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />
              )}

              {/* Interactive Data Nodes & Hover Guide */}
              {pointsRev.map((p, i) => {
                const expP = pointsExp[i];
                const isHovered = hoveredIdx === i;
                const monthName = (isRtl ? trends[i]?.monthNameAr : trends[i]?.monthNameEn) || trends[i]?.month || '';

                return (
                  <g key={i} className="cursor-pointer group" onMouseEnter={() => setHoveredIdx(i)}>
                    {/* Vertical Cursor Tracker */}
                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={padding}
                        x2={p.x}
                        y2={height - padding}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Expense Node */}
                    <circle
                      cx={expP.x}
                      cy={expP.y}
                      r={isHovered ? '6' : '4'}
                      fill="#f59e0b"
                      className="transition-all duration-300 hover:scale-150"
                    />

                    {/* Revenue Node */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? '7' : '5'}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:scale-150 shadow-md"
                    />

                    {/* X-Axis Month Label */}
                    <text
                      x={p.x}
                      y={height - 8}
                      textAnchor="middle"
                      className={`text-[11px] font-bold ${isHovered ? 'fill-emerald-600 font-extrabold' : 'fill-muted-foreground'}`}
                    >
                      {monthName}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* VIEW 2: DUAL BAR MATRIX */}
        {activeView === 'bars' && (
          <div className="space-y-4">
            {trends.map((pt, idx) => {
              const revenue = Number(pt.revenue || 0);
              const expenses = Number(pt.expenses || pt.expense || 0);
              const maxV = Math.max(revenue, expenses, 1000);
              const revPct = Math.min(100, Math.max(4, (revenue / maxV) * 100));
              const expPct = Math.min(100, Math.max(4, (expenses / maxV) * 100));
              const label = (isRtl ? pt.monthNameAr : pt.monthNameEn) || pt.month || 'Month';
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`space-y-2 p-3 rounded-xl transition-all cursor-pointer ${
                    isHovered ? 'bg-primary/10 border border-primary/30 shadow-sm scale-[1.01]' : 'hover:bg-muted/40'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-foreground">{label}</span>
                    <div className="flex gap-4 font-mono text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {t('Rev:', 'إيراد:')} {formatCurrency(revenue, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {t('Exp:', 'مصروف:')} {formatCurrency(expenses, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-primary h-full rounded-full transition-all duration-700"
                        style={{ width: `${revPct}%` }}
                      />
                    </div>
                    <div className="w-full bg-muted/60 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${expPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: QUARTERLY PROFIT GRID */}
        {activeView === 'profit' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {trends.map((pt, idx) => {
              const rev = Number(pt.revenue || 0);
              const exp = Number(pt.expenses || pt.expense || 0);
              const net = rev - exp;
              const label = (isRtl ? pt.monthNameAr : pt.monthNameEn) || pt.month || 'Month';
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`p-4 rounded-xl border border-border bg-card transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    isHovered ? 'border-primary shadow-md scale-[1.02] bg-primary/5' : 'hover:border-primary/40'
                  }`}
                >
                  <span className="text-xs font-bold text-muted-foreground">{label}</span>
                  <div className={`text-lg font-black font-mono ${net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(net, 'SAR', isRtl ? 'ar-SA' : 'en-US')}
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border pt-2 font-mono">
                    <span>Margin</span>
                    <span className="font-extrabold text-foreground">{rev > 0 ? Math.round((net / rev) * 100) : 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
