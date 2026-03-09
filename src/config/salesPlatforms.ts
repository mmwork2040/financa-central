// Single source of truth for all sales integration platforms
// When adding a new sales platform to Integracoes.tsx, add its ID here too
export const SALES_PLATFORM_IDS = [
  "hotmart",
  "eduzz",
  "monetizze",
  "kiwify",
  "hubla",
] as const;

export type SalesPlatformId = typeof SALES_PLATFORM_IDS[number];
