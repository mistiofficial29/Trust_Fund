import { redirect } from "next/navigation";

import { ExpenseForm } from "@/components/forms/expense-form";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function ExpensePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  const ngo = await db.ngoProfile.findUnique({
    where: { userId: session.user.id },
    include: { campaigns: { include: { budgetItems: true } } },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Log an expense</h1>
      <p className="mt-2 text-sm text-muted-foreground">A bill is required. Duplicate or unusual bills are flagged for review.</p>
      <div className="mt-8">
        <ExpenseForm campaigns={ngo?.campaigns ?? []} />
      </div>
    </div>
  );
}
