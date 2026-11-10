import { requestBlob } from "@/lib/api/http";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const fileLabel = (month: string) => month.replace("/", "-");

export async function exportOneKpiExcel(workspaceId: string, month: string, memberId: string, alias?: string) {
  const blob = await requestBlob("GET", `/v1/workspaces/${workspaceId}/kpi/export`, { query: { month, memberId } });
  triggerDownload(blob, `KPI_${alias || memberId}_${fileLabel(month)}.xlsx`);
}

export async function exportGroupKpiExcel(workspaceId: string, month: string) {
  const blob = await requestBlob("GET", `/v1/workspaces/${workspaceId}/kpi/export`, { query: { month } });
  triggerDownload(blob, `KPI_${fileLabel(month)}.xlsx`);
}
