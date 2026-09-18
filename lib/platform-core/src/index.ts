export * from "./domain-events";

export type ModuleKey =
  | "finance"
  | "fleet"
  | "projects"
  | "assets"
  | "intelligence"
  | "automate";

export type ModuleStatus = "AVAILABLE" | "COMING_SOON" | "BETA" | "DISABLED";

export type NexusModuleDefinition = {
  key: ModuleKey;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: "business" | "intelligence" | "automation";
  icon: string;
  route: string;
  status: ModuleStatus;
  sortOrder: number;
  dependencies: ModuleKey[];
  availableForActivation: boolean;
  features: readonly string[];
};

export const MODULE_REGISTRY: readonly NexusModuleDefinition[] = [
  {
    key: "finance",
    name: "Nexus Finance",
    nameAr: "نكسس المالية",
    description: "Saudi-ready finance and accounting workspace.",
    descriptionAr: "مساحة مالية ومحاسبية جاهزة للأعمال في السعودية.",
    category: "business",
    icon: "wallet-cards",
    route: "/finance",
    status: "AVAILABLE",
    sortOrder: 10,
    dependencies: [],
    availableForActivation: true,
    features: [
      "customers",
      "suppliers",
      "products",
      "quotations",
      "invoices",
      "purchases",
      "expenses",
      "accounting",
      "inventory",
      "reports",
      "zatca",
    ],
  },
  {
    key: "fleet",
    name: "Nexus Fleet",
    nameAr: "نكسس إدارة الأسطول",
    description: "Connected fleet operations and mobility.",
    descriptionAr: "عمليات الأسطول والتنقل المترابطة.",
    category: "business",
    icon: "truck",
    route: "/fleet",
    status: "COMING_SOON",
    sortOrder: 20,
    dependencies: [],
    availableForActivation: false,
    features: [],
  },
  {
    key: "projects",
    name: "Nexus Projects",
    nameAr: "نكسس المشاريع",
    description: "Projects, delivery, and commercial control.",
    descriptionAr: "إدارة المشاريع والتسليم والرقابة التجارية.",
    category: "business",
    icon: "briefcase-business",
    route: "/projects",
    status: "COMING_SOON",
    sortOrder: 30,
    dependencies: [],
    availableForActivation: false,
    features: [],
  },
  {
    key: "assets",
    name: "Nexus Assets",
    nameAr: "نكسس الأصول",
    description: "Shared asset lifecycle and location context.",
    descriptionAr: "دورة حياة الأصول وسياق المواقع المشترك.",
    category: "business",
    icon: "boxes",
    route: "/assets",
    status: "COMING_SOON",
    sortOrder: 40,
    dependencies: [],
    availableForActivation: false,
    features: [],
  },
  {
    key: "intelligence",
    name: "Nexus Intelligence",
    nameAr: "نكسس التحليلات الذكية",
    description: "Cross-platform operational intelligence.",
    descriptionAr: "تحليلات تشغيلية ذكية عبر المنصة.",
    category: "intelligence",
    icon: "brain-circuit",
    route: "/intelligence",
    status: "COMING_SOON",
    sortOrder: 50,
    dependencies: [],
    availableForActivation: false,
    features: [],
  },
  {
    key: "automate",
    name: "Nexus Automate",
    nameAr: "نكسس الأتمتة",
    description: "Connected workflows and business automation.",
    descriptionAr: "مسارات عمل مترابطة وأتمتة للأعمال.",
    category: "automation",
    icon: "workflow",
    route: "/automate",
    status: "COMING_SOON",
    sortOrder: 60,
    dependencies: [],
    availableForActivation: false,
    features: [],
  },
] as const;

export const INTEGRATION_REGISTRY = [
  "zatca",
  "gps-telematics",
  "video-management",
  "ai-video-analytics",
  "maps",
  "sms",
  "email",
  "payment-gateways",
  "banks",
  "erp-apis",
  "government-platforms",
] as const;

export function getModuleDefinition(key: string) {
  return MODULE_REGISTRY.find((module) => module.key === key);
}

export function isModuleKey(value: string): value is ModuleKey {
  return MODULE_REGISTRY.some((module) => module.key === value);
}