import { LogIn } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <ComingSoon
      icon={LogIn}
      title="Sign-in arrives in Phase 3"
      description="Donor, NGO and admin accounts will use email and password. Demo logins will be listed in the README."
    />
  );
}
