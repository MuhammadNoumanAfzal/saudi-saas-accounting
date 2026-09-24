import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/utils';
import { useGetCurrentSession } from '@workspace/api-client-react';
import { Store, Zap, ShieldCheck, QrCode, CheckCircle2, KeyRound, Building2, Send, RefreshCw, AlertCircle, Sparkles, Server } from 'lucide-react';

async function readJsonResponse(res: Response) {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 300) || `HTTP ${res.status}`);
  }
}
export function BranchesSettings() {
  const { t } = useTranslation();

  return (
    <div className="max-w-[800px] space-y-8 fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('Branches', 'الفروع')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('Manage physical locations and point-of-sale settings.', 'إدارة المواقع الفعلية وإعدادات نقاط البيع.')}</p>
      </div>

      <div className="soft-card p-12 flex flex-col items-center justify-center text-center">
        <Store size={40} className="text-muted-foreground/30 mb-6" />
        <h2 className="text-lg font-bold mb-2">{t('Multi-branch support is upcoming', 'دعم الفروع المتعددة قادم')}</h2>
        <p className="text-sm text-muted-foreground max-w-[400px]">
          {t('Your workspace currently operates as a single branch. Future updates will allow separate inventory and reporting per location.', 'تعمل مساحة عملك حالياً كفرع واحد. ستتيح التحديثات المستقبلية فصل المخزون والتقارير لكل موقع.')}
        </p>
      </div>
    </div>
  );
}

