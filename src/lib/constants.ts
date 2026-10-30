export const ROLES = ["DONOR", "NGO", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const VERIFICATION_STATUSES = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "COMPLETED",
  "REJECTED",
  "PAUSED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const REGISTRATION_TYPES = [
  { value: "TRUST", label: "Trust" },
  { value: "SOCIETY", label: "Society" },
  { value: "SECTION_8", label: "Section 8 Company" },
] as const;

export const CAMPAIGN_CATEGORIES = [
  { value: "FLOOD_RELIEF", label: "Flood Relief" },
  { value: "EDUCATION", label: "Education" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "FOOD_NUTRITION", label: "Food & Nutrition" },
  { value: "WOMEN_EMPOWERMENT", label: "Women Empowerment" },
  { value: "ENVIRONMENT", label: "Environment" },
  { value: "ANIMAL_WELFARE", label: "Animal Welfare" },
] as const;

export const NGO_DOC_TYPES = [
  { value: "REGISTRATION_CERTIFICATE", label: "Registration certificate", required: true },
  { value: "PAN", label: "PAN card of the NGO", required: true },
  { value: "CERT_12A", label: "12A registration", required: true },
  { value: "CERT_80G", label: "80G certificate", required: false },
  { value: "FCRA", label: "FCRA certificate", required: false },
  { value: "GOVT_AFFILIATION", label: "Government affiliation letter", required: false },
  { value: "AUDITED_FINANCIALS", label: "Latest audited financials", required: false },
] as const;

export const SENSITIVE_DOC_TYPES = new Set(["PAN", "AUDITED_FINANCIALS"]);

export const MIN_GOAL_INR = 10_000;
export const MAX_GOAL_INR = 1_00_00_000;

export const INR_PER_ETH = Number(process.env.NEXT_PUBLIC_INR_PER_ETH ?? "250000");
export const DEMO_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");

export const FLAG_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type FlagLevel = (typeof FLAG_LEVELS)[number];
