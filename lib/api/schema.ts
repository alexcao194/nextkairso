/* eslint-disable */

export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AddProjectMemberRequest {
  role: ProjectRole;
  userId: string;
}

export interface AssignTaskFaultHolderRequest {
  weight: number;
}

export interface AssignTaskWorkerRequest {
  weight: number;
}

export interface AttendanceCheckRequest {
  latitude: number;
  longitude: number;
  recordedAt?: string;
  wifiBSSID: string;
  wifiSSID?: string;
}

export interface AttendanceCorrectionRequestResponse {
  checkInAt?: string;
  checkOutAt?: string;
  createdAt: string;
  decidedAt?: string;
  decidedByAlias?: string;
  decidedById?: string;
  decidedByName?: string;
  id: string;
  memberAlias?: string;
  memberAvatar?: string;
  memberId: string;
  memberName?: string;
  originalCheckInAt?: string;
  originalCheckOutAt?: string;
  reason: string;
  resultCheckInRecordId?: string;
  resultCheckOutRecordId?: string;
  status: AttendanceCorrectionStatus;
  targetCheckInRecordId?: string;
  targetCheckOutRecordId?: string;
  updatedAt: string;
  workspaceId: string;
}

export type AttendanceCorrectionStatus = "pending" | "approved" | "rejected";

export interface AttendanceHalfEdit {
  enabled: boolean;
  recordId?: string;
  recordedAt?: string;
}

export interface AttendanceRecordResponse {
  createdAt: string;
  distanceMeters: number;
  id: string;
  latitude: number;
  longitude: number;
  memberAlias?: string;
  memberAvatar?: string;
  memberId: string;
  memberName?: string;
  recordedAt: string;
  type: AttendanceType;
  updatedAt: string;
  wifiBSSID: string;
  wifiSSID?: string;
  workspaceId: string;
}

export interface AttendanceSessionResponse {
  checkIn?: AttendanceRecordResponse;
  checkOut?: AttendanceRecordResponse;
}

export interface AttendanceSettingResponse {
  allowedRadiusMeters: number;
  companyLatitude: number;
  companyLongitude: number;
  companyWifiBSSID: string;
  companyWifiSSID?: string;
  createdAt: string;
  updatedAt: string;
  validationEnabled: boolean;
  workspaceId: string;
}

export interface AttendanceStatisticsMemberResponse {
  attendanceHours: number;
  earlyLeaveDays: number;
  estimatedTaskHours: number;
  feedbackEstimate: number;
  initiativeEstimate: number;
  lateDays: number;
  lateLogEstimate: number;
  memberAlias: string;
  memberAvatar?: string;
  memberId: string;
  memberName: string;
  registeredHours: number;
}

export interface AttendanceStatisticsSummaryResponse {
  label: string;
  members: AttendanceStatisticsMemberResponse[];
  month?: string;
  period: string;
  totals: AttendanceStatisticsTotalsResponse;
  workspaceId?: string;
}

export interface AttendanceStatisticsTotalsResponse {
  attendanceHours: number;
  earlyLeaveDays: number;
  estimatedTaskHours: number;
  feedbackEstimate: number;
  initiativeEstimate: number;
  lateDays: number;
  lateLogEstimate: number;
  registeredHours: number;
}

export interface AttendanceStatusResponse {
  distanceMeters: number;
  isConfigured: boolean;
  nextAction: AttendanceType;
  valid: boolean;
  validationMsg?: string;
}

export type AttendanceType = "check_in" | "check_out";

export interface AttitudeKPIDetail {
  comment?: string;
  kpi: number;
  score: number;
}

export interface AttitudeResponse {
  comment?: string;
  memberAlias: string;
  memberAvatar?: string;
  memberId: string;
  memberName: string;
  month: string;
  score: number;
  updatedAt: string;
  updatedById?: string;
}

export interface AuthUserResponse {
  alias: string;
  avatar?: string;
  createdAt: string;
  email?: string;
  emailVerified: boolean;
  id: string;
  name: string;
  updatedAt: string;
}

export interface BeneficiaryRequest {
  userId: string;
  weight: number;
}

export interface BeneficiaryResponse {
  alias: string;
  avatar?: string;
  id: string;
  name: string;
  weight: number;
}

export interface CalendarDayResponse {
  date: string;
  events: CalendarEventResponse[];
  memberAlias?: string;
  memberAvatar?: string;
  memberId: string;
  memberName?: string;
  schedule?: CalendarScheduleInfo;
  sessions?: CalendarSessionInfo[];
  workspaceId: string;
}

