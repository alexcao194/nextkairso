"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { useToast } from "@/lib/toast/ToastProvider";
import { tr } from "@/lib/i18n";

let uploadSeq = 0;

const isImageFile = (f: File) => f.type.startsWith("image/");

function clipboardImages(data: DataTransfer): File[] {
  const files = [...data.files].filter(isImageFile);
  if (files.length) return files;
  return [...data.items]
    .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
    .map((it) => it.getAsFile())
    .filter((f): f is File => !!f);
}

function namedImage(f: File, i: number): File {
  if (f.name && !/^image\.\w+$/i.test(f.name)) return f;
  const ext = f.type.split("/")[1]?.replace("jpeg", "jpg").replace(/\+.*/, "") || "png";
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return new File([f], `anh-${stamp}${i ? `-${i + 1}` : ""}.${ext}`, { type: f.type });
}

const altText = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[[\]\\]/g, "");
const mdUrl = (url: string) => url.replace(/[ ()]/g, (c) => encodeURIComponent(c));

export function useImagePaste(value: string, onChange: (v: string) => void, upload?: (file: File) => Promise<string>) {
  const toast = useToast();
  const [pending, setPending] = useState(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const emit = (v: string) => ((valueRef.current = v), onChange(v));

  const insert = (area: HTMLTextAreaElement, files: File[]) => {
    if (!upload) return;
    const v = valueRef.current;
    const start = area.selectionStart ?? v.length;
    const end = area.selectionEnd ?? start;
    const items = files.map((f, i) => ({ file: namedImage(f, i), token: `![${tr().ui.uploadingImage(++uploadSeq)}]()` }));
    const before = v.slice(0, start);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const block = `${lead}${items.map((it) => it.token).join("\n")}\n`;
    emit(`${before}${block}${v.slice(end)}`);
    const caret = start + block.length;
    requestAnimationFrame(() => area.setSelectionRange(caret, caret));

    setPending((n) => n + items.length);
    for (const { file, token } of items) {
      upload(file)
        .then((url) => emit(valueRef.current.replace(token, `![${altText(file.name)}](${mdUrl(url)})`)))
        .catch((e) => {
          emit(valueRef.current.replace(`${token}\n`, "").replace(token, ""));
          toast.error(e);
        })
        .finally(() => setPending((n) => n - 1));
    }
  };

  const handlers = upload
    ? {
        onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => {
          if (e.clipboardData.getData("text/plain")) return;
          const imgs = clipboardImages(e.clipboardData);
          if (!imgs.length) return;
          e.preventDefault();
          insert(e.currentTarget, imgs);
        },
        onDrop: (e: DragEvent<HTMLTextAreaElement>) => {
          const imgs = [...e.dataTransfer.files].filter(isImageFile);
          if (!imgs.length) return;
          e.preventDefault();
          insert(e.currentTarget, imgs);
        },
      }
    : {};

  return { handlers, pending };
}
