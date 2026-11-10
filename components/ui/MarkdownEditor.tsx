"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getExtraCommands, type ICommand } from "@uiw/react-md-editor/commands";
import { IconSave } from "@/components/icons";
import { useColorMode } from "@/lib/hooks/useColorMode";
import { Skeleton } from "./feedback";
import { MD_COMPONENTS, MD_REHYPE_PLUGINS } from "./markdown";
import { useImagePaste } from "./useImagePaste";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
});

const saveCommand = (onSubmit: () => void): ICommand => ({
  name: "save",
  keyCommand: "save",
  value: "save",
  buttonProps: { "aria-label": "Lưu", title: "Lưu (Ctrl/⌘+Enter)" },
  icon: <IconSave size={12} />,
  execute: () => onSubmit(),
});

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder,
  height = 240,
  autoFocus,
  onSubmit,
  onUploadImage,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  height?: number;
  autoFocus?: boolean;
  onSubmit?: () => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const mode = useColorMode();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const { handlers: pasteHandlers } = useImagePaste(value, onChange, onUploadImage);

  return (
    <div
      className="kairso-md kairso-md-editor"
      data-color-mode={mode}
      onKeyDown={(e) => {
        if (onSubmit && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmit();
        }
      }}
    >
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        minHeight={120}
        preview={narrow ? "edit" : "live"}
        visibleDragbar={false}
        autoFocus={autoFocus}
        textareaProps={{
          placeholder,
          "aria-label": label,
          ...pasteHandlers,
        }}
        previewOptions={{ rehypePlugins: MD_REHYPE_PLUGINS, components: MD_COMPONENTS }}
        extraCommands={onSubmit ? [...getExtraCommands(), saveCommand(onSubmit)] : getExtraCommands()}
      />
    </div>
  );
}
