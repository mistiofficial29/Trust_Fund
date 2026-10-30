import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

export default async function DashboardIndex() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/dashboard/admin");
  if (session.user.role === "NGO") redirect("/dashboard/ngo");
  redirect("/dashboard/donor");
}