export function ZatcaSettings() {
  const { t } = useTranslation();
  const { data: session } = useGetCurrentSession();
  const orgId = session?.preferences?.currentOrganizationId || session?.organizations?.[0]?.organization.id || '';
  const org = session?.organizations?.find(o => o.organization.id === orgId)?.organization || session?.organizations?.[0]?.organization;

  const [envMode, setEnvMode] = useState<'sandbox' | 'production'>('sandbox');
  const [vatNumber, setVatNumber] = useState(org?.vatNumber || '300123456700003');
  const [companyName, setCompanyName] = useState(org?.legalNameEnglish || org?.legalNameArabic || 'Al-Riyadh Modern Trading Co.');
  const [otpCode, setOtpCode] = useState('123456');

  useEffect(() => {
    if (org) {
      if (org.vatNumber) setVatNumber(org.vatNumber);
      if (org.legalNameEnglish || org.legalNameArabic) {
        setCompanyName(org.legalNameEnglish || org.legalNameArabic || '');
      }
    }
    if (orgId) {
      fetch(`/api/organizations/${orgId}/zatca/status`, { credentials: 'include' })
        .then(readJsonResponse)
        .then(data => {
          if (data && data.csidActive) {
            setCsidActive(true);
            if (data.envMode) setEnvMode(data.envMode);
          }
        })
        .catch(() => {});
    }
  }, [org, orgId]);

  const [loading, setLoading] = useState(false);
  const [csidActive, setCsidActive] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      alert(t('Please enter a valid 6-digit ZATCA OTP code.', 'يرجى إدخال رمز التحقق ZATCA المكون من 6 أرقام.'));
      return;
    }

    const activeOrgId = orgId || 'current';
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${activeOrgId}/zatca/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          otpCode,
          vatNumber,
          companyName,
          envMode,
        }),
      });
      const data = await readJsonResponse(res);
      setLoading(false);

      if (res.ok && data.success) {
        setCsidActive(true);
        alert(t(data.message || 'ZATCA Compliance CSID Certificate successfully issued!', 'تم إصدار شهادة CSID وتوثيقها بنجاح!'));
      } else {
        alert(data.error || 'ZATCA Onboarding failed');
      }
    } catch (err: any) {
      setLoading(false);
      alert(err.message || 'Failed to connect to ZATCA endpoint');
    }
  };

  const handleRunComplianceTest = async () => {
    const activeOrgId = orgId || 'current';
    if (!csidActive) {
      setTestResult({
        status: 'error',
        message: t('CSID Certificate required! Please enter a 6-digit OTP code below and click "Request ZATCA CSID Certificate" first.', 'شهادة CSID مطلوبة! يرجى إدخال رمز OTP أولاً وإصدار الشهادة.')
      });
      return;
    }

    setTestResult({ status: 'testing' });
    try {
      const res = await fetch(`/api/organizations/${activeOrgId}/zatca/compliance-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await readJsonResponse(res);

      if (res.ok && data.success) {
        setTestResult({
          status: 'success',
          message: data.message || 'Invoice Clearance Simulation Passed!',
        });
      } else {
        setTestResult({
          status: 'error',
          message: data.error || 'Compliance test failed',
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Network error executing compliance test',
      });
    }
  };

  return (
    <div className="max-w-[900px] space-y-8 fade-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-xs font-bold mb-2">
            <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
            <span>ZATCA Phase 1 & Phase 2 Compliant Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {t('ZATCA E-Invoicing Integration Portal', 'بوابة ربط الفوترة الإلكترونية (زكاة)')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Onboard solution unit, manage CSID security certificates, and simulate Phase 2 Clearance APIs.', 'ربط وحدة الحلول المحاسبية، إدارة شهادات الأمان CSID، وتجربة اختبارات المرحلة الثانية.')}
          </p>
        </div>
      </div>

      {/* Active Certificate Status Card */}
      <div className="soft-card p-6 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-foreground">
                  {csidActive ? 'ZATCA CSID Certificate Active' : 'ZATCA Connection Required'}
                </h3>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {envMode === 'sandbox' ? 'Sandbox Testnet' : 'FATOORA Production'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ECDSA secp256k1 Cryptographic Stamp • Base64 TLV QR Code Generator • Immutable Audit Log Enabled
              </p>
            </div>
          </div>

          <button
            onClick={handleRunComplianceTest}
            disabled={testResult.status === 'testing'}
            className="btn-primary text-xs font-bold py-2.5 px-4 flex items-center gap-2 shrink-0"
          >
            {testResult.status === 'testing' ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} className="text-amber-300" />
            )}
            <span>Run ZATCA Compliance API Test</span>
          </button>
        </div>

        {/* Live Test Simulation Output */}
        {testResult.status === 'success' && (
          <div className="mt-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">STATUS 200 OK — ZATCA CLEARANCE API SIMULATION PASSED</div>
              <div className="mt-0.5 opacity-90">{testResult.message}</div>
            </div>
          </div>
        )}

        {testResult.status === 'error' && (
          <div className="mt-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-mono text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">STATUS 400 BAD REQUEST — CSID CERTIFICATE REQUIRED</div>
              <div className="mt-0.5 opacity-90">{testResult.message}</div>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding & Certificate Configuration Form */}
      <div className="soft-card p-6 sm:p-8 space-y-6">
        <div className="border-b border-border/80 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Device Onboarding & CSID Issue</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Submit 6-digit OTP code to issue your ZATCA cryptographic certificate.</p>
          </div>

          {/* Environment Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
            <button
              onClick={() => setEnvMode('sandbox')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                envMode === 'sandbox' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ZATCA Sandbox
            </button>
            <button
              onClick={() => setEnvMode('production')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                envMode === 'production' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              FATOORA Production
            </button>
          </div>
        </div>

        <form onSubmit={handleOnboard} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Saudi VAT Registration Number (رقم الهوية الضريبية)
              </label>
              <input
                type="text"
                required
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                maxLength={15}
                className="field rounded-xl font-mono text-sm"
                placeholder="310123456700003"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">15-digit Tax Identification Number starting and ending with 3.</span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Registered Company Name (اسم المنشأة)
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="field rounded-xl text-sm"
                placeholder="Company Legal Name"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              ZATCA 6-Digit OTP Code (رمز التحقق OTP)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="field rounded-xl font-mono text-base font-bold tracking-widest max-w-[200px] text-center"
                placeholder="123456"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-sm font-bold px-6 py-2.5 flex items-center gap-2 rounded-xl shadow-md"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Request ZATCA CSID Certificate</span>
                  </>
                )}
              </button>
            </div>
            {envMode === 'sandbox' && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-amber-500" />
                <span>
                  <strong>Sandbox Testing Mode:</strong> Enter any 6-digit dummy OTP code (such as <code>123456</code> or <code>849201</code>) to issue your test CSID Certificate instantly!
                </span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ZATCA Technical Compliance Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="soft-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <QrCode size={18} />
            </div>
            <h4 className="font-bold text-sm text-foreground">Base64 TLV QR Codes</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Encodes Seller Name, VAT Number, Time, Invoice Total & Tax Amount compliant with ZATCA Release 2.1.1 700-char limits.
          </p>
        </div>

        <div className="soft-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <KeyRound size={18} />
            </div>
            <h4 className="font-bold text-sm text-foreground">ECDSA secp256k1</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            2048-bit RSA/ECDSA asymmetric key pair generation and SHA-256 UBL 2.1 XML digest signing.
          </p>
        </div>

        <div className="soft-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Server size={18} />
            </div>
            <h4 className="font-bold text-sm text-foreground">NCA Saudi Data Residency</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Local cloud storage & immutable audit logs strictly compliant with National Cybersecurity Authority regulations.
          </p>
        </div>
      </div>
    </div>
  );
}

