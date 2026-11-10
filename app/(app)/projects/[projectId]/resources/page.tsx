"use client";

import { use } from "react";
import { useWorkspace } from "@/lib/workspace/WorkspaceContext";
import { ResourcePanel } from "@/components/kairso/ResourcePanel";

export default function ProjectResourcesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { workspaceId } = useWorkspace();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] p-5">
        <ResourcePanel scope={{ ws: workspaceId, projectId }} />
      </div>
    </div>
  );
}
