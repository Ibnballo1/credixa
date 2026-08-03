"use client";

/**
 * File: apps/web/src/features/referrals/components/copy-referral-link.tsx
 * Purpose: Copy-to-clipboard button for the shareable referral link.
 */
import { useState } from "react";
import { Button } from "@credixa/ui";

export function CopyReferralLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={link}
        className="h-10 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-600"
        onFocus={(e) => e.target.select()}
      />
      <Button type="button" size="sm" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
