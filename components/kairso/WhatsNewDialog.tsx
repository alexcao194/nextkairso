"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getWhatsNew } from "@/lib/api/endpoints";
import { fmtDate } from "@/lib/domain/format";
import { qk } from "@/lib/query/keys";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ReleaseNotes } from "./ReleaseNotes";

const SEEN_KEY = "kairso-whats-new-seen";

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
};
const writeSeen = (id: string) => {
  try {
    localStorage.setItem(SEEN_KEY, id);
  } catch {
    /* trình duyệt chặn storage: lần sau hiện lại, không sao */
  }
};

export function WhatsNewDialog() {
  const latest = useQuery({
    queryKey: [...qk.whatsNew(), "latest"],
    queryFn: async () => (await getWhatsNew({ page: 1, limit: 1 })).items?.[0] ?? null,
    staleTime: Infinity,
  });
  const [open, setOpen] = useState(false);
  const release = latest.data;

  useEffect(() => {
    if (release && readSeen() !== release.id) setOpen(true);
  }, [release]);

  const close = () => {
    if (release) writeSeen(release.id);
    setOpen(false);
  };

  if (!release) return null;
  return (
    <Modal
      open={open}
      onClose={close}
      title={`Có gì mới · Phiên bản ${release.version}`}
      description={`Cập nhật ngày ${fmtDate(release.publishedAt)}`}
      width={600}
      footer={
        <>
          <Link href="/settings/whats-new" onClick={close} className="mr-auto text-[12.5px] text-accent-ink hover:underline">
            Xem các phiên bản trước
          </Link>
          <Button variant="primary" onClick={close}>Đã hiểu</Button>
        </>
      }
    >
      <ReleaseNotes notes={release.notes ?? []} />
    </Modal>
  );
}