export interface CalendarEventCheckInfo {
  distanceMeters: number;
  id: string;
  recordedAt: string;
}

export interface CalendarEventResponse {
  data?: Record<string, unknown>;
  endAt?: string;
  id: string;
  startAt: string;
  title: string;
  type: string;
}

export interface CalendarScheduleInfo {
  id: string;
  registeredByAlias?: string;
  registeredByAvatar?: string;
  registeredById?: string;
  registeredByName?: string;
  sessions: CalendarScheduleSession[];
  status?: string;
}

export interface CalendarScheduleSession {
  endAt: string;
  id: string;
  startAt: string;
}

export interface CalendarSessionInfo {
  checkIn?: CalendarEventCheckInfo;
  checkOut?: CalendarEventCheckInfo;
}

export interface CreateFeedbackRequest {
  beneficiaries: BeneficiaryRequest[];
  content: string;
  estimate: number;
  feedbackText: string;
}

export interface CreateFileRequest {
  contentType: string;
  folderId: string;
  isPublic: boolean;
  name: string;
  objectName: string;
  sizeBytes: number;
}

export interface CreateFolderRequest {
  isPublic: boolean;
  name: string;
  parentId: string;
}

export interface CreateInitiativeRequest {
  content: string;
  earliestApprovalDate?: string;
  estimate: number;
  refMemberId: string;
}

export interface CreateLateLogRequest {
  content: string;
  estimate: number;
  lateTime: string;
  lateUserId: string;
}

export interface CreateMeetingMinutesRequest {
  attendees: MeetingParticipant[];
  items: MeetingItem[];
  location: string;
  meetingDate: string;
  projectId?: string;
  recorders: MeetingParticipant[];
  sectionNotes: Record<string, string>;
  summary: string;
  title: string;
}

export interface CreateModuleAttachmentRequest {
  contentType?: string;
  fileName: string;
  fileUrl: string;
  sizeBytes?: number;
}

export interface CreateModuleRequest {
  endDate?: string;
  name: string;
  startDate?: string;
}

export interface CreateModuleSprintRequest {
  endDate?: string;
  goal?: string;
  name?: string;
  startDate?: string;
}

export interface CreatePresignedUploadURLRequest {
  contentType: string;
  filename: string;
  kind: string;
  owner?: string;
}

export interface CreateProjectFeedbackRequest {
  content: string;
  featureName: string;
  feedbackType: string;
  images?: string[];
  priority?: number;
  submitterCompany: string;
  submitterName: string;
}

export interface CreateProjectFileRequest {
  contentType: string;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  title: string;
}

export interface CreateProjectLinkRequest {
  title: string;
  url: string;
}

export interface CreateProjectNoteRequest {
  content: string;
  title: string;
}

export interface CreateProjectRequest {
  name: string;
}

export interface CreateTaskAttachmentRequest {
  contentType?: string;
  fileName: string;
  fileUrl: string;
  sizeBytes?: number;
}

export interface CreateTaskCommentAttachment {
  contentType?: string;
  fileName: string;
  fileUrl: string;
  sizeBytes?: number;
}

export interface CreateTaskCommentRequest {
  attachments?: CreateTaskCommentAttachment[];
  content: string;
}

export interface CreateTaskLabelRequest {
  color: string;
  name: string;
}

export interface CreateTaskRequest {
  archived: boolean;
  description?: string;
  endDate?: string;
  estimation: number;
  faultHolderId?: string;
  moduleId?: string;
  parentId?: string;
  priority?: number;
  startDate?: string;
  status: TaskStatus;
  title: string;
}

export interface CreateVersionRequest {
  contentType: string;
  objectName: string;
  sizeBytes: number;
}

export interface CreateWorkspaceFileRequest {
  contentType: string;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  title: string;
}

export interface CreateWorkspaceLinkRequest {
  title: string;
  url: string;
}

