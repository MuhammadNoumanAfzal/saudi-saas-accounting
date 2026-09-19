import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { useGetCurrentSession } from '@workspace/api-client-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useTranslation() {
  const { data: session } = useGetCurrentSession();
  const lang = session?.preferences?.language || 'en';
  const isRtl = lang === 'ar';

  const t = (en: string, ar: string) => (isRtl ? ar : en);

  return { lang, isRtl, t };
}

export function Button({ children, className = '', variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const base = "inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none rounded-xl px-4 py-2.5 font-semibold text-sm";
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "hover:bg-muted text-foreground",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export function formatCurrency(amount: number, currency: string = 'SAR', locale: string = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency || 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
