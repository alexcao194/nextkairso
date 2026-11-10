import type { ComponentProps } from "react";
import rehypeSanitize from "rehype-sanitize";
import { MENTION_HREF_PREFIX } from "@/lib/domain/mention";

export const MD_REHYPE_PLUGINS = [rehypeSanitize];

export const MD_COMPONENTS = {
  a: ({ node: _node, ...props }: ComponentProps<"a"> & { node?: unknown }) =>
    props.href?.startsWith(MENTION_HREF_PREFIX) ? (
      <span className="rounded bg-accent-soft px-1 font-medium text-accent-ink">{props.children}</span>
    ) : props.href?.startsWith("#") ? (
      <a {...props} />
    ) : (
      <a {...props} target="_blank" rel="noopener noreferrer" />
    ),
};
