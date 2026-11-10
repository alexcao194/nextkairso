import type { WorkspaceMemberResponse } from "../api/schema";

const MENTION_TOKEN = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g;
const ALIAS_MENTION = /@([a-zA-Z0-9_.\-]+)/g;

const buildMentionToken = (name: string, userId: string) => `@[${name}](${userId})`;

export function expandMentionAliases(text: string, members: WorkspaceMemberResponse[]): string {
  return text.replace(ALIAS_MENTION, (whole, alias: string) => {
    const m = members.find((x) => x.userAlias === alias);
    return m ? buildMentionToken(m.userName, m.userId) : whole;
  });
}

export function collapseMentionTokens(text: string, members: WorkspaceMemberResponse[]): string {
  return text.replace(MENTION_TOKEN, (_w, name: string, userId: string) => {
    const m = members.find((x) => x.userId === userId);
    return `@${m?.userAlias ?? name.replace(/\s+/g, "")}`;
  });
}

type MentionSegment = { text: string; userId?: string };

export function parseMentionSegments(content: string): MentionSegment[] {
  const out: MentionSegment[] = [];
  let last = 0;
  for (const m of content.matchAll(MENTION_TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ text: content.slice(last, start) });
    out.push({ text: `@${m[1]}`, userId: m[2] });
    last = start + m[0].length;
  }
  if (last < content.length) out.push({ text: content.slice(last) });
  return out;
}

export const MENTION_HREF_PREFIX = "#mention-";

export const mentionsToMarkdown = (content: string) =>
  content.replace(MENTION_TOKEN, (_w, name: string, userId: string) => `[@${name.replace(/([\\`*_<>])/g, "\\$1")}](${MENTION_HREF_PREFIX}${userId})`);
