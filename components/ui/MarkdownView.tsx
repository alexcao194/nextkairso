"use client";

import dynamic from "next/dynamic";
import { useColorMode } from "@/lib/hooks/useColorMode";
import { Skeleton } from "./feedback";
import { MD_COMPONENTS, MD_REHYPE_PLUGINS } from "./markdown";

const Preview = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default.Markdown), {
  ssr: false,
  loading: () => <Skeleton className="h-16 w-full" />,
});

export function MarkdownView({ source, placeholder, className = "" }: { source?: string; placeholder?: string; className?: string }) {
  const mode = useColorMode();
  if (!source?.trim()) return placeholder ? <p className="text-[13px] text-ink-placeholder">{placeholder}</p> : null;
  return (
    <div className={`kairso-md ${className}`} data-color-mode={mode}>
      <Preview source={source} rehypePlugins={MD_REHYPE_PLUGINS} components={MD_COMPONENTS} />
    </div>
  );
}
