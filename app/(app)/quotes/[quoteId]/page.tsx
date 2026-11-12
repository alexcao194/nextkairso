"use client";

import { use } from "react";
import { QuoteEditor } from "@/components/quotes/QuoteEditor";

export default function QuotePage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = use(params);
  return <QuoteEditor id={quoteId} />;
}
