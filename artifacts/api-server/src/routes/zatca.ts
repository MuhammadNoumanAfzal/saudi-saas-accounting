import { Router, type IRouter } from "express";
import { requireAuthentication } from "../middlewares/auth";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuthentication);

const getOrgId = (req: any) => String(req.params.organizationId);
const isConfigured = () => Boolean(process.env.ZATCA_ENV && process.env.ZATCA_CSR_BASE64 && process.env.ZATCA_PRIVATE_KEY_PEM);
const isProduction = () => process.env.ZATCA_ENV === "production";

const zatcaStateStore: Record<string, {
  csidActive: boolean;
  envMode: "sandbox" | "production";
  vatNumber?: string;
  companyName?: string;
  binarySecurityToken?: string;
  secret?: string;
  requestId?: string;
  issuedAt?: string;
  lastStatus?: string;
}> = {};

function zatcaBaseUrl(envMode: "sandbox" | "production") {
  return envMode === "production"
    ? "https://gw-fatoora.zatca.gov.sa/e-invoicing/core"
    : "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal";
}

async function zatcaRequest(path: string, init: RequestInit, envMode: "sandbox" | "production") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${zatcaBaseUrl(envMode)}${path}`, { ...init, signal: controller.signal });
    const text = await response.text();
    let data: any = text;
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!response.ok) {
      const err: any = new Error(data?.error || data?.message || `ZATCA HTTP ${response.status}`);
      err.statusCode = response.status;
      err.details = data;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

router.get("/organizations/:organizationId/zatca/status", async (req, res) => {
  const orgId = getOrgId(req);
  res.json({
    configured: isConfigured(),
    productionReady: isConfigured() && isProduction(),
    ...(zatcaStateStore[orgId] || { csidActive: false, envMode: process.env.ZATCA_ENV === "production" ? "production" : "sandbox" }),
  });
});

router.post("/organizations/:organizationId/zatca/onboard", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const { otpCode, vatNumber, companyName, envMode = process.env.ZATCA_ENV === "production" ? "production" : "sandbox" } = req.body || {};
    if (!otpCode || String(otpCode).trim().length !== 6) {
      res.status(400).json({ error: "Valid 6-digit ZATCA OTP code is required." });
      return;
    }
    if (!isConfigured()) {
      res.status(503).json({
        error: "ZATCA production credentials are not configured.",
        requiredEnv: ["ZATCA_ENV", "ZATCA_CSR_BASE64", "ZATCA_PRIVATE_KEY_PEM"],
      });
      return;
    }

    const data = await zatcaRequest("/compliance", {
      method: "POST",
      headers: { "Accept-Version": "V2", "Content-Type": "application/json", OTP: String(otpCode).trim() },
      body: JSON.stringify({ csr: process.env.ZATCA_CSR_BASE64 }),
    }, envMode);

    zatcaStateStore[orgId] = {
      csidActive: true,
      envMode,
      vatNumber,
      companyName,
      binarySecurityToken: data.binarySecurityToken,
      secret: data.secret,
      requestId: data.requestID || data.requestId,
      issuedAt: new Date().toISOString(),
      lastStatus: "CSID_ISSUED",
    };

    await writeAuditLog({ req, organizationId: orgId, action: "ZATCA_CSID_ONBOARDED", entityType: "ZATCA_SETTING", entityId: orgId, newValues: { envMode, requestId: zatcaStateStore[orgId].requestId } });
    res.json({ success: true, message: "ZATCA CSID issued by gateway.", certificate: { ...zatcaStateStore[orgId], secret: undefined, binarySecurityToken: data.binarySecurityToken ? "***" : undefined } });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to onboard ZATCA device", details: error.details });
  }
});

router.post("/organizations/:organizationId/zatca/compliance-test", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const status = zatcaStateStore[orgId];
    if (!status?.csidActive || !status.binarySecurityToken || !status.secret) {
      res.status(400).json({ error: "Active ZATCA CSID is required before compliance testing." });
      return;
    }
    const invoiceHash = req.body?.invoiceHash;
    const uuid = req.body?.uuid;
    const invoice = req.body?.invoice;
    if (!invoiceHash || !uuid || !invoice) {
      res.status(400).json({ error: "invoiceHash, uuid, and signed invoice XML are required." });
      return;
    }
    const data = await zatcaRequest("/compliance/invoices", {
      method: "POST",
      headers: {
        "Accept-Version": "V2",
        "Accept-Language": "en",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${status.binarySecurityToken}:${status.secret}`).toString("base64")}`,
      },
      body: JSON.stringify({ invoiceHash, uuid, invoice }),
    }, status.envMode);
    status.lastStatus = "COMPLIANCE_PASSED";
    await writeAuditLog({ req, organizationId: orgId, action: "ZATCA_COMPLIANCE_TESTED", entityType: "ZATCA_SETTING", entityId: orgId, newValues: { status: data?.validationResults?.status || "submitted" } });
    res.json({ success: true, response: data, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message || "Compliance test failed", details: error.details });
  }
});

router.post("/organizations/:organizationId/zatca/invoices/:invoiceId/clearance", async (_req, res) => {
  res.status(501).json({
    error: "Invoice XML signing/clearance requires a canonical UBL signer service.",
    nextStep: "Configure a vetted ZATCA UBL signing library/service, then submit signed XML with invoiceHash, uuid, and invoice payload.",
  });
});

export default router;
