import type { FlagLevel } from "@/lib/constants";

export type FraudFlagResult = {
  ruleId: string;
  severity: FlagLevel;
  reason: string;
};

export type ExpenseInput = {
  id?: string;
  vendor: string;
  invoiceNo?: string | null;
  amountInr: number;
  billDate: Date;
  billHash: string;
  budgetItemId: string;
  budgetCategory: string;
  hasBill: boolean;
};

export type HistoryExpense = ExpenseInput & { createdAt: Date };

export type CampaignInput = {
  startDate: Date;
  raisedInr: number;
  budgetItems: { id: string; category: string; amountInr: number }[];
};

export type FraudAnalysis = {
  riskScore: number;
  level: FlagLevel;
  flags: FraudFlagResult[];
  explanation: string;
};
