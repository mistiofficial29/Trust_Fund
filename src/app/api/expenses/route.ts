import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { fraudDetection } from "@/lib/fraud/service";
import type { HistoryExpense } from "@/lib/fraud/types";
import { getSession } from "@/lib/session";
import { expenseSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "NGO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = expenseSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const ngo = await db.ngoProfile.findUnique({ where: { userId: session.user.id } });
  const campaign = await db.campaign.findUnique({
    where: { id: parsed.data.campaignId },
    include: { budgetItems: true, expenses: true },
  });
  if (!ngo || !campaign || campaign.ngoId !== ngo.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const bill = parsed.data.invoiceNo
    ? await db.document.findFirst({
        where: { ownerType: "EXPENSE", ownerId: campaign.id, type: "BILL" },
        orderBy: { createdAt: "desc" },
      })
    : await db.document.findFirst({
        where: { ownerType: "EXPENSE", ownerId: campaign.id, type: "BILL" },
        orderBy: { createdAt: "desc" },
      });
  const billDoc = await db.document.findFirst({
    where: { ownerType: "EXPENSE", ownerId: campaign.id, type: "BILL" },
    orderBy: { createdAt: "desc" },
  });
  if (!billDoc) {
    return NextResponse.json({ error: "Upload a bill before saving the expense." }, { status: 400 });
  }
  const item = campaign.budgetItems.find((b) => b.id === parsed.data.budgetItemId);
  if (!item) {
    return NextResponse.json({ error: "Unknown budget line." }, { status: 400 });
  }

  const expense = await db.expense.create({
    data: {
      campaignId: campaign.id,
      budgetItemId: item.id,
      vendor: parsed.data.vendor,
      invoiceNo: parsed.data.invoiceNo,
      amountInr: parsed.data.amountInr,
      description: parsed.data.description,
      quantity: parsed.data.quantity,
      billDate: new Date(parsed.data.billDate),
      billDocId: billDoc.id,
      billHash: billDoc.sha256,
      txHash: parsed.data.txHash,
    },
  });

  const history: HistoryExpense[] = campaign.expenses.map((e) => {
    const cat = campaign.budgetItems.find((b) => b.id === e.budgetItemId)?.category ?? "";
    return {
      id: e.id,
      vendor: e.vendor,
      invoiceNo: e.invoiceNo,
      amountInr: e.amountInr,
      billDate: e.billDate,
      billHash: e.billHash,
      budgetItemId: e.budgetItemId,
      budgetCategory: cat,
      hasBill: Boolean(e.billDocId),
      createdAt: e.createdAt,
    };
  });

  const analysis = fraudDetection.analyzeExpense(
    {
      id: expense.id,
      vendor: expense.vendor,
      invoiceNo: expense.invoiceNo,
      amountInr: expense.amountInr,
      billDate: expense.billDate,
      billHash: expense.billHash,
      budgetItemId: expense.budgetItemId,
      budgetCategory: item.category,
      hasBill: true,
    },
    {
      startDate: campaign.startDate,
      raisedInr: campaign.raisedInr,
      budgetItems: campaign.budgetItems,
    },
    history,
  );

  if (analysis.flags.length) {
    await db.fraudFlag.createMany({
      data: analysis.flags.map((f) => ({
        expenseId: expense.id,
        ruleId: f.ruleId,
        severity: f.severity,
        reason: f.reason,
        status: analysis.level === "HIGH" || analysis.level === "MEDIUM" ? "UNDER_REVIEW" : "OPEN",
      })),
    });
  }

  return NextResponse.json({ expense, analysis });
}