export interface CreateWorkspaceNoteRequest {
  content: string;
  title: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface CustomerKPIDetail {
  kpi: number;
  rawEstimate: number;
  score: number;
}

export interface DailyReportResponse {
  createdAt: string;
  date: string;
  done: string;
  id: string;
  inProgress: string;
  issues: string;
  memberAlias?: string;
  memberAvatar?: string;
  memberId: string;
  memberName?: string;
  updatedAt: string;
  workspaceId: string;
}

export interface ErrorResponse {
  error?: string;
}

export interface FeedbackListStats {
  totalCount: number;
}

export interface FeedbackResponse {
  beneficiaries: BeneficiaryResponse[];
  content: string;
  createdAt: string;
  creator: ProposerResponse;
  estimate: number;
  feedbackText: string;
  id: string;
  updatedAt: string;
  workspaceId: string;
}

export interface FeedbackSettingsResponse {
  enabled: boolean;
  showModuleTimeline: boolean;
  token?: string;
}

export type FeedbackStatus = "pending" | "discussing" | "acknowledged" | "in_progress" | "resolved" | "deployed" | "canceled";

export interface FeedbackSummaryResponse {
  pendingCount: number;
}

export type FeedbackType = "feature" | "improvement" | "bug";

export interface FileResponse {
  contentType: string;
  createdAt: string;
  folderId?: string;
  id: string;
  isPublic: boolean;
  name: string;
  sizeBytes: number;
  updatedAt: string;
  url: string;
}

export interface FileSettingsResponse {
  allowedTypes: string;
  maxFileSizeMb: number;
}

export interface FileVersionResponse {
  contentType: string;
  createdAt: string;
  id: string;
  sizeBytes: number;
  url: string;
}

export interface FirebaseLoginRequest {
  idToken: string;
}

export interface FolderResponse {
  createdAt: string;
  id: string;
  isPublic: boolean;
  kind: string;
  locked: boolean;
  moduleId?: string;
  name: string;
  parentId?: string;
  projectId?: string;
}

export interface HistoryChangedBy {
  alias: string;
  avatar?: string;
  id: string;
  name: string;
}

export interface InitiativeKPIDetail {
  kpi: number;
  rawEstimate: number;
  score: number;
}

export interface InitiativeResponse {
  approvedAt?: string;
  changesAfter?: string;
  content: string;
  createdAt: string;
  earliestApprovalDate?: string;
  estimate: number;
  id: string;
  proposer: ProposerResponse;
  refMember: ProposerResponse;
  status: InitiativeStatus;
  updatedAt: string;
  workspaceId: string;
}

export type InitiativeStatus = "proposed" | "in_progress" | "accepted" | "rejected";

export interface InviteMemberRequest {
  role: WorkspaceRole;
  userAlias: string;
}

export interface KPIMemberResponse {
  attitude: AttitudeKPIDetail;
  customer: CustomerKPIDetail;
  initiative: InitiativeKPIDetail;
  label: string;
  memberAlias: string;
  memberAvatar?: string;
  memberId: string;
  memberName: string;
  period: string;
  progress: ProgressKPIDetail;
  punctuality: PunctualityKPIDetail;
  quality: QualityKPIDetail;
  totalKpi: number;
}

export interface KPISettingsResponse {
  attitudeWeight: number;
  customerWeight: number;
  initiativeWeight: number;
  progressWeight: number;
  punctualityWeight: number;
  qualityWeight: number;
  updatedAt: string;
  workspaceId: string;
}

export interface LateLogResponse {
  content: string;
  createdAt: string;
  creator: ProposerResponse;
  estimate: number;
  id: string;
  lateTime: string;
  lateUser: LateUserResponse;
  updatedAt: string;
  workspaceId: string;
}

export interface LateUserResponse {
  alias: string;
  avatar?: string;
  id: string;
  name: string;
}

export interface LinkedTaskSummary {
  code: string;
  status: string;
}

export interface ListProjectMembersResponse {
  availableMembers?: ProjectAvailableMemberResponse[];
  hasMore: boolean;
  items: ProjectMemberResponse[];
  limit: number;
  page: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}

export interface MeetingCreator {
  alias: string;
  avatar: string;
  id: string;
  name: string;
}

export interface MeetingItem {
  content: string;
  id: string;
  module: string;
  note: string;
  priority: boolean;
  section: "deployed" | "planned" | "backlog";
  status: "open" | "done";
  tasks: MeetingTaskRef[];
}

export type MeetingItemStatus = "open" | "done";

export interface MeetingMinutesResponse {
  attendees: MeetingParticipant[];
  createdAt: string;
  createdBy: MeetingCreator;
  id: string;
  items: MeetingItem[];
  location: string;
  meetingDate: string;
  projectId?: string;
  recorders: MeetingParticipant[];
  sectionNotes: Record<string, string>;
  summary: string;
  title: string;
  updatedAt: string;
  workspaceId: string;
}

export interface MeetingParticipant {
  kind: "user" | "group";
  name: string;
  userId?: string;
}

export type MeetingSection = "deployed" | "planned" | "backlog";

export interface MeetingTaskRef {
  code: string;
  id: string;
}

export interface MemberCalendarDay {
  date: string;
  schedule?: CalendarScheduleInfo;
  sessions?: CalendarSessionInfo[];
}

export interface MemberCalendarResponse {
  days: MemberCalendarDay[];
  memberAlias: string;
  memberAvatar?: string;
  memberId: string;
  memberName: string;
}

export interface MemberTaskBreakdownResponse {
  bugTasks: MemberTaskBrief[];
  completedLateTasks: MemberTaskBrief[];
  label: string;
  memberId: string;
  month: string;
  overdueTasks: MemberTaskBrief[];
  reworkTasks: MemberTaskBrief[];
}

export interface MemberTaskBrief {
  code: string;
  endDate?: string;
  estimation: number;
  firstCompletedAt?: string;
  id: string;
  priority: number;
  projectId: string;
  projectName: string;
  returnCount: number;
  startDate?: string;
  status: string;
  title: string;
}

export interface ModuleAttachmentResponse {
  contentType?: string;
  createdAt: string;
  fileName: string;
  fileUrl: string;
  id: string;
  moduleId: string;
  sizeBytes?: number;
  uploaderAlias?: string;
  uploaderId: string;
  uploaderName?: string;
}

export interface ModuleHistoryResponse {
  changedBy: HistoryChangedBy;
  changedById: string;
  createdAt: string;
  field: string;
  id: string;
  moduleId: string;
  newValue?: string;
  oldValue?: string;
}

export interface ModuleResponse {
  attachmentCount: number;
  createdAt: string;
  endDate?: string;
  id: string;
  name: string;
  projectId: string;
  releasedAt?: string;
  sprints: ModuleSprintResponse[];
  startDate?: string;
  status: "backlog" | "in_progress" | "done" | "released";
  taskCount: number;
  totalEstimation: number;
  updatedAt: string;
}

export interface ModuleSprintResponse {
  createdAt: string;
  endDate: string;
  goal: string;
  id: string;
  moduleId: string;
  name: string;
  retroNote: string;
  reviewNote: string;
  startDate: string;
  status: "planned" | "active" | "completed";
  updatedAt: string;
}

export type ModuleStatus = "backlog" | "in_progress" | "done" | "released";

export interface MyAttendanceStatisticsResponse {
  attendanceHours: number;
  earlyLeaveDays: number;
  estimatedTaskHours: number;
  feedbackEstimate: number;
  initiativeEstimate: number;
  label: string;
  lateDays: number;
  lateLogEstimate: number;
  memberAlias: string;
  memberAvatar?: string;
  memberId: string;
  memberName: string;
  month?: string;
  period: string;
  registeredHours: number;
  workspaceId?: string;
}

export interface MyTaskStatisticsResponse {
  backlog: number;
  canceled: number;
  done: number;
  inProgress: number;
  label?: string;
  memberAlias: string;
  memberAvatar?: string;
  memberId: string;
  memberName: string;
  moduleId?: string;
  period?: string;
  priority1: number;
  priority2: number;
  priority3: number;
  priority4: number;
  projectId?: string;
  review: number;
  todo: number;
  totalBug: number;
  totalEstimatedTaskHours: number;
  totalEstimation: number;
  totalLate: number;
  totalOverdue: number;
  totalTasks: number;
}

export interface MyTasksCountResponse {
  count: number;
}

export interface NoteCreator {
  alias: string;
  avatar?: string;
  id: string;
  name: string;
}

export interface NotificationResponse {
  body: string;
  createdAt: string;
  data: Record<string, string>;
  id: string;
  readAt?: string;
  title: string;
  updatedAt: string;
  userId: string;
  workspaceId: string;
}

export type ParticipantKind = "user" | "group";

export interface PresignUploadRequest {
  contentType: string;
  filename: string;
  sizeBytes: number;
}

export interface PresignUploadResponse {
  expiresAt: string;
  fileUrl: string;
  method: string;
  objectName: string;
  uploadUrl: string;
}

export interface PresignedUploadURLResponse {
  expiresAt: string;
  fileUrl: string;
  method: string;
  objectName: string;
  uploadUrl: string;
}

export interface ProgressKPIDetail {
  kpi: number;
  lateRatio: number;
  lateWorkerEstimation: number;
  totalWorkerEstimationReviewedDone: number;
}

export interface ProjectAvailableMemberResponse {
  userAlias: string;
  userAvatar?: string;
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceRole: ProjectRole;
}

export interface ProjectFeedbackListResponse {
  hasMore?: boolean;
  items?: ProjectFeedbackResponse[];
  limit?: number;
  page?: number;
  stats: FeedbackListStats;
}

export interface ProjectFeedbackResponse {
  code: string;
  content: string;
  createdAt: string;
  expectedFixDate?: string;
  featureName: string;
  feedbackType: FeedbackType;
  id: string;
  images: string[];
  priority: number;
  projectId: string;
  respondedAt?: string;
  respondedBy?: UserSummary;
  response?: string;
  status: FeedbackStatus;
  submitterCompany: string;
  submitterName: string;
  tasks: LinkedTaskSummary[];
}

export interface ProjectFileResponse {
  contentType: string;
  createdAt: string;
  createdBy: NoteCreator;
  fileName: string;
  fileUrl: string;
  id: string;
  projectId: string;
  sizeBytes: number;
  title: string;
  updatedAt: string;
}

export interface ProjectHistoryResponse {
  changedBy: HistoryChangedBy;
  createdAt: string;
  field: string;
  id: string;
  newValue?: string;
  oldValue?: string;
}

export interface ProjectLinkResponse {
  createdAt: string;
  createdBy: NoteCreator;
  id: string;
  projectId: string;
  title: string;
  updatedAt: string;
  url: string;
}

export interface ProjectMemberResponse {
  projectId: string;
  role: ProjectRole;
  userAlias: string;
  userAvatar?: string;
  userId: string;
  userName: string;
}

export interface ProjectNoteResponse {
  content: string;
  createdAt: string;
  createdBy: NoteCreator;
  id: string;
  projectId: string;
  title: string;
  updatedAt: string;
}

export interface ProjectOverviewResponse {
  memberCount: number;
  moduleCount: number;
  project: ProjectResponse;
  taskCount: number;
  taskStatusCounts: ProjectTaskStatusCounts;
}

export interface ProjectOverviewsByIDsResponse {
  items: ProjectOverviewResponse[];
}

export interface ProjectResponse {
  avatar?: string;
  createdAt: string;
  id: string;
  name: string;
  taskCount: number;
  totalEstimation: number;
  updatedAt: string;
  workspaceId: string;
}

export type ProjectRole = "holder" | "admin" | "member";

export interface ProjectTaskStatusCounts {
  backlog: number;
  canceled: number;
  done: number;
  inProgress: number;
  review: number;
  todo: number;
}

export interface ProposerResponse {
  alias: string;
  avatar?: string;
  id: string;
  name: string;
}

export interface PublicModuleResponse {
  endDate?: string;
  name: string;
  releasedAt?: string;
  sprints: PublicSprintResponse[];
  startDate?: string;
  status: "backlog" | "in_progress" | "done" | "released";
}

export interface PublicProjectResponse {
  enabled: boolean;
  projectName: string;
  showModuleTimeline: boolean;
}

export interface PublicSprintResponse {
  endDate: string;
  name: string;
  startDate: string;
  status: "planned" | "active" | "completed";
}

export interface PublicUploadRequest {
  contentType: string;
  filename: string;
}

export interface PublicUploadResponse {
  expiresAt: string;
  fileUrl: string;
  method: string;
  uploadUrl: string;
}

export interface PunctualityKPIDetail {
  deduction: number;
  earlyLeaveDays: number;
  kpi: number;
  lateDays: number;
  rawEstimate: number;
}

export interface QualityKPIDetail {
  kpi: number;
  ratio: number;
  totalBugEstimation: number;
  totalReturnEstimation: number;
  totalWorkerEstimation: number;
}

export interface ReadNotificationsRequest {
  ids: string[];
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface SetAttitudeRequest {
  comment?: string;
  memberId: string;
  month: string;
  score: number;
}

export type SprintStatus = "planned" | "active" | "completed";

export interface SubmitAttendanceCorrectionRequest {
  checkInAt?: string;
  checkOutAt?: string;
  reason: string;
  targetCheckInRecordId?: string;
  targetCheckOutRecordId?: string;
}

export interface TaskAttachmentResponse {
  contentType?: string;
  createdAt: string;
  fileName: string;
  fileUrl: string;
  id: string;
  sizeBytes?: number;
  taskId: string;
  uploaderAlias?: string;
  uploaderId: string;
  uploaderName?: string;
}

export interface TaskCommentAttachmentResponse {
  commentId: string;
  contentType?: string;
  createdAt: string;
  fileName: string;
  fileUrl: string;
  id: string;
  sizeBytes?: number;
  uploaderId: string;
}

export interface TaskCommentResponse {
  attachments?: TaskCommentAttachmentResponse[];
  authorAlias?: string;
  authorAvatar?: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt: string;
  id: string;
  mentionedUserIds?: string[];
  taskId: string;
  updatedAt: string;
}

export interface TaskFaultHolderResponse {
  taskId: string;
  user: UserSummary;
  weight: number;
}

export interface TaskHistoryResponse {
  changedBy: HistoryChangedBy;
  createdAt: string;
  field: string;
  id: string;
  newValue?: string;
  oldValue?: string;
}

export interface TaskLabelResponse {
  color: string;
  createdAt: string;
  createdById: string;
  id: string;
  name: string;
  projectId: string;
  updatedAt: string;
}

export interface TaskLabelsByProjectIDsResponse {
  items: TaskLabelResponse[];
}

export interface TaskListResponse {
  hasMore?: boolean;
  items?: TaskResponse[];
  limit?: number;
  page?: number;
  stats: TaskListStats;
}

export interface TaskListStats {
  totalCount: number;
  totalEstimation: number;
}

export interface TaskResponse {
  archived: boolean;
  code: string;
  createdAt: string;
  createdById: string;
  description?: string;
  endDate?: string;
  estimation: number;
  faultHolderId?: string;
  faultHolders: TaskFaultHolderResponse[];
  firstCompletedAt?: string;
  id: string;
  labels: TaskLabelResponse[];
  linkedFeedbackCount: number;
  moduleId?: string;
  parentId?: string;
  priority: number;
  projectId: string;
  returnCount: number;
  sequenceNo: number;
  startDate?: string;
  status: TaskStatus;
  title: string;
  unreadCommentCount: number;
  updatedAt: string;
  workers: TaskWorkerResponse[];
}

export interface TaskStatisticsSummaryResponse {
  label?: string;
  members: TaskStatsMemberResponse[];
  moduleId?: string;
  period?: string;
  projectId?: string;
  totals: TaskStatsTotalsResponse;
}

export interface TaskStatsMemberResponse {
  backlog: number;
  canceled: number;
  done: number;
  inProgress: number;
  memberAlias: string;
  memberAvatar?: string;
  memberId: string;
  memberName: string;
  priority1: number;
  priority2: number;
  priority3: number;
  priority4: number;
  review: number;
  todo: number;
  totalBug: number;
  totalEstimatedTaskHours: number;
  totalEstimation: number;
  totalLate: number;
  totalOverdue: number;
  totalTasks: number;
}

export interface TaskStatsTotalsResponse {
  avgCycleDays: number;
  backlog: number;
  canceled: number;
  cycleTimeSampleSize: number;
  done: number;
  inProgress: number;
  priority1: number;
  priority2: number;
  priority3: number;
  priority4: number;
  review: number;
  todo: number;
  totalBug: number;
  totalEstimatedTaskHours: number;
  totalEstimation: number;
  totalLate: number;
  totalOverdue: number;
  totalTasks: number;
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "canceled";

export interface TaskWorkerResponse {
  taskId: string;
  user: UserSummary;
  weight: number;
}

export interface ThreadLatestCommentResponse {
  authorAlias: string;
  authorAvatar?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ThreadResponse {
  archived?: boolean;
  code?: string;
  createdAt?: string;
  createdById?: string;
  description?: string;
  endDate?: string;
  estimation?: number;
  faultHolderId?: string;
  faultHolders?: TaskFaultHolderResponse[];
  firstCompletedAt?: string;
  id?: string;
  labels?: TaskLabelResponse[];
  latestComment?: ThreadLatestCommentResponse;
  linkedFeedbackCount?: number;
  mentioned: boolean;
  moduleId?: string;
  parentId?: string;
  priority?: number;
  projectId?: string;
  returnCount?: number;
  sequenceNo?: number;
  startDate?: string;
  status?: TaskStatus;
  title?: string;
  unreadCommentCount?: number;
  updatedAt?: string;
  workers?: TaskWorkerResponse[];
}

export interface ThreadsCountResponse {
  count: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TreeNode {
  children: TreeNode[];
  createdAt?: string;
  files: FileResponse[];
  id?: string;
  isPublic?: boolean;
  kind?: string;
  locked?: boolean;
  moduleId?: string;
  name?: string;
  parentId?: string;
  projectId?: string;
}

export interface TreeResponse {
  folders: TreeNode[];
  rootFiles: FileResponse[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface UpdateFeedbackRequest {
  beneficiaries?: BeneficiaryRequest[];
  content?: string;
  estimate?: number;
  feedbackText?: string;
}

export interface UpdateFeedbackResponseRequest {
  expectedFixDate?: string;
  response: string;
}

export interface UpdateFeedbackSettingsRequest {
  showModuleTimeline?: boolean;
}

export interface UpdateFeedbackStatusRequest {
  status: FeedbackStatus;
}

export interface UpdateFileRequest {
  folderId?: string;
  isPublic?: boolean;
  name?: string;
}

export interface UpdateFolderRequest {
  isPublic?: boolean;
  name?: string;
  parentId?: string;
}

export interface UpdateInitiativeRequest {
  changesAfter?: string;
  content?: string;
  earliestApprovalDate?: string;
  estimate?: number;
  refMemberId?: string;
  status?: InitiativeStatus;
}

export interface UpdateLateLogRequest {
  content?: string;
  estimate?: number;
  lateTime?: string;
}

export interface UpdateMeRequest {
  alias?: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  name?: string;
  nickname?: string;
  phone?: string;
}

export interface UpdateMeetingMinutesRequest {
  attendees?: MeetingParticipant[];
  items?: MeetingItem[];
  location?: string;
  meetingDate?: string;
  recorders?: MeetingParticipant[];
  sectionNotes?: Record<string, string>;
  summary?: string;
  title?: string;
}

export interface UpdateMemberRoleRequest {
  role: WorkspaceRole;
}

export interface UpdateModuleRequest {
  endDate?: string;
  name?: string;
  startDate?: string;
  status?: "backlog" | "in_progress" | "done" | "released";
}

export interface UpdateModuleSprintRequest {
  endDate?: string;
  goal?: string;
  name?: string;
  retroNote?: string;
  reviewNote?: string;
  startDate?: string;
  status?: "planned" | "active" | "completed";
}

export interface UpdateProjectFeedbackRequest {
  content: string;
  featureName: string;
  feedbackType: string;
  images?: string[];
  priority?: number;
  submitterCompany: string;
  submitterName: string;
}

export interface UpdateProjectLinkRequest {
  title?: string;
  url?: string;
}

export interface UpdateProjectMemberRoleRequest {
  role: ProjectRole;
}

export interface UpdateProjectNoteRequest {
  content?: string;
  title?: string;
}

export interface UpdateProjectRequest {
  avatar?: string;
  name?: string;
}

export interface UpdateTaskCommentRequest {
  content: string;
}

export interface UpdateTaskLabelRequest {
  color: string;
  name: string;
}

export interface UpdateTaskRequest {
  archived?: boolean;
  description?: string;
  endDate?: string;
  estimation?: number;
  faultHolderId?: string;
  moduleId?: string;
  parentId?: string;
  priority?: number;
  returnCount?: number;
  startDate?: string;
  status?: TaskStatus;
  title?: string;
}

export interface UpdateWorkScheduleStatusRequest {
  dayIds: string[];
}

export interface UpdateWorkspaceNoteRequest {
  content?: string;
  title?: string;
}

export interface UpdateWorkspaceRequest {
  avatar?: string;
  name?: string;
}

export interface UpsertAttendanceSessionRequest {
  checkIn: AttendanceHalfEdit;
  checkOut: AttendanceHalfEdit;
  memberId: string;
}

export interface UpsertAttendanceSettingRequest {
  allowedRadiusMeters: number;
  companyLatitude: number;
  companyLongitude: number;
  companyWifiBSSID: string;
  companyWifiSSID?: string;
  validationEnabled: boolean;
}

export interface UpsertDailyReportRequest {
  date: string;
  done: string;
  inProgress: string;
  issues: string;
}

export interface UpsertFileSettingsRequest {
  allowedTypes: string;
  maxFileSizeMb: number;
}

export interface UpsertKPISettingsRequest {
  attitudeWeight: number;
  customerWeight: number;
  initiativeWeight: number;
  progressWeight: number;
  punctualityWeight: number;
  qualityWeight: number;
}

export interface UpsertMemberWorkSchedulesRequest {
  schedules: UpsertWorkScheduleRequest[];
  weekNote?: string;
}

export interface UpsertWorkScheduleRequest {
  date: string;
  note?: string;
  sessions: WorkScheduleSessionRequest[];
}

export interface UpsertWorkSchedulesRequest {
  schedules: UpsertWorkScheduleRequest[];
  weekNote?: string;
}

export interface UpsertWorkWeekRequest {
  days: WorkWeekDayRequest[];
}

export interface UserResponse {
  alias: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  createdAt: string;
  email?: string;
  emailVerified: boolean;
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  updatedAt: string;
}

export interface UserSummary {
  alias: string;
  avatar?: string;
  id: string;
  name: string;
}

export interface WhatsNewNoteResponse {
  content: string;
  id: string;
  type: WhatsNewNoteType;
}

export type WhatsNewNoteType = "new_feature" | "improvement" | "bug_fix";

export interface WhatsNewReleaseResponse {
  id: string;
  notes: WhatsNewNoteResponse[];
  publishedAt: string;
  version: string;
}

export interface WorkScheduleDayResponse {
  createdAt: string;
  date: string;
  id: string;
  memberAlias?: string;
  memberAvatar?: string;
  memberId: string;
  memberName?: string;
  note?: string;
  registeredByAlias?: string;
  registeredByAvatar?: string;
  registeredById?: string;
  registeredByName?: string;
  sessions: WorkScheduleSessionResponse[];
  status?: WorkScheduleStatus;
  updatedAt: string;
  weekNote?: string;
  workspaceId: string;
}

export interface WorkScheduleSessionRequest {
  endAt: string;
  startAt: string;
}

export interface WorkScheduleSessionResponse {
  createdAt?: string;
  dayId?: string;
  endAt: string;
  id?: string;
  startAt: string;
  updatedAt?: string;
}

export type WorkScheduleStatus = "pending" | "approved" | "rejected";

export interface WorkWeekDayRequest {
  dayOfWeek: number;
  sessions: WorkWeekSessionRequest[];
}

export interface WorkWeekDayResponse {
  dayOfWeek: number;
  sessions: WorkWeekSessionResponse[];
}

export interface WorkWeekResponse {
  days: WorkWeekDayResponse[];
  workspaceId: string;
}

export interface WorkWeekSessionRequest {
  endTime: string;
  startTime: string;
}

export interface WorkWeekSessionResponse {
  endTime: string;
  startTime: string;
}

export interface WorkspaceFileResponse {
  contentType: string;
  createdAt: string;
  createdBy: NoteCreator;
  fileName: string;
  fileUrl: string;
  id: string;
  sizeBytes: number;
  title: string;
  updatedAt: string;
  workspaceId: string;
}

export interface WorkspaceHistoryResponse {
  changedBy: HistoryChangedBy;
  createdAt: string;
  field: string;
  id: string;
  newValue?: string;
  oldValue?: string;
}

export interface WorkspaceInvitationResponse {
  createdAt: string;
  id: string;
  inviteeId: string;
  inviterId: string;
  role: WorkspaceRole;
  status: string;
  updatedAt: string;
  workspaceId: string;
}

export interface WorkspaceInvitationSummaryResponse {
  createdAt: string;
  id: string;
  inviterAlias: string;
  inviterAvatar?: string;
  inviterId: string;
  inviterName: string;
  role: WorkspaceRole;
  status: string;
  updatedAt: string;
  workspaceId: string;
  workspaceName: string;
}

export interface WorkspaceLinkResponse {
  createdAt: string;
  createdBy: NoteCreator;
  id: string;
  title: string;
  updatedAt: string;
  url: string;
  workspaceId: string;
}

export interface WorkspaceMemberResponse {
  invitationId?: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  userAlias: string;
  userAvatar?: string;
  userId: string;
  userName: string;
  workspaceId: string;
}

export type WorkspaceMemberStatus = "accepted" | "pending";

export interface WorkspaceNoteResponse {
  content: string;
  createdAt: string;
  createdBy: NoteCreator;
  id: string;
  title: string;
  updatedAt: string;
  workspaceId: string;
}

export interface WorkspaceResponse {
  avatar?: string;
  createdAt: string;
  createdById: string;
  id: string;
  name: string;
  updatedAt: string;
}

export type WorkspaceRole = "holder" | "admin" | "member";

