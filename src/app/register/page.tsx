import { UserPlus } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <ComingSoon
      icon={UserPlus}
      title="Registration arrives in Phase 3"
      description="You will choose Donor or NGO, then NGOs complete a verification profile before they can publish campaigns."
    />
  );
}
