"use client";

import { Suspense, use } from "react";
import { QuotePrint } from "@/components/quotes/QuotePrint";

export default function PrintQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense>
      <QuotePrint id={id} />
    </Suspense>
  );
}
