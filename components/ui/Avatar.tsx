import { avatarColor, initials } from "@/lib/domain/format";
import { tr } from "@/lib/i18n";

const sizeMap = { xs: 18, sm: 22, md: 28, lg: 36, xl: 56 } as const;
const fontMap = { xs: 9, sm: 10, md: 11, lg: 13, xl: 20 } as const;
type AvatarSize = keyof typeof sizeMap;

export interface Person {
  id?: string;
  name?: string | null;
  avatar?: string | null;
}

export function Avatar({
  person,
  size = "sm",
  ring = false,
}: {
  person: Person;
  size?: AvatarSize;
  ring?: boolean;
}) {
  const px = sizeMap[size];
  const name = person.name ?? "";
  const style = { width: px, height: px, boxShadow: ring ? "0 0 0 2px var(--surface)" : undefined };
  if (person.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.avatar} alt="" title={name} style={style} className="inline-block shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ ...style, fontSize: fontMap[size], background: avatarColor(person.id || name) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarPlaceholder({ size = "sm" }: { size?: AvatarSize }) {
  const px = sizeMap[size];
  return (
    <span
      className="inline-flex shrink-0 rounded-full border border-dashed border-line-strong"
      style={{ width: px, height: px }}
      role="img"
      aria-label={tr().ui.unassigned}
    />
  );
}

export function AvatarGroup({ people, max = 3, size = "sm" }: { people: Person[]; max?: number; size?: AvatarSize }) {
  if (people.length === 0) return <AvatarPlaceholder size={size} />;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const px = sizeMap[size];
  return (
    <span className="flex items-center" aria-label={people.map((p) => p.name).join(", ")}>
      {shown.map((p, i) => (
        <span key={p.id ?? i} style={{ marginLeft: i === 0 ? 0 : -6 }}>
          <Avatar person={p} size={size} ring />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-hover text-[10px] font-semibold text-ink-2"
          style={{ width: px, height: px, marginLeft: -6, boxShadow: "0 0 0 2px var(--surface)" }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
