import { z } from "zod";

import { CAMPAIGN_CATEGORIES, MAX_GOAL_INR, MIN_GOAL_INR, REGISTRATION_TYPES } from "@/lib/constants";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["DONOR", "NGO"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ngoProfileSchema = z
  .object({
    legalName: z.string().min(3).max(120),
    registrationType: z.enum(REGISTRATION_TYPES.map((t) => t.value) as [string, ...string[]]),
    registrationNumber: z.string().min(3).max(40),
    yearEstablished: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
    city: z.string().min(2).max(80),
    state: z.string().min(2).max(80),
    website: z.string().url().optional().or(z.literal("")),
    contactPerson: z.string().min(2).max(80),
    phone: z.string().min(8).max(20),
    email: z.string().email(),
    govtAffiliated: z.boolean(),
    govtDepartment: z.string().optional(),
    affiliationCertNo: z.string().optional(),
    parentOrg: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.govtAffiliated) {
      if (!data.govtDepartment) {
        ctx.addIssue({ code: "custom", message: "Department name is required", path: ["govtDepartment"] });
      }
      if (!data.affiliationCertNo) {
        ctx.addIssue({
          code: "custom",
          message: "Affiliation certificate number is required",
          path: ["affiliationCertNo"],
        });
      }
    }
  });

export const budgetItemSchema = z.object({
  category: z.string().min(2).max(80),
  amountInr: z.coerce.number().int().positive(),
});

export const campaignSchema = z
  .object({
    title: z.string().min(8).max(140),
    summary: z.string().min(20).max(280),
    story: z.string().min(40),
    category: z.enum(CAMPAIGN_CATEGORIES.map((c) => c.value) as [string, ...string[]]),
    state: z.string().min(2),
    district: z.string().min(2),
    area: z.string().min(2),
    goalInr: z.coerce.number().int().min(MIN_GOAL_INR).max(MAX_GOAL_INR),
    startDate: z.string(),
    endDate: z.string(),
    beneficiaries: z.coerce.number().int().min(1),
    budgetItems: z.array(budgetItemSchema).min(1),
    submit: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const sum = data.budgetItems.reduce((acc, item) => acc + item.amountInr, 0);
    if (sum !== data.goalInr) {
      ctx.addIssue({
        code: "custom",
        message: "Budget line items must add up to the funding goal",
        path: ["budgetItems"],
      });
    }
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      ctx.addIssue({ code: "custom", message: "End date must be after start date", path: ["endDate"] });
    }
  });

export const donationSchema = z.object({
  campaignId: z.string(),
  amountInr: z.coerce.number().int().min(100),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  anonymous: z.boolean().optional(),
  donorName: z.string().max(80).optional(),
  message: z.string().max(280).optional(),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const expenseSchema = z.object({
  campaignId: z.string(),
  budgetItemId: z.string(),
  vendor: z.string().min(2).max(120),
  invoiceNo: z.string().max(40).optional(),
  amountInr: z.coerce.number().int().positive(),
  description: z.string().min(8).max(400),
  quantity: z.string().max(40).optional(),
  billDate: z.string(),
  txHash: z.string().optional(),
});

export const flagReviewSchema = z.object({
  status: z.enum(["CLEARED", "ESCALATED"]),
  notes: z.string().max(500).optional(),
});
