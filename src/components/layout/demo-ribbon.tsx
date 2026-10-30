"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "trustfund-demo-ribbon-dismissed";

export function DemoRibbon() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.sessionStorage.getItem(STORAGE_KEY);
    setVisible(dismissed !== "1");
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="relative z-[60] bg-primary px-4 py-2 text-center text-sm text-primary-foreground"
      role="status"
    >
      <p className="pr-8">
        <span className="font-medium">Demo data.</span> Organisations, documents and
        transactions on this site are fictional and for demonstration only.
      </p>
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10"
        onClick={() => {
          window.sessionStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
        aria-label="Dismiss demo data notice"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
