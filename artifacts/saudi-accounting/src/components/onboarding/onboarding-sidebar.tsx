import { Check, Building2, ShieldCheck, MapPin, Sliders, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StepItem {
  id: number;
  title: string;
  desc: string;
  icon: LucideIcon;
}

interface OnboardingSidebarProps {
  step: number;
  setStep: (step: number) => void;
  isRtl: boolean;
  t: (en: string, ar: string) => string;
}

export function OnboardingSidebar({ step, setStep, isRtl, t }: OnboardingSidebarProps) {
  const steps: StepItem[] = [
    { id: 1, title: t('Business Info', 'معلومات الكيان'), desc: t('Legal & Trading Names', 'الأسماء الرسمية والتجارية'), icon: Building2 },
    { id: 2, title: t('Tax & CR', 'الضرائب والسجل'), desc: t('ZATCA VAT & Commercial Reg.', 'الرقم الضريبي والسجل التجاري'), icon: ShieldCheck },
    { id: 3, title: t('National Address', 'العنوان الوطني'), desc: t('Saudi Post SPL Address', 'عنوان البريد السعودي (سبل)'), icon: MapPin },
    { id: 4, title: t('Accounting', 'المحاسبة'), desc: t('SAR Currency & Defaults', 'عملة SAR وقواعد الفواتير'), icon: Sliders },
    { id: 5, title: t('Ready to Launch', 'جاهز للإطلاق'), desc: t('Review & Setup Workspace', 'مراجعة وتفعيل مساحة العمل'), icon: Sparkles },
  ];

  return (
    <aside className="w-full lg:w-96 xl:w-[420px] sidebar-bg text-white p-6 sm:p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-500/10 via-transparent to-black/30 pointer-events-none" />

      <div className="relative z-10">
        {/* Logo & Platform Header */}
        <div className="flex items-center gap-3.5 mb-10">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shadow-lg">
            <img src="/logo.svg" alt="NEXUS" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-xl uppercase text-white">NEXUS</div>
            <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
              <span>🇸🇦 Saudi Arabia ERP</span>
            </div>
          </div>
        </div>

        {/* Stepper Vertical Timeline */}
        <div className="space-y-6 relative">
          <div
            className={`absolute top-5 bottom-5 w-0.5 bg-white/20 z-0 ${
              isRtl ? 'right-4 translate-x-1/2' : 'left-4 -translate-x-1/2'
            }`}
          />

          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = s.id < step;
            const isActive = s.id === step;

            return (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={`w-full flex items-start gap-4 group ${isRtl ? 'text-right' : 'text-left'} relative z-10 transition-all ${s.id < step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 relative z-10 ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/30 ring-4 ring-emerald-400/20 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-[#0b3329] border border-white/20 text-white/60'
                  }`}
                >
                  {isCompleted ? <Check size={16} className="stroke-[3]" /> : <Icon size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold transition-colors ${isActive ? 'text-white font-extrabold' : isCompleted ? 'text-emerald-200' : 'text-white/60'}`}>
                      {s.title}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 truncate mt-0.5">
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
