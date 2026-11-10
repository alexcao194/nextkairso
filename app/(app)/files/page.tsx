"use client";

import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { FileManager } from "@/components/files/FileManager";

export default function FilesPage() {
  return (
    <>
      <TopBar><Breadcrumb items={[{ label: "Tài liệu" }]} /><TopBarSpacer /></TopBar>
      <div className="min-h-0 flex-1">
        <FileManager />
      </div>
    </>
  );
}
