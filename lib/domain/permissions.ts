import type { WorkspaceRole, ProjectRole } from "../api/schema";
import { tr } from "../i18n/dict";
import { liveLabels } from "../i18n/live";

export const ROLE_LABEL: Record<WorkspaceRole | ProjectRole, string> = liveLabels(() => tr().roles);

const ROLE_RANK: Record<WorkspaceRole | ProjectRole, number> = { holder: 3, admin: 2, member: 1 };
export const roleRank = (role: WorkspaceRole | ProjectRole) => ROLE_RANK[role];

export const canManageRole = (
  myRole: WorkspaceRole | ProjectRole | null | undefined,
  targetRole: WorkspaceRole | ProjectRole,
) => !!myRole && roleRank(myRole) >= roleRank(targetRole);
