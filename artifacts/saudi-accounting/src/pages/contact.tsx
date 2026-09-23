import { useState } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock,
  Building2,
  Sparkles
} from 'lucide-react';
import { showAlert } from '@/lib/alerts';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showAlert.error('Validation Error', 'Please fill in all required contact fields.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showAlert.success(
        'Message Sent Successfully!',
        'Thank you for contacting KHANBAS NEXUS Saudi HQ. Our enterprise team will respond within 2 business hours.'
      );
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setMessage('');
    }, 800);
  };

  return (
    <PublicLayout>
      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:px-10 lg:py-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#176752]/25 bg-white/80 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-[#176752] shadow-sm mb-4">
            <MessageSquare size={14} className="text-[#d4af37]" />
            <span>24/7 Saudi Technical Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#071f19]">
            Get in Touch with Our <span className="bg-gradient-to-r from-[#176752] via-[#b8800b] to-[#d4af37] bg-clip-text text-transparent">Enterprise Team</span>
          </h1>
          <p className="mt-4 text-base text-[#485d56]">
            Have questions about ZATCA Phase 2 clearance, SOCPA accounting migration, or enterprise pricing? We are here to assist your company.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left: Contact Info & Offices */}
          <div className="lg:col-span-5 space-y-8">
            
            <div className="rounded-2xl border border-[#e2dcce] bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-[#071f19] mb-6 flex items-center gap-2">
                <Building2 className="text-[#176752]" size={20} />
                <span>Riyadh Headquarters</span>
              </h3>

              <div className="space-y-6 text-sm text-[#3e524b]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#176752]/10 text-[#176752] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-[#071f19]">Address</div>
                    <div className="mt-1 text-xs text-[#5c726a] leading-relaxed">
                      Olaya Financial District, King Fahd Road, P.O. Box 12214, Riyadh, Kingdom of Saudi Arabia
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#176752]/10 text-[#176752] flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-[#071f19]">Email Support</div>
                    <div className="mt-1 text-xs text-[#5c726a]">support@khanbas-nexus.sa</div>
                    <div className="text-xs text-[#5c726a]">sales@khanbas-nexus.sa</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#176752]/10 text-[#176752] flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-[#071f19]">Phone & WhatsApp</div>
                    <div className="mt-1 text-xs text-[#5c726a]">+966 11 482 9100 (Toll Free)</div>
                    <div className="text-xs text-[#5c726a]">+966 50 123 4567 (WhatsApp Business)</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 text-[#b8800b] flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-[#071f19]">Working Hours</div>
                    <div className="mt-1 text-xs text-[#5c726a]">Sunday – Thursday: 8:00 AM – 5:00 PM (AST)</div>
                    <div className="text-xs text-[#5c726a]">24/7 Automated System Monitoring</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Badge */}
            <a 
              href="https://wa.me/966501234567" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-900 shadow-sm hover:bg-emerald-100 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                  WA
                </div>
                <div>
                  <div className="font-bold text-sm">Instant WhatsApp Support</div>
                  <div className="text-xs text-emerald-700">Chat directly with a Saudi tax consultant</div>
                </div>
              </div>
              <Send size={18} className="text-emerald-700 group-hover:translate-x-1 transition-transform" />
            </a>

          </div>

          {/* Right: Interactive Contact Form */}
          <div className="lg:col-span-7 rounded-2xl border border-[#e2dcce] bg-white p-8 lg:p-10 shadow-lg">
            <h3 className="text-2xl font-bold text-[#071f19] mb-2">Send Us a Message</h3>
            <p className="text-xs text-[#5c726a] mb-8">
              Fill out the form below and our team will get back to you with custom demo details.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e524b] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mohammed Al-Otaibi"
                    className="w-full rounded-xl border border-[#d6cfbe] bg-[#fbf9f5] px-4 py-3 text-sm font-medium text-[#0a2620] focus:border-[#176752] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176752]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e524b] mb-2">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.sa"
                    className="w-full rounded-xl border border-[#d6cfbe] bg-[#fbf9f5] px-4 py-3 text-sm font-medium text-[#0a2620] focus:border-[#176752] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176752]/20 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e524b] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full rounded-xl border border-[#d6cfbe] bg-[#fbf9f5] px-4 py-3 text-sm font-medium text-[#0a2620] focus:border-[#176752] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176752]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3e524b] mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Al-Riyadh Trading Co."
                    className="w-full rounded-xl border border-[#d6cfbe] bg-[#fbf9f5] px-4 py-3 text-sm font-medium text-[#0a2620] focus:border-[#176752] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176752]/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3e524b] mb-2">
                  Message / Inquiry Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist your business with ZATCA Phase 2 or SaaS accounting?"
                  className="w-full rounded-xl border border-[#d6cfbe] bg-[#fbf9f5] px-4 py-3 text-sm font-medium text-[#0a2620] focus:border-[#176752] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176752]/20 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-sm font-bold shadow-lg shadow-[#176752]/25 hover:scale-[1.01] transition-all cursor-pointer"
              >
                {submitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <span>Submit Inquiry</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </section>
    </PublicLayout>
  );
}
