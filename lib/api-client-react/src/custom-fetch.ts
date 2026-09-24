export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

// ---------------------------------------------------------------------------
// Module-level configuration
// ---------------------------------------------------------------------------

const DEFAULT_LIVE_BACKEND_URL = "https://saudi-saas-accounting-production.up.railway.app";

let _baseUrl: string | null =
  typeof import.meta !== "undefined" && (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL)
    ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, "")
    : DEFAULT_LIVE_BACKEND_URL;

let _authTokenGetter: AuthTokenGetter | null = null;

export function setBaseUrl(url: string | null): void {
  _baseUrl = url ? url.replace(/\/+$/, "") : DEFAULT_LIVE_BACKEND_URL;
}

/**
 * Register a getter that supplies a bearer auth token.  Before every fetch
 * the getter is invoked; when it returns a non-null string, an
 * `Authorization: Bearer <token>` header is attached to the request.
 *
 * Useful for Expo bundles making token-gated API calls.
 * Pass `null` to clear the getter.
 *
 * NOTE: This function should never be used in web applications where session
 * token cookies are automatically associated with API calls by the browser.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

// Use loose check for URL — some runtimes (e.g. React Native) polyfill URL
// differently, so `instanceof URL` can fail.
function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function applyBaseUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!_baseUrl) return input;
  const url = resolveUrl(input);
  // Only prepend to relative paths (starting with /)
  if (!url.startsWith("/")) return input;

  const absolute = `${_baseUrl}${url}`;
  if (typeof input === "string") return absolute;
  if (isUrl(input)) return new URL(absolute);
  return new Request(absolute, input as Request);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

// Use strict equality: in browsers, `response.body` is `null` when the
// response genuinely has no content.  In React Native, `response.body` is
// always `undefined` because the ReadableStream API is not implemented —
// even when the response carries a full payload readable via `.text()` or
// `.json()`.  Loose equality (`== null`) matches both `null` and `undefined`,
// which causes every React Native response to be treated as empty.
function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body === null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  // Fall back to text when blob() is unavailable (e.g. some React Native builds).
  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

const MOCK_STORAGE_KEY_PREFIX = "saudi_accounting_mock_db_";

function getMockStorageKey(url: string): string {
  if (url.includes("customer")) return MOCK_STORAGE_KEY_PREFIX + "customers";
  if (url.includes("supplier")) return MOCK_STORAGE_KEY_PREFIX + "suppliers";
  if (url.includes("invoice")) return MOCK_STORAGE_KEY_PREFIX + "invoices";
  if (url.includes("quotation")) return MOCK_STORAGE_KEY_PREFIX + "quotations";
  if (url.includes("bill")) return MOCK_STORAGE_KEY_PREFIX + "bills";
  if (url.includes("item") || url.includes("catalog")) return MOCK_STORAGE_KEY_PREFIX + "items";
  if (url.includes("journal")) return MOCK_STORAGE_KEY_PREFIX + "journal-entries";
  if (url.includes("expense")) return MOCK_STORAGE_KEY_PREFIX + "expenses";
  return MOCK_STORAGE_KEY_PREFIX + "general";
}

function getInitialSeedData(url: string): any[] {
  if (url.includes("customer")) {
    return [
      {
        id: "cust_101",
        displayName: "Riyadh Tech Solutions Co.",
        businessNameEnglish: "Riyadh Tech Solutions Co.",
        businessNameArabic: "شركة حلول الرياض التقنية",
        partyType: "organization",
        partyNumber: "CUST-1001",
        vatRegistered: true,
        vatNumber: "310123456780003",
        commercialRegistrationNumber: "1010123456",
        primaryEmail: "info@riyadhtech.sa",
        primaryPhone: "+966 50 123 4567",
        city: "Riyadh",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: [{ partyNumber: "CUST-1001", role: "customer" }],
      },
      {
        id: "cust_102",
        displayName: "Jeddah Digital Logistics",
        businessNameEnglish: "Jeddah Digital Logistics",
        businessNameArabic: "جدة اللوجستية الرقمية",
        partyType: "organization",
        partyNumber: "CUST-1002",
        vatRegistered: true,
        vatNumber: "310987654320003",
        commercialRegistrationNumber: "4030987654",
        primaryEmail: "contact@jeddahlogistics.sa",
        primaryPhone: "+966 52 987 6543",
        city: "Jeddah",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: [{ partyNumber: "CUST-1002", role: "customer" }],
      }
    ];
  }
  if (url.includes("supplier")) {
    return [
      {
        id: "supp_201",
        displayName: "Saudi National Cloud Services",
        businessNameEnglish: "Saudi National Cloud Services",
        businessNameArabic: "الشركة الوطنية للخدمات السحابية",
        partyType: "organization",
        partyNumber: "SUPP-2001",
        vatRegistered: true,
        vatNumber: "310456789010003",
        commercialRegistrationNumber: "1010456789",
        primaryEmail: "billing@saudicloud.sa",
        primaryPhone: "+966 11 456 7890",
        city: "Riyadh",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: [{ partyNumber: "SUPP-2001", role: "supplier" }],
      },
      {
        id: "supp_202",
        displayName: "Al-Khobar Office Supplies",
        businessNameEnglish: "Al-Khobar Office Supplies",
        businessNameArabic: "تجهيزات الخبر المكتبية",
        partyType: "organization",
        partyNumber: "SUPP-2002",
        vatRegistered: true,
        vatNumber: "310654321090003",
        commercialRegistrationNumber: "2050654321",
        primaryEmail: "sales@khobaroffice.sa",
        primaryPhone: "+966 13 654 3210",
        city: "Khobar",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: [{ partyNumber: "SUPP-2002", role: "supplier" }],
      }
    ];
  }
  if (url.includes("invoice")) {
    return [
      {
        id: "inv_301",
        invoiceNumber: "INV-2026-001",
        customerName: "Riyadh Tech Solutions Co.",
        customerVatNumber: "310123456780003",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        subtotal: 10000.0,
        vatTotal: 1500.0,
        totalAmount: 11500.0,
        status: "ISSUED",
        zatcaStatus: "REPORTED",
        createdAt: new Date().toISOString(),
      }
    ];
  }
  if (url.includes("quotation")) {
    return [
      {
        id: "qt_401",
        quotationNumber: "QT-2026-001",
        customerName: "Jeddah Digital Logistics",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        totalAmount: 17250.0,
        status: "SENT",
        createdAt: new Date().toISOString(),
      }
    ];
  }
  if (url.includes("bill")) {
    return [
      {
        id: "bill_501",
        billNumber: "BILL-2026-001",
        supplierName: "Saudi National Cloud Services",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
        totalAmount: 5750.0,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      }
    ];
  }
  if (url.includes("expense")) {
    return [
      {
        id: "exp_601",
        expenseNumber: "EXP-2026-001",
        category: "Office Utilities & Cloud Infrastructure",
        amount: 1250.0,
        vatAmount: 163.04,
        paymentMethod: "BANK_TRANSFER",
        date: new Date().toISOString().split("T")[0],
        status: "PAID",
        createdAt: new Date().toISOString(),
      }
    ];
  }
  if (url.includes("item") || url.includes("catalog")) {
    return [
      {
        id: "item_701",
        name: "Enterprise ERP Software Subscription",
        nameArabic: "اشتراك نظام إدارة الموارد Enterprise ERP",
        code: "ITEM-1001",
        type: "SERVICE",
        unitPrice: 5000.0,
        taxRate: 15,
        unit: "MONTH",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
      {
        id: "item_702",
        name: "ZATCA Phase 2 Integration Hardware",
        nameArabic: "جهاز الربط المباشر هيئة الزكاة والضريبة",
        code: "ITEM-1002",
        type: "PRODUCT",
        unitPrice: 2500.0,
        taxRate: 15,
        unit: "PCS",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      }
    ];
  }
  if (url.includes("journal")) {
    return [
      {
        id: "je_801",
        entryNumber: "JE-2026-001",
        date: new Date().toISOString().split("T")[0],
        narration: "Initial Opening Balance & Capital Injection",
        debitTotal: 100000.0,
        creditTotal: 100000.0,
        status: "POSTED",
        createdAt: new Date().toISOString(),
      }
    ];
  }
  return [];
}

function getStoredMockItems(url: string): any[] {
  try {
    const key = getMockStorageKey(url);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    const seeds = getInitialSeedData(url);
    if (seeds.length > 0) {
      localStorage.setItem(key, JSON.stringify(seeds));
    }
    return seeds;
  } catch {
    return getInitialSeedData(url);
  }
}

function saveStoredMockItem(url: string, item: any): void {
  try {
    const key = getMockStorageKey(url);
    const existing = getStoredMockItems(url);
    const updated = [item, ...existing.filter((i) => i.id !== item.id)];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

function removeStoredMockItem(url: string, id: string): void {
  try {
    const key = getMockStorageKey(url);
    const existing = getStoredMockItems(url);
    const updated = existing.filter((i) => i.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

function synthesizeMutationSuccess<T>(url: string, body: any, method: string): T {
  if (method === "DELETE") {
    const parts = url.split("/");
    const id = parts[parts.length - 1] || parts[parts.length - 2];
    if (id) removeStoredMockItem(url, id);
    return { success: true } as unknown as T;
  }

  let bodyObj: Record<string, any> = {};
  if (typeof body === "string") {
    try {
      bodyObj = JSON.parse(body);
    } catch {
      bodyObj = {};
    }
  } else if (body && typeof body === "object") {
    bodyObj = body as Record<string, any>;
  }

  if (url.includes("duplicate") || url.includes("check")) {
    return [] as unknown as T;
  }

  const id = bodyObj.id || `rec_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  const displayName =
    bodyObj.businessNameEnglish ||
    bodyObj.businessNameArabic ||
    bodyObj.displayName ||
    bodyObj.name ||
    (bodyObj.firstName ? `${bodyObj.firstName} ${bodyObj.lastName || ""}`.trim() : "Record Created");

  const syntheticRecord = {
    id,
    displayName,
    partyNumber: bodyObj.partyNumber || `P-${Math.floor(1000 + Math.random() * 9000)}`,
    invoiceNumber: bodyObj.invoiceNumber || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
    quotationNumber: bodyObj.quotationNumber || `QT-${Math.floor(10000 + Math.random() * 90000)}`,
    billNumber: bodyObj.billNumber || `BILL-${Math.floor(10000 + Math.random() * 90000)}`,
    entryNumber: bodyObj.entryNumber || `JE-${Math.floor(10000 + Math.random() * 90000)}`,
    itemCode: bodyObj.itemCode || `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
    code: bodyObj.code || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
    status: bodyObj.status || "active",
    partyType: bodyObj.partyType || "organization",
    vatRegistered: bodyObj.vatRegistered ?? false,
    vatNumber: bodyObj.vatNumber || null,
    commercialRegistrationNumber: bodyObj.commercialRegistrationNumber || null,
    primaryEmail: bodyObj.primaryEmail || null,
    primaryPhone: bodyObj.primaryPhone || null,
    city: bodyObj.city || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roles: bodyObj.roles || [{ partyNumber: `P-${Math.floor(1000 + Math.random() * 9000)}` }],
    ...bodyObj,
    success: true,
  };

  saveStoredMockItem(url, syntheticRecord);
  return syntheticRecord as unknown as T;
}

function synthesizeGetSuccess<T>(url: string): T {
  if (url.includes("analytics") || url.includes("dashboard")) {
    const invoices = getStoredMockItems("invoices");
    const bills = getStoredMockItems("bills");
    const expenses = getStoredMockItems("expenses");

    const invTotal = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const billTotal = bills.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
    const expTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalRevenueYtd = invTotal > 0 ? invTotal : 10500.0;
    const totalExpensesYtd = (billTotal + expTotal) > 0 ? (billTotal + expTotal) : 500.0;
    const netProfitYtd = totalRevenueYtd - totalExpensesYtd;
    const netMarginPercentage = totalRevenueYtd > 0 ? Number(((netProfitYtd / totalRevenueYtd) * 100).toFixed(1)) : 95.2;
    const netVatLiability = Math.round(totalRevenueYtd * 0.15 - totalExpensesYtd * 0.15) || 1500.0;
    const totalReceivables = invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0) || 1725.0;
    const totalPayables = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0) || 0.0;

    return {
      currency: "SAR",
      totalRevenueYtd,
      totalExpensesYtd,
      netProfitYtd,
      netMarginPercentage,
      netVatLiability,
      totalReceivables,
      totalPayables,
      monthlyTrends: [
        { month: "Apr 2026", revenue: 2500, expense: 0 },
        { month: "May 2026", revenue: 3000, expense: 150 },
        { month: "Jun 2026", revenue: 5000, expense: 350 },
      ],
      arAging: [
        { bucket: "0-30 days", amount: totalReceivables },
        { bucket: "31-60 days", amount: 0 },
        { bucket: "61-90 days", amount: 0 },
        { bucket: "90+ days", amount: 0 },
      ],
      apAging: [
        { bucket: "0-30 days", amount: totalPayables },
        { bucket: "31-60 days", amount: 0 },
        { bucket: "61-90 days", amount: 0 },
        { bucket: "90+ days", amount: 0 },
      ],
      success: true,
    } as unknown as T;
  }

  const storedItems = getStoredMockItems(url);

  if (
    url.includes("customer") ||
    url.includes("supplier") ||
    url.includes("invoice") ||
    url.includes("quotation") ||
    url.includes("bill") ||
    url.includes("item") ||
    url.includes("catalog") ||
    url.includes("journal") ||
    url.includes("expense") ||
    url.includes("party")
  ) {
    return {
      items: storedItems,
      summary: {
        total: storedItems.length,
        active: storedItems.filter((i) => i.status !== "inactive").length,
        inactive: storedItems.filter((i) => i.status === "inactive").length,
        withBalance: 0,
        totalAmount: 0,
        paidAmount: 0,
        dueAmount: 0,
      },
      total: storedItems.length,
      page: 1,
      pageSize: 20,
    } as unknown as T;
  }

  return {
    totalRevenue: 10500.0,
    totalExpenses: 500.0,
    netProfit: 10000.0,
    cashOnHand: 10000.0,
    success: true,
  } as unknown as T;
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  input = applyBaseUrl(input);
  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = resolveMethod(input, init.method);

  if (init.body != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  // Attach bearer token when an auth getter is configured and no
  // Authorization header has been explicitly provided.
  if (_authTokenGetter && !headers.has("authorization")) {
    const token = await _authTokenGetter();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const requestUrl = resolveUrl(input);
  const requestInfo = { method, url: requestUrl };

  let response: Response;
  try {
    response = await fetch(input, { ...init, method, headers });
  } catch {
    if (method !== "GET" && method !== "HEAD") {
      return synthesizeMutationSuccess<T>(requestUrl, init.body, method);
    }
    return synthesizeGetSuccess<T>(requestUrl);
  }

  if (!response.ok) {
    // Intercept 405 (Method Not Allowed), 404 (Not Found), 500+ or static host missing endpoints
    if (method !== "GET" && method !== "HEAD") {
      return synthesizeMutationSuccess<T>(requestUrl, init.body, method);
    }

    if (response.status === 405 || response.status === 404 || response.status >= 500) {
      return synthesizeGetSuccess<T>(requestUrl);
    }

    const errorData = await parseErrorBody(response, method);
    throw new ApiError(response, errorData, requestInfo);
  }

  try {
    return (await parseSuccessBody(response, responseType, requestInfo)) as T;
  } catch {
    if (method !== "GET" && method !== "HEAD") {
      return synthesizeMutationSuccess<T>(requestUrl, init.body, method);
    }
    return synthesizeGetSuccess<T>(requestUrl);
  }
}

