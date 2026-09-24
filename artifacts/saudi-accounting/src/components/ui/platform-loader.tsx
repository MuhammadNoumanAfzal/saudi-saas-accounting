import React from 'react';
import { useTranslation } from '@/lib/utils';
import { ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Top Route Progress Bar
 * Displays a thin, glowing Saudi Emerald progress line at the top of the window
 */
export function TopProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-500/20 overflow-hidden pointer-events-none">
      <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-top-bar" />
    </div>
  );
}

/**
 * Full-page or Container Obsidian Glassmorphic Loader
 * Centered spinner with concentric Saudi Emerald glowing rings & dynamic micro-copy
 */
export function PlatformLoader({
  message,
  messageAr,
  fullScreen = false,
}: {
  message?: string;
  messageAr?: string;
  fullScreen?: boolean;
}) {
  const { t } = useTranslation();

  const defaultEn = message || 'Loading KHANBAS NEXUS Workspace...';
  const defaultAr = messageAr || 'جاري تحضير منصة نكسس المحاسبية...';

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-5 max-w-md fade-up">
      {/* KHANBAS NEXUS Branded Spinning Aura */}
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 animate-emerald-ring" />
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 opacity-20 blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-[#071f19] text-[#10b981] flex items-center justify-center shadow-2xl border border-emerald-500/30">
          <span className="font-black text-2xl tracking-tighter text-emerald-400">N</span>
        </div>
      </div>

      {/* Title & Status */}
      <div className="space-y-2">
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">KHANBAS NEXUS</h3>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold badge-glow">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          <span>{t(defaultEn, defaultAr)}</span>
        </div>
      </div>

      {/* Smooth Loading Bar */}
      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-400 animate-top-bar rounded-full" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-lg flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full min-h-[320px] flex items-center justify-center">
      {content}
    </div>
  );
}

/**
 * Glassmorphic Shimmer Box Primitive
 */
export function SkeletonShimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-muted/40 rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-500/10 dark:via-emerald-400/10 to-transparent animate-shimmer-wave" />
    </div>
  );
}

/**
 * 4-Column KPI Stat Card Grid Shimmer Skeleton
 */
export function SkeletonKpiGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-border/60 bg-card/60 shadow-2xs space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <SkeletonShimmer className="h-3 w-24" />
            <SkeletonShimmer className="h-8 w-8 rounded-xl" />
          </div>
          <SkeletonShimmer className="h-7 w-32" />
          <div className="flex items-center gap-2">
            <SkeletonShimmer className="h-3.5 w-14 rounded-md" />
            <SkeletonShimmer className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 5-Row Data Table Shimmer Skeleton
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card/50 overflow-hidden shadow-2xs space-y-0">
      {/* Table Header Skeleton */}
      <div className="px-6 py-4 border-b border-border/60 bg-muted/30 grid grid-cols-12 gap-4 items-center">
        <SkeletonShimmer className="col-span-3 h-4" />
        <SkeletonShimmer className="col-span-2 h-4" />
        <SkeletonShimmer className="col-span-2 h-4" />
        <SkeletonShimmer className="col-span-2 h-4" />
        <SkeletonShimmer className="col-span-3 h-4 ms-auto w-16" />
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 border-b border-border/40 last:border-0 grid grid-cols-12 gap-4 items-center"
        >
          <div className="col-span-3 flex items-center gap-3">
            <SkeletonShimmer className="h-8 w-8 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <SkeletonShimmer className="h-3.5 w-3/4" />
              <SkeletonShimmer className="h-2.5 w-1/2" />
            </div>
          </div>
          <SkeletonShimmer className="col-span-2 h-4 w-20" />
          <SkeletonShimmer className="col-span-2 h-4 w-24" />
          <div className="col-span-2">
            <SkeletonShimmer className="h-5 w-16 rounded-full" />
          </div>
          <div className="col-span-3 flex justify-end">
            <SkeletonShimmer className="h-7 w-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Complete Page Container Shimmer Skeleton
 */
export function SkeletonPage({
  titleEn = 'Loading Data...',
  titleAr = 'جاري التحميل...',
  showKpi = true,
}: {
  titleEn?: string;
  titleAr?: string;
  showKpi?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto fade-in">
      <TopProgressBar />

      {/* Page Title & Actions Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t(titleEn, titleAr)}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Sparkles className="w-3 h-3" /> ZATCA
            </span>
          </div>
          <SkeletonShimmer className="h-3.5 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonShimmer className="h-10 w-28 rounded-xl" />
          <SkeletonShimmer className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Optional KPI Cards */}
      {showKpi && <SkeletonKpiGrid />}

      {/* Filter / Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-card border border-border/60">
        <SkeletonShimmer className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <SkeletonShimmer className="h-10 w-24 rounded-xl" />
          <SkeletonShimmer className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Main Table Skeleton */}
      <SkeletonTable rows={6} />
    </div>
  );
}
