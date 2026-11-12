"use client";

import { TopBar, TopBarSpacer } from "@/components/shell/TopBar";
import { Breadcrumb } from "@/components/shell/Breadcrumb";
import { FileManager } from "@/components/files/FileManager";
import { tr } from "@/lib/i18n";

export default function FilesPage() {
  return (
    <>
      <TopBar><Breadcrumb items={[{ label: tr().ui.files }]} /><TopBarSpacer /></TopBar>
      <div className="min-h-0 flex-1">
        <FileManager />
      </div>
    </>
  );
}
