import { postUploadsPresignedUrl } from "./api/endpoints";

type UploadKind =
  | "user"
  | "project_file"
  | "workspace_file"
  | "task_file"
  | "task_comment_file"
  | "module_file";

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  pdf: "application/pdf", txt: "text/plain", csv: "text/csv", json: "application/json",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
};

export const isImage = (contentType?: string, name?: string) =>
  (contentType ?? EXT_TYPES[(name ?? "").split(".").pop()?.toLowerCase() ?? ""] ?? "").startsWith("image/");

export async function uploadFile(file: File, kind: UploadKind, owner?: string): Promise<UploadedFile> {
  const contentType = file.type || EXT_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""] || "application/octet-stream";
  const presigned = await postUploadsPresignedUrl({ contentType, filename: file.name, kind, owner });
  if (!presigned.uploadUrl || !presigned.fileUrl) throw new Error("Không tạo được đường dẫn tải lên");

  const ascii = file.name.replace(/"/g, "'").replace(/[^\x20-\x7E]/g, "_");
  const res = await fetch(presigned.uploadUrl, {
    method: presigned.method || "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    },
    body: file,
  });
  if (!res.ok) throw new Error(`Tải file lên thất bại (${res.status})`);
  return { fileUrl: presigned.fileUrl, fileName: file.name, contentType, sizeBytes: file.size };
}

export const fmtBytes = (n?: number) =>
  !n ? "" : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
