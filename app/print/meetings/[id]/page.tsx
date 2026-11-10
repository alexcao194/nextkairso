"use client";

import { Suspense, use } from "react";
import { MeetingPrint } from "@/components/kairso/MeetingPrint";

export default function PrintMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense>
      <MeetingPrint id={id} />
    </Suspense>
  );
}
