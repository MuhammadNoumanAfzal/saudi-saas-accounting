import { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LISTENERS = new Set<() => void>();

export function setGlobalLanguage(lang: 'ar' | 'en') {
  localStorage.setItem('nexus_lang', lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  LISTENERS.forEach(fn => fn());
}

export function useTranslation() {
  const [localLang, setLocalLang] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('nexus_lang') as 'ar' | 'en') || 'ar';
  });

  useEffect(() => {
    const onChange = () => {
      const stored = (localStorage.getItem('nexus_lang') as 'ar' | 'en') || 'ar';
      setLocalLang(stored);
    };
    LISTENERS.add(onChange);
    return () => { LISTENERS.delete(onChange); };
  }, []);

  const lang = localLang;
  const isRtl = lang === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [isRtl, lang]);

  const toggleLanguage = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    setGlobalLanguage(next);
  };

  const setLanguage = (newLang: 'ar' | 'en') => {
    setGlobalLanguage(newLang);
  };

  const t = (en: string, ar: string) => (isRtl ? ar : en);

  return { lang, isRtl, toggleLanguage, setLanguage, t };
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
