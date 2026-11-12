import type { WhatsNewNoteResponse } from "@/lib/api/schema";
import { Badge } from "@/components/ui/feedback";
import { tr } from "@/lib/i18n";
import { liveLabels } from "@/lib/i18n/live";

const NOTE_LABEL = liveLabels(() => tr().releaseNote);
const NOTE_TONE = { new_feature: "accent", improvement: "neutral", bug_fix: "warning" } as const;

export function ReleaseNotes({ notes }: { notes: WhatsNewNoteResponse[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((n) => (
        <li key={n.id} className="flex items-start gap-2 text-[13px] leading-relaxed">
          <Badge tone={NOTE_TONE[n.type]} className="mt-0.5 shrink-0">{NOTE_LABEL[n.type]}</Badge>
          <span>{n.content}</span>
        </li>
      ))}
    </ul>
  );
}
