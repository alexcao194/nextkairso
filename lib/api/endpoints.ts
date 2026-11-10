/* eslint-disable */
import { request, type RequestOptions } from "./http";
import type * as S from "./schema";
import type { Paged } from "./schema";

const enc = encodeURIComponent;

export const getPublicProject = (token: string, opts?: RequestOptions): Promise<S.PublicProjectResponse> =>
  request<S.PublicProjectResponse>("GET", `/public/projects/${enc(token)}`, { ...opts });

export interface GetPublicProjectFeedbacksQuery {
  priority?: string;
  hasResponse?: boolean;
  status?: string;
  feedbackType?: string;
  q?: string;
  sort?: string;
  limit?: number;
  page?: number;
}
export const getPublicProjectFeedbacks = (token: string, query?: GetPublicProjectFeedbacksQuery, opts?: RequestOptions): Promise<S.ProjectFeedbackListResponse> =>
  request<S.ProjectFeedbackListResponse>("GET", `/public/projects/${enc(token)}/feedbacks`, { query, ...opts });

export const postPublicProjectFeedbacks = (token: string, body: S.CreateProjectFeedbackRequest, opts?: RequestOptions): Promise<S.ProjectFeedbackResponse> =>
  request<S.ProjectFeedbackResponse>("POST", `/public/projects/${enc(token)}/feedbacks`, { body, ...opts });

export const getPublicProjectFiles = (token: string, opts?: RequestOptions): Promise<S.TreeResponse> =>
  request<S.TreeResponse>("GET", `/public/projects/${enc(token)}/files`, { ...opts });

export const getPublicProjectModules = (token: string, opts?: RequestOptions): Promise<S.PublicModuleResponse[]> =>
  request<S.PublicModuleResponse[]>("GET", `/public/projects/${enc(token)}/modules`, { ...opts });

export const postPublicProjectUploadsPresignedUrl = (token: string, body: S.PublicUploadRequest, opts?: RequestOptions): Promise<S.PublicUploadResponse> =>
  request<S.PublicUploadResponse>("POST", `/public/projects/${enc(token)}/uploads/presigned-url`, { body, ...opts });

export const postAuthFirebaseLogin = (body: S.FirebaseLoginRequest, opts?: RequestOptions): Promise<S.LoginResponse> =>
  request<S.LoginResponse>("POST", `/v1/auth/firebase/login`, { body, ...opts });

export const postAuthRefresh = (body: S.RefreshRequest, opts?: RequestOptions): Promise<S.TokenResponse> =>
  request<S.TokenResponse>("POST", `/v1/auth/refresh`, { body, ...opts });

export const deleteFeedback = (feedbackId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/feedbacks/${enc(feedbackId)}`, { ...opts });

export const patchFeedback = (feedbackId: string, body: S.UpdateFeedbackRequest, opts?: RequestOptions): Promise<S.FeedbackResponse> =>
  request<S.FeedbackResponse>("PATCH", `/v1/feedbacks/${enc(feedbackId)}`, { body, ...opts });

export const deleteInitiative = (initiativeId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/initiatives/${enc(initiativeId)}`, { ...opts });

export const patchInitiative = (initiativeId: string, body: S.UpdateInitiativeRequest, opts?: RequestOptions): Promise<S.InitiativeResponse> =>
  request<S.InitiativeResponse>("PATCH", `/v1/initiatives/${enc(initiativeId)}`, { body, ...opts });

export interface GetInvitationsQuery {
  limit?: number;
  page?: number;
}
export const getInvitations = (query?: GetInvitationsQuery, opts?: RequestOptions): Promise<Paged<S.WorkspaceInvitationSummaryResponse>> =>
  request<Paged<S.WorkspaceInvitationSummaryResponse>>("GET", `/v1/invitations`, { query, ...opts });

export const deleteLabel = (labelId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/labels/${enc(labelId)}`, { ...opts });

export const patchLabel = (labelId: string, body: S.UpdateTaskLabelRequest, opts?: RequestOptions): Promise<S.TaskLabelResponse> =>
  request<S.TaskLabelResponse>("PATCH", `/v1/labels/${enc(labelId)}`, { body, ...opts });

export const deleteLateLog = (lateLogId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/late/logs/${enc(lateLogId)}`, { ...opts });

export const patchLateLog = (lateLogId: string, body: S.UpdateLateLogRequest, opts?: RequestOptions): Promise<S.LateLogResponse> =>
  request<S.LateLogResponse>("PATCH", `/v1/late/logs/${enc(lateLogId)}`, { body, ...opts });

export const getMeeting = (meetingId: string, opts?: RequestOptions): Promise<S.MeetingMinutesResponse> =>
  request<S.MeetingMinutesResponse>("GET", `/v1/meetings/${enc(meetingId)}`, { ...opts });

export const deleteMeeting = (meetingId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/meetings/${enc(meetingId)}`, { ...opts });

export const patchMeeting = (meetingId: string, body: S.UpdateMeetingMinutesRequest, opts?: RequestOptions): Promise<S.MeetingMinutesResponse> =>
  request<S.MeetingMinutesResponse>("PATCH", `/v1/meetings/${enc(meetingId)}`, { body, ...opts });

export const deleteModule = (moduleId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/modules/${enc(moduleId)}`, { ...opts });

export const patchModule = (moduleId: string, body: S.UpdateModuleRequest, opts?: RequestOptions): Promise<S.ModuleResponse> =>
  request<S.ModuleResponse>("PATCH", `/v1/modules/${enc(moduleId)}`, { body, ...opts });

export const getModuleAttachments = (moduleId: string, opts?: RequestOptions): Promise<S.ModuleAttachmentResponse[]> =>
  request<S.ModuleAttachmentResponse[]>("GET", `/v1/modules/${enc(moduleId)}/attachments`, { ...opts });

export const postModuleAttachments = (moduleId: string, body: S.CreateModuleAttachmentRequest, opts?: RequestOptions): Promise<S.ModuleAttachmentResponse> =>
  request<S.ModuleAttachmentResponse>("POST", `/v1/modules/${enc(moduleId)}/attachments`, { body, ...opts });

export const deleteModuleAttachment = (moduleId: string, attachmentId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/modules/${enc(moduleId)}/attachments/${enc(attachmentId)}`, { ...opts });

export interface GetModuleHistoryQuery {
  limit?: number;
  page?: number;
}
export const getModuleHistory = (moduleId: string, query?: GetModuleHistoryQuery, opts?: RequestOptions): Promise<Paged<S.ModuleHistoryResponse>> =>
  request<Paged<S.ModuleHistoryResponse>>("GET", `/v1/modules/${enc(moduleId)}/history`, { query, ...opts });

export const postModuleSprints = (moduleId: string, body: S.CreateModuleSprintRequest, opts?: RequestOptions): Promise<S.ModuleResponse> =>
  request<S.ModuleResponse>("POST", `/v1/modules/${enc(moduleId)}/sprints`, { body, ...opts });

export const deleteModuleSprint = (moduleId: string, sprintId: string, opts?: RequestOptions): Promise<S.ModuleResponse> =>
  request<S.ModuleResponse>("DELETE", `/v1/modules/${enc(moduleId)}/sprints/${enc(sprintId)}`, { ...opts });

export const patchModuleSprint = (moduleId: string, sprintId: string, body: S.UpdateModuleSprintRequest, opts?: RequestOptions): Promise<S.ModuleResponse> =>
  request<S.ModuleResponse>("PATCH", `/v1/modules/${enc(moduleId)}/sprints/${enc(sprintId)}`, { body, ...opts });

export const patchProjectFeedback = (feedbackId: string, body: S.UpdateProjectFeedbackRequest, opts?: RequestOptions): Promise<S.ProjectFeedbackResponse> =>
  request<S.ProjectFeedbackResponse>("PATCH", `/v1/project-feedbacks/${enc(feedbackId)}`, { body, ...opts });

export const patchProjectFeedbackResponse = (feedbackId: string, body: S.UpdateFeedbackResponseRequest, opts?: RequestOptions): Promise<S.ProjectFeedbackResponse> =>
  request<S.ProjectFeedbackResponse>("PATCH", `/v1/project-feedbacks/${enc(feedbackId)}/response`, { body, ...opts });

export const patchProjectFeedbackStatus = (feedbackId: string, body: S.UpdateFeedbackStatusRequest, opts?: RequestOptions): Promise<S.ProjectFeedbackResponse> =>
  request<S.ProjectFeedbackResponse>("PATCH", `/v1/project-feedbacks/${enc(feedbackId)}/status`, { body, ...opts });

export const putProjectFeedbackTask = (feedbackId: string, taskId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("PUT", `/v1/project-feedbacks/${enc(feedbackId)}/tasks/${enc(taskId)}`, { ...opts });

export const deleteProjectFeedbackTask = (feedbackId: string, taskId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/project-feedbacks/${enc(feedbackId)}/tasks/${enc(taskId)}`, { ...opts });

export interface GetProjectModulesQuery {
  limit?: number;
  month?: string;
  page?: number;
}
export const getProjectModules = (projectId: string, query?: GetProjectModulesQuery, opts?: RequestOptions): Promise<Paged<S.ModuleResponse>> =>
  request<Paged<S.ModuleResponse>>("GET", `/v1/projects/${enc(projectId)}/modules`, { query, ...opts });

export const postProjectModules = (projectId: string, body: S.CreateModuleRequest, opts?: RequestOptions): Promise<S.ModuleResponse> =>
  request<S.ModuleResponse>("POST", `/v1/projects/${enc(projectId)}/modules`, { body, ...opts });

export const getTask = (taskId: string, opts?: RequestOptions): Promise<S.TaskResponse> =>
  request<S.TaskResponse>("GET", `/v1/tasks/${enc(taskId)}`, { ...opts });

export const deleteTask = (taskId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/tasks/${enc(taskId)}`, { ...opts });

export const patchTask = (taskId: string, body: S.UpdateTaskRequest, opts?: RequestOptions): Promise<S.TaskResponse> =>
  request<S.TaskResponse>("PATCH", `/v1/tasks/${enc(taskId)}`, { body, ...opts });

export const getTaskAttachments = (taskId: string, opts?: RequestOptions): Promise<S.TaskAttachmentResponse[]> =>
  request<S.TaskAttachmentResponse[]>("GET", `/v1/tasks/${enc(taskId)}/attachments`, { ...opts });

export const postTaskAttachments = (taskId: string, body: S.CreateTaskAttachmentRequest, opts?: RequestOptions): Promise<S.TaskAttachmentResponse> =>
  request<S.TaskAttachmentResponse>("POST", `/v1/tasks/${enc(taskId)}/attachments`, { body, ...opts });

export const deleteTaskAttachment = (taskId: string, attachmentId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/tasks/${enc(taskId)}/attachments/${enc(attachmentId)}`, { ...opts });

export const getTaskComments = (taskId: string, opts?: RequestOptions): Promise<S.TaskCommentResponse[]> =>
  request<S.TaskCommentResponse[]>("GET", `/v1/tasks/${enc(taskId)}/comments`, { ...opts });

export const postTaskComments = (taskId: string, body: S.CreateTaskCommentRequest, opts?: RequestOptions): Promise<S.TaskCommentResponse> =>
  request<S.TaskCommentResponse>("POST", `/v1/tasks/${enc(taskId)}/comments`, { body, ...opts });

export const deleteTaskComment = (taskId: string, commentId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/tasks/${enc(taskId)}/comments/${enc(commentId)}`, { ...opts });

export const patchTaskComment = (taskId: string, commentId: string, body: S.UpdateTaskCommentRequest, opts?: RequestOptions): Promise<S.TaskCommentResponse> =>
  request<S.TaskCommentResponse>("PATCH", `/v1/tasks/${enc(taskId)}/comments/${enc(commentId)}`, { body, ...opts });

export const putTaskFaultHolder = (taskId: string, userId: string, body: S.AssignTaskFaultHolderRequest, opts?: RequestOptions): Promise<S.TaskFaultHolderResponse> =>
  request<S.TaskFaultHolderResponse>("PUT", `/v1/tasks/${enc(taskId)}/fault-holders/${enc(userId)}`, { body, ...opts });

export const deleteTaskFaultHolder = (taskId: string, userId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/tasks/${enc(taskId)}/fault-holders/${enc(userId)}`, { ...opts });

export const getTaskFeedbacks = (taskId: string, opts?: RequestOptions): Promise<S.ProjectFeedbackResponse[]> =>
  request<S.ProjectFeedbackResponse[]>("GET", `/v1/tasks/${enc(taskId)}/feedbacks`, { ...opts });

export interface GetTaskHistoryQuery {
  limit?: number;
  page?: number;
}
export const getTaskHistory = (taskId: string, query?: GetTaskHistoryQuery, opts?: RequestOptions): Promise<Paged<S.TaskHistoryResponse>> =>
  request<Paged<S.TaskHistoryResponse>>("GET", `/v1/tasks/${enc(taskId)}/history`, { query, ...opts });

export const putTaskLabel = (taskId: string, labelId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("PUT", `/v1/tasks/${enc(taskId)}/labels/${enc(labelId)}`, { ...opts });

export const deleteTaskLabel = (taskId: string, labelId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/tasks/${enc(taskId)}/labels/${enc(labelId)}`, { ...opts });

export const putTaskWorker = (taskId: string, userId: string, body: S.AssignTaskWorkerRequest, opts?: RequestOptions): Promise<S.TaskWorkerResponse> =>
  request<S.TaskWorkerResponse>("PUT", `/v1/tasks/${enc(taskId)}/workers/${enc(userId)}`, { body, ...opts });

export const deleteTaskWorker = (taskId: string, userId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/tasks/${enc(taskId)}/workers/${enc(userId)}`, { ...opts });

export const postUploadsPresignedUrl = (body: S.CreatePresignedUploadURLRequest, opts?: RequestOptions): Promise<S.PresignedUploadURLResponse> =>
  request<S.PresignedUploadURLResponse>("POST", `/v1/uploads/presigned/url`, { body, ...opts });

export const getUsersMe = (opts?: RequestOptions): Promise<S.UserResponse> =>
  request<S.UserResponse>("GET", `/v1/users/me`, { ...opts });

export const patchUsersMe = (body: S.UpdateMeRequest, opts?: RequestOptions): Promise<S.UserResponse> =>
  request<S.UserResponse>("PATCH", `/v1/users/me`, { body, ...opts });

export interface GetWhatsNewQuery {
  limit?: number;
  page?: number;
}
export const getWhatsNew = (query?: GetWhatsNewQuery, opts?: RequestOptions): Promise<Paged<S.WhatsNewReleaseResponse>> =>
  request<Paged<S.WhatsNewReleaseResponse>>("GET", `/v1/whats-new`, { query, ...opts });

export interface GetWorkspacesQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaces = (query?: GetWorkspacesQuery, opts?: RequestOptions): Promise<Paged<S.WorkspaceResponse>> =>
  request<Paged<S.WorkspaceResponse>>("GET", `/v1/workspaces`, { query, ...opts });

export const postWorkspaces = (body: S.CreateWorkspaceRequest, opts?: RequestOptions): Promise<S.WorkspaceResponse> =>
  request<S.WorkspaceResponse>("POST", `/v1/workspaces`, { body, ...opts });

export const deleteWorkspace = (workspaceId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}`, { ...opts });

export const patchWorkspace = (workspaceId: string, body: S.UpdateWorkspaceRequest, opts?: RequestOptions): Promise<S.WorkspaceResponse> =>
  request<S.WorkspaceResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}`, { body, ...opts });

export interface GetWorkspaceAttendanceCheckRequestsQuery {
  memberId?: string;
  status?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceAttendanceCheckRequests = (workspaceId: string, query?: GetWorkspaceAttendanceCheckRequestsQuery, opts?: RequestOptions): Promise<Paged<S.AttendanceCorrectionRequestResponse>> =>
  request<Paged<S.AttendanceCorrectionRequestResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/attendance/check-requests`, { query, ...opts });

export const postWorkspaceAttendanceCheckRequests = (workspaceId: string, body: S.SubmitAttendanceCorrectionRequest, opts?: RequestOptions): Promise<S.AttendanceCorrectionRequestResponse> =>
  request<S.AttendanceCorrectionRequestResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/attendance/check-requests`, { body, ...opts });

export interface GetWorkspaceAttendanceCheckRequestsMeQuery {
  status?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceAttendanceCheckRequestsMe = (workspaceId: string, query?: GetWorkspaceAttendanceCheckRequestsMeQuery, opts?: RequestOptions): Promise<Paged<S.AttendanceCorrectionRequestResponse>> =>
  request<Paged<S.AttendanceCorrectionRequestResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/attendance/check-requests/me`, { query, ...opts });

export const postWorkspaceAttendanceCheckRequestApprove = (workspaceId: string, requestId: string, opts?: RequestOptions): Promise<S.AttendanceCorrectionRequestResponse> =>
  request<S.AttendanceCorrectionRequestResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/attendance/check-requests/${enc(requestId)}/approve`, { ...opts });

export const postWorkspaceAttendanceCheckRequestReject = (workspaceId: string, requestId: string, opts?: RequestOptions): Promise<S.AttendanceCorrectionRequestResponse> =>
  request<S.AttendanceCorrectionRequestResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/attendance/check-requests/${enc(requestId)}/reject`, { ...opts });

export const postWorkspaceAttendanceCheckIn = (workspaceId: string, body: S.AttendanceCheckRequest, opts?: RequestOptions): Promise<S.AttendanceRecordResponse> =>
  request<S.AttendanceRecordResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/attendance/check/in`, { body, ...opts });

export const postWorkspaceAttendanceCheckOut = (workspaceId: string, body: S.AttendanceCheckRequest, opts?: RequestOptions): Promise<S.AttendanceRecordResponse> =>
  request<S.AttendanceRecordResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/attendance/check/out`, { body, ...opts });

export interface GetWorkspaceAttendanceRecordsQuery {
  from?: string;
  to?: string;
  memberId?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceAttendanceRecords = (workspaceId: string, query?: GetWorkspaceAttendanceRecordsQuery, opts?: RequestOptions): Promise<Paged<S.AttendanceRecordResponse>> =>
  request<Paged<S.AttendanceRecordResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/attendance/records`, { query, ...opts });

export const deleteWorkspaceAttendanceRecord = (workspaceId: string, recordId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/attendance/records/${enc(recordId)}`, { ...opts });

export const postWorkspaceAttendanceSessions = (workspaceId: string, body: S.UpsertAttendanceSessionRequest, opts?: RequestOptions): Promise<S.AttendanceSessionResponse> =>
  request<S.AttendanceSessionResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/attendance/sessions`, { body, ...opts });

export const getWorkspaceAttendanceSettings = (workspaceId: string, opts?: RequestOptions): Promise<S.AttendanceSettingResponse> =>
  request<S.AttendanceSettingResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/attendance/settings`, { ...opts });

export const putWorkspaceAttendanceSettings = (workspaceId: string, body: S.UpsertAttendanceSettingRequest, opts?: RequestOptions): Promise<S.AttendanceSettingResponse> =>
  request<S.AttendanceSettingResponse>("PUT", `/v1/workspaces/${enc(workspaceId)}/attendance/settings`, { body, ...opts });

export interface GetWorkspaceAttendanceStatisticsQuery {
  month?: string;
  memberId?: string;
}
export const getWorkspaceAttendanceStatistics = (workspaceId: string, query?: GetWorkspaceAttendanceStatisticsQuery, opts?: RequestOptions): Promise<S.AttendanceStatisticsSummaryResponse> =>
  request<S.AttendanceStatisticsSummaryResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/attendance/statistics`, { query, ...opts });

export interface GetWorkspaceAttendanceStatisticsMeQuery {
  month?: string;
  week?: string;
  year?: string;
}
export const getWorkspaceAttendanceStatisticsMe = (workspaceId: string, query?: GetWorkspaceAttendanceStatisticsMeQuery, opts?: RequestOptions): Promise<S.MyAttendanceStatisticsResponse> =>
  request<S.MyAttendanceStatisticsResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/attendance/statistics/me`, { query, ...opts });

export const postWorkspaceAttendanceStatus = (workspaceId: string, body: S.AttendanceCheckRequest, opts?: RequestOptions): Promise<S.AttendanceStatusResponse> =>
  request<S.AttendanceStatusResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/attendance/status`, { body, ...opts });

export interface GetWorkspaceCalendarEventsQuery {
  memberId?: string;
  from?: string;
  to?: string;
}
export const getWorkspaceCalendarEvents = (workspaceId: string, query?: GetWorkspaceCalendarEventsQuery, opts?: RequestOptions): Promise<S.CalendarDayResponse[]> =>
  request<S.CalendarDayResponse[]>("GET", `/v1/workspaces/${enc(workspaceId)}/calendar/events`, { query, ...opts });

export interface GetWorkspaceCalendarEventsMeQuery {
  from?: string;
  to?: string;
}
export const getWorkspaceCalendarEventsMe = (workspaceId: string, query?: GetWorkspaceCalendarEventsMeQuery, opts?: RequestOptions): Promise<S.CalendarDayResponse[]> =>
  request<S.CalendarDayResponse[]>("GET", `/v1/workspaces/${enc(workspaceId)}/calendar/events/me`, { query, ...opts });

export interface GetWorkspaceCalendarMembersEventsQuery {
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceCalendarMembersEvents = (workspaceId: string, query?: GetWorkspaceCalendarMembersEventsQuery, opts?: RequestOptions): Promise<Paged<S.MemberCalendarResponse>> =>
  request<Paged<S.MemberCalendarResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/calendar/members/events`, { query, ...opts });

export interface GetWorkspaceDailyReportsQuery {
  memberId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
export const getWorkspaceDailyReports = (workspaceId: string, query?: GetWorkspaceDailyReportsQuery, opts?: RequestOptions): Promise<Paged<S.DailyReportResponse>> =>
  request<Paged<S.DailyReportResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/daily-reports`, { query, ...opts });

export interface GetWorkspaceDailyReportsMeQuery {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
export const getWorkspaceDailyReportsMe = (workspaceId: string, query?: GetWorkspaceDailyReportsMeQuery, opts?: RequestOptions): Promise<Paged<S.DailyReportResponse>> =>
  request<Paged<S.DailyReportResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/daily-reports/me`, { query, ...opts });

export const putWorkspaceDailyReportsMe = (workspaceId: string, body: S.UpsertDailyReportRequest, opts?: RequestOptions): Promise<S.DailyReportResponse> =>
  request<S.DailyReportResponse>("PUT", `/v1/workspaces/${enc(workspaceId)}/daily-reports/me`, { body, ...opts });

export interface GetWorkspaceFeedbacksQuery {
  memberId?: string;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceFeedbacks = (workspaceId: string, query?: GetWorkspaceFeedbacksQuery, opts?: RequestOptions): Promise<Paged<S.FeedbackResponse>> =>
  request<Paged<S.FeedbackResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/feedbacks`, { query, ...opts });

export const postWorkspaceFeedbacks = (workspaceId: string, body: S.CreateFeedbackRequest, opts?: RequestOptions): Promise<S.FeedbackResponse> =>
  request<S.FeedbackResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/feedbacks`, { body, ...opts });

export const postWorkspaceFileManager = (workspaceId: string, body: S.CreateFileRequest, opts?: RequestOptions): Promise<S.FileResponse> =>
  request<S.FileResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/file-manager`, { body, ...opts });

export const postWorkspaceFileManagerFolders = (workspaceId: string, body: S.CreateFolderRequest, opts?: RequestOptions): Promise<S.FolderResponse> =>
  request<S.FolderResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/file-manager/folders`, { body, ...opts });

export const deleteWorkspaceFileManagerFolder = (workspaceId: string, folderId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/file-manager/folders/${enc(folderId)}`, { ...opts });

export const patchWorkspaceFileManagerFolder = (workspaceId: string, folderId: string, body: S.UpdateFolderRequest, opts?: RequestOptions): Promise<S.FolderResponse> =>
  request<S.FolderResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/file-manager/folders/${enc(folderId)}`, { body, ...opts });

export const postWorkspaceFileManagerPresign = (workspaceId: string, body: S.PresignUploadRequest, opts?: RequestOptions): Promise<S.PresignUploadResponse> =>
  request<S.PresignUploadResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/file-manager/presign`, { body, ...opts });

export const getWorkspaceFileManagerSettings = (workspaceId: string, opts?: RequestOptions): Promise<S.FileSettingsResponse> =>
  request<S.FileSettingsResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/file-manager/settings`, { ...opts });

export const putWorkspaceFileManagerSettings = (workspaceId: string, body: S.UpsertFileSettingsRequest, opts?: RequestOptions): Promise<S.FileSettingsResponse> =>
  request<S.FileSettingsResponse>("PUT", `/v1/workspaces/${enc(workspaceId)}/file-manager/settings`, { body, ...opts });

export const getWorkspaceFileManagerTree = (workspaceId: string, opts?: RequestOptions): Promise<S.TreeResponse> =>
  request<S.TreeResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/file-manager/tree`, { ...opts });

export const deleteWorkspaceFileManager = (workspaceId: string, fileId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/file-manager/${enc(fileId)}`, { ...opts });

export const patchWorkspaceFileManager = (workspaceId: string, fileId: string, body: S.UpdateFileRequest, opts?: RequestOptions): Promise<S.FileResponse> =>
  request<S.FileResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/file-manager/${enc(fileId)}`, { body, ...opts });

export const getWorkspaceFileManagerVersions = (workspaceId: string, fileId: string, opts?: RequestOptions): Promise<S.FileVersionResponse[]> =>
  request<S.FileVersionResponse[]>("GET", `/v1/workspaces/${enc(workspaceId)}/file-manager/${enc(fileId)}/versions`, { ...opts });

export const postWorkspaceFileManagerVersions = (workspaceId: string, fileId: string, body: S.CreateVersionRequest, opts?: RequestOptions): Promise<S.FileResponse> =>
  request<S.FileResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/file-manager/${enc(fileId)}/versions`, { body, ...opts });

export const postWorkspaceFileManagerVersionRestore = (workspaceId: string, fileId: string, versionId: string, opts?: RequestOptions): Promise<S.FileResponse> =>
  request<S.FileResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/file-manager/${enc(fileId)}/versions/${enc(versionId)}/restore`, { ...opts });

export interface GetWorkspaceFilesQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceFiles = (workspaceId: string, query?: GetWorkspaceFilesQuery, opts?: RequestOptions): Promise<Paged<S.WorkspaceFileResponse>> =>
  request<Paged<S.WorkspaceFileResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/files`, { query, ...opts });

export const postWorkspaceFiles = (workspaceId: string, body: S.CreateWorkspaceFileRequest, opts?: RequestOptions): Promise<S.WorkspaceFileResponse> =>
  request<S.WorkspaceFileResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/files`, { body, ...opts });

export const deleteWorkspaceFile = (workspaceId: string, fileId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/files/${enc(fileId)}`, { ...opts });

export interface GetWorkspaceHistoryQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceHistory = (workspaceId: string, query?: GetWorkspaceHistoryQuery, opts?: RequestOptions): Promise<Paged<S.WorkspaceHistoryResponse>> =>
  request<Paged<S.WorkspaceHistoryResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/history`, { query, ...opts });

export interface GetWorkspaceInitiativesQuery {
  status?: string;
  proposerId?: string;
  refMemberId?: string;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceInitiatives = (workspaceId: string, query?: GetWorkspaceInitiativesQuery, opts?: RequestOptions): Promise<Paged<S.InitiativeResponse>> =>
  request<Paged<S.InitiativeResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/initiatives`, { query, ...opts });

export const postWorkspaceInitiatives = (workspaceId: string, body: S.CreateInitiativeRequest, opts?: RequestOptions): Promise<S.InitiativeResponse> =>
  request<S.InitiativeResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/initiatives`, { body, ...opts });

export const postWorkspaceInvitations = (workspaceId: string, body: S.InviteMemberRequest, opts?: RequestOptions): Promise<S.WorkspaceInvitationResponse> =>
  request<S.WorkspaceInvitationResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/invitations`, { body, ...opts });

export const deleteWorkspaceInvitation = (workspaceId: string, invitationId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/invitations/${enc(invitationId)}`, { ...opts });

export const postWorkspaceInvitationAccept = (workspaceId: string, invitationId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("POST", `/v1/workspaces/${enc(workspaceId)}/invitations/${enc(invitationId)}/accept`, { ...opts });

export const postWorkspaceInvitationReject = (workspaceId: string, invitationId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("POST", `/v1/workspaces/${enc(workspaceId)}/invitations/${enc(invitationId)}/reject`, { ...opts });

export interface GetWorkspaceKpiQuery {
  month?: string;
  memberId?: string;
}
export const getWorkspaceKpi = (workspaceId: string, query?: GetWorkspaceKpiQuery, opts?: RequestOptions): Promise<S.KPIMemberResponse[]> =>
  request<S.KPIMemberResponse[]>("GET", `/v1/workspaces/${enc(workspaceId)}/kpi`, { query, ...opts });

export const putWorkspaceKpiAttitude = (workspaceId: string, body: S.SetAttitudeRequest, opts?: RequestOptions): Promise<S.AttitudeResponse> =>
  request<S.AttitudeResponse>("PUT", `/v1/workspaces/${enc(workspaceId)}/kpi/attitude`, { body, ...opts });

export interface GetWorkspaceKpiExportQuery {
  month?: string;
  memberId?: string;
}
export const getWorkspaceKpiExport = (workspaceId: string, query?: GetWorkspaceKpiExportQuery, opts?: RequestOptions): Promise<unknown> =>
  request<unknown>("GET", `/v1/workspaces/${enc(workspaceId)}/kpi/export`, { query, ...opts });

export interface GetWorkspaceKpiMeQuery {
  month?: string;
}
export const getWorkspaceKpiMe = (workspaceId: string, query?: GetWorkspaceKpiMeQuery, opts?: RequestOptions): Promise<S.KPIMemberResponse> =>
  request<S.KPIMemberResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/kpi/me`, { query, ...opts });

export const getWorkspaceKpiSettings = (workspaceId: string, opts?: RequestOptions): Promise<S.KPISettingsResponse> =>
  request<S.KPISettingsResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/kpi/settings`, { ...opts });

export const putWorkspaceKpiSettings = (workspaceId: string, body: S.UpsertKPISettingsRequest, opts?: RequestOptions): Promise<S.KPISettingsResponse> =>
  request<S.KPISettingsResponse>("PUT", `/v1/workspaces/${enc(workspaceId)}/kpi/settings`, { body, ...opts });

export interface GetWorkspaceLabelsQuery {
  projectIds: string;
}
export const getWorkspaceLabels = (workspaceId: string, query: GetWorkspaceLabelsQuery, opts?: RequestOptions): Promise<S.TaskLabelsByProjectIDsResponse> =>
  request<S.TaskLabelsByProjectIDsResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/labels`, { query, ...opts });

export interface GetWorkspaceLateLogsQuery {
  lateUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceLateLogs = (workspaceId: string, query?: GetWorkspaceLateLogsQuery, opts?: RequestOptions): Promise<Paged<S.LateLogResponse>> =>
  request<Paged<S.LateLogResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/late/logs`, { query, ...opts });

export const postWorkspaceLateLogs = (workspaceId: string, body: S.CreateLateLogRequest, opts?: RequestOptions): Promise<S.LateLogResponse> =>
  request<S.LateLogResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/late/logs`, { body, ...opts });

export interface GetWorkspaceLinksQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceLinks = (workspaceId: string, query?: GetWorkspaceLinksQuery, opts?: RequestOptions): Promise<Paged<S.WorkspaceLinkResponse>> =>
  request<Paged<S.WorkspaceLinkResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/links`, { query, ...opts });

export const postWorkspaceLinks = (workspaceId: string, body: S.CreateWorkspaceLinkRequest, opts?: RequestOptions): Promise<S.WorkspaceLinkResponse> =>
  request<S.WorkspaceLinkResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/links`, { body, ...opts });

export const deleteWorkspaceLink = (workspaceId: string, linkId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/links/${enc(linkId)}`, { ...opts });

export interface GetWorkspaceMeetingsQuery {
  projectId?: string;
  q?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceMeetings = (workspaceId: string, query?: GetWorkspaceMeetingsQuery, opts?: RequestOptions): Promise<Paged<S.MeetingMinutesResponse>> =>
  request<Paged<S.MeetingMinutesResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/meetings`, { query, ...opts });

export const postWorkspaceMeetings = (workspaceId: string, body: S.CreateMeetingMinutesRequest, opts?: RequestOptions): Promise<S.MeetingMinutesResponse> =>
  request<S.MeetingMinutesResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/meetings`, { body, ...opts });

export interface GetWorkspaceMembersQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceMembers = (workspaceId: string, query?: GetWorkspaceMembersQuery, opts?: RequestOptions): Promise<Paged<S.WorkspaceMemberResponse>> =>
  request<Paged<S.WorkspaceMemberResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/members`, { query, ...opts });

export interface GetWorkspaceMemberBreakdownQuery {
  month?: string;
}
export const getWorkspaceMemberBreakdown = (workspaceId: string, memberId: string, query?: GetWorkspaceMemberBreakdownQuery, opts?: RequestOptions): Promise<S.MemberTaskBreakdownResponse> =>
  request<S.MemberTaskBreakdownResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/members/${enc(memberId)}/breakdown`, { query, ...opts });

export const deleteWorkspaceMember = (workspaceId: string, userId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/members/${enc(userId)}`, { ...opts });

export const patchWorkspaceMember = (workspaceId: string, userId: string, body: S.UpdateMemberRoleRequest, opts?: RequestOptions): Promise<S.WorkspaceMemberResponse> =>
  request<S.WorkspaceMemberResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/members/${enc(userId)}`, { body, ...opts });

export interface GetWorkspaceMyTasksQuery {
  status?: string;
  archived?: boolean;
  priority?: number;
  projectId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  q?: string;
  sort?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceMyTasks = (workspaceId: string, query?: GetWorkspaceMyTasksQuery, opts?: RequestOptions): Promise<S.TaskListResponse> =>
  request<S.TaskListResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/my-tasks`, { query, ...opts });

export const getWorkspaceMyTasksCount = (workspaceId: string, opts?: RequestOptions): Promise<S.MyTasksCountResponse> =>
  request<S.MyTasksCountResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/my-tasks/count`, { ...opts });

export interface GetWorkspaceNotesQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceNotes = (workspaceId: string, query?: GetWorkspaceNotesQuery, opts?: RequestOptions): Promise<Paged<S.WorkspaceNoteResponse>> =>
  request<Paged<S.WorkspaceNoteResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/notes`, { query, ...opts });

export const postWorkspaceNotes = (workspaceId: string, body: S.CreateWorkspaceNoteRequest, opts?: RequestOptions): Promise<S.WorkspaceNoteResponse> =>
  request<S.WorkspaceNoteResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/notes`, { body, ...opts });

export const deleteWorkspaceNote = (workspaceId: string, noteId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/notes/${enc(noteId)}`, { ...opts });

export const patchWorkspaceNote = (workspaceId: string, noteId: string, body: S.UpdateWorkspaceNoteRequest, opts?: RequestOptions): Promise<S.WorkspaceNoteResponse> =>
  request<S.WorkspaceNoteResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/notes/${enc(noteId)}`, { body, ...opts });

export interface GetWorkspaceNotificationsQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceNotifications = (workspaceId: string, query?: GetWorkspaceNotificationsQuery, opts?: RequestOptions): Promise<Paged<S.NotificationResponse>> =>
  request<Paged<S.NotificationResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/notifications`, { query, ...opts });

export const patchWorkspaceNotificationsRead = (workspaceId: string, body: S.ReadNotificationsRequest, opts?: RequestOptions): Promise<void> =>
  request<void>("PATCH", `/v1/workspaces/${enc(workspaceId)}/notifications/read`, { body, ...opts });

export const getWorkspaceNotificationsUnreadCount = (workspaceId: string, opts?: RequestOptions): Promise<S.UnreadCountResponse> =>
  request<S.UnreadCountResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/notifications/unread-count`, { ...opts });

export interface GetWorkspaceProjectsQuery {
  limit?: number;
  month?: string;
  page?: number;
}
export const getWorkspaceProjects = (workspaceId: string, query?: GetWorkspaceProjectsQuery, opts?: RequestOptions): Promise<Paged<S.ProjectResponse>> =>
  request<Paged<S.ProjectResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/projects`, { query, ...opts });

export const postWorkspaceProjects = (workspaceId: string, body: S.CreateProjectRequest, opts?: RequestOptions): Promise<S.ProjectResponse> =>
  request<S.ProjectResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects`, { body, ...opts });

export interface GetWorkspaceProjectsOverviewsQuery {
  projectIds: string;
}
export const getWorkspaceProjectsOverviews = (workspaceId: string, query: GetWorkspaceProjectsOverviewsQuery, opts?: RequestOptions): Promise<S.ProjectOverviewsByIDsResponse> =>
  request<S.ProjectOverviewsByIDsResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/overviews`, { query, ...opts });

export const deleteWorkspaceProject = (workspaceId: string, projectId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}`, { ...opts });

export const patchWorkspaceProject = (workspaceId: string, projectId: string, body: S.UpdateProjectRequest, opts?: RequestOptions): Promise<S.ProjectResponse> =>
  request<S.ProjectResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}`, { body, ...opts });

export const getWorkspaceProjectFeedbackSettings = (workspaceId: string, projectId: string, opts?: RequestOptions): Promise<S.FeedbackSettingsResponse> =>
  request<S.FeedbackSettingsResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/feedback-settings`, { ...opts });

export const postWorkspaceProjectFeedbackSettingsDisable = (workspaceId: string, projectId: string, opts?: RequestOptions): Promise<S.FeedbackSettingsResponse> =>
  request<S.FeedbackSettingsResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/feedback-settings/disable`, { ...opts });

export const postWorkspaceProjectFeedbackSettingsEnable = (workspaceId: string, projectId: string, opts?: RequestOptions): Promise<S.FeedbackSettingsResponse> =>
  request<S.FeedbackSettingsResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/feedback-settings/enable`, { ...opts });

export const postWorkspaceProjectFeedbackSettingsRegenerate = (workspaceId: string, projectId: string, opts?: RequestOptions): Promise<S.FeedbackSettingsResponse> =>
  request<S.FeedbackSettingsResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/feedback-settings/regenerate`, { ...opts });

export const patchWorkspaceProjectFeedbackSettingsShowTimeline = (workspaceId: string, projectId: string, body: S.UpdateFeedbackSettingsRequest, opts?: RequestOptions): Promise<S.FeedbackSettingsResponse> =>
  request<S.FeedbackSettingsResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/feedback-settings/show-timeline`, { body, ...opts });

export const getWorkspaceProjectFeedbackSummary = (workspaceId: string, projectId: string, opts?: RequestOptions): Promise<S.FeedbackSummaryResponse> =>
  request<S.FeedbackSummaryResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/feedback-summary`, { ...opts });

export interface GetWorkspaceProjectFilesQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceProjectFiles = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectFilesQuery, opts?: RequestOptions): Promise<Paged<S.ProjectFileResponse>> =>
  request<Paged<S.ProjectFileResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/files`, { query, ...opts });

export const postWorkspaceProjectFiles = (workspaceId: string, projectId: string, body: S.CreateProjectFileRequest, opts?: RequestOptions): Promise<S.ProjectFileResponse> =>
  request<S.ProjectFileResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/files`, { body, ...opts });

export const deleteWorkspaceProjectFile = (workspaceId: string, projectId: string, fileId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/files/${enc(fileId)}`, { ...opts });

export interface GetWorkspaceProjectHistoryQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceProjectHistory = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectHistoryQuery, opts?: RequestOptions): Promise<Paged<S.ProjectHistoryResponse>> =>
  request<Paged<S.ProjectHistoryResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/history`, { query, ...opts });

export interface GetWorkspaceProjectLabelsQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceProjectLabels = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectLabelsQuery, opts?: RequestOptions): Promise<Paged<S.TaskLabelResponse>> =>
  request<Paged<S.TaskLabelResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/labels`, { query, ...opts });

export const postWorkspaceProjectLabels = (workspaceId: string, projectId: string, body: S.CreateTaskLabelRequest, opts?: RequestOptions): Promise<S.TaskLabelResponse> =>
  request<S.TaskLabelResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/labels`, { body, ...opts });

export interface GetWorkspaceProjectLinksQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceProjectLinks = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectLinksQuery, opts?: RequestOptions): Promise<Paged<S.ProjectLinkResponse>> =>
  request<Paged<S.ProjectLinkResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/links`, { query, ...opts });

export const postWorkspaceProjectLinks = (workspaceId: string, projectId: string, body: S.CreateProjectLinkRequest, opts?: RequestOptions): Promise<S.ProjectLinkResponse> =>
  request<S.ProjectLinkResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/links`, { body, ...opts });

export const deleteWorkspaceProjectLink = (workspaceId: string, projectId: string, linkId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/links/${enc(linkId)}`, { ...opts });

export const patchWorkspaceProjectLink = (workspaceId: string, projectId: string, linkId: string, body: S.UpdateProjectLinkRequest, opts?: RequestOptions): Promise<S.ProjectLinkResponse> =>
  request<S.ProjectLinkResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/links/${enc(linkId)}`, { body, ...opts });

export interface GetWorkspaceProjectMembersQuery {
  limit?: number;
  page?: number;
  includeAvailable?: boolean;
}
export const getWorkspaceProjectMembers = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectMembersQuery, opts?: RequestOptions): Promise<S.ListProjectMembersResponse> =>
  request<S.ListProjectMembersResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/members`, { query, ...opts });

export const postWorkspaceProjectMembers = (workspaceId: string, projectId: string, body: S.AddProjectMemberRequest, opts?: RequestOptions): Promise<S.ProjectMemberResponse> =>
  request<S.ProjectMemberResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/members`, { body, ...opts });

export const deleteWorkspaceProjectMember = (workspaceId: string, projectId: string, userId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/members/${enc(userId)}`, { ...opts });

export const patchWorkspaceProjectMember = (workspaceId: string, projectId: string, userId: string, body: S.UpdateProjectMemberRoleRequest, opts?: RequestOptions): Promise<S.ProjectMemberResponse> =>
  request<S.ProjectMemberResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/members/${enc(userId)}`, { body, ...opts });

export interface GetWorkspaceProjectNotesQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceProjectNotes = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectNotesQuery, opts?: RequestOptions): Promise<Paged<S.ProjectNoteResponse>> =>
  request<Paged<S.ProjectNoteResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/notes`, { query, ...opts });

export const postWorkspaceProjectNotes = (workspaceId: string, projectId: string, body: S.CreateProjectNoteRequest, opts?: RequestOptions): Promise<S.ProjectNoteResponse> =>
  request<S.ProjectNoteResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/notes`, { body, ...opts });

export const deleteWorkspaceProjectNote = (workspaceId: string, projectId: string, noteId: string, opts?: RequestOptions): Promise<void> =>
  request<void>("DELETE", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/notes/${enc(noteId)}`, { ...opts });

export const patchWorkspaceProjectNote = (workspaceId: string, projectId: string, noteId: string, body: S.UpdateProjectNoteRequest, opts?: RequestOptions): Promise<S.ProjectNoteResponse> =>
  request<S.ProjectNoteResponse>("PATCH", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/notes/${enc(noteId)}`, { body, ...opts });

export interface GetWorkspaceProjectProjectFeedbacksQuery {
  priority?: string;
  hasResponse?: boolean;
  status?: string;
  feedbackType?: string;
  q?: string;
  sort?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceProjectProjectFeedbacks = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectProjectFeedbacksQuery, opts?: RequestOptions): Promise<S.ProjectFeedbackListResponse> =>
  request<S.ProjectFeedbackListResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/project-feedbacks`, { query, ...opts });

export const postWorkspaceProjectProjectFeedbacks = (workspaceId: string, projectId: string, body: S.CreateProjectFeedbackRequest, opts?: RequestOptions): Promise<S.ProjectFeedbackResponse> =>
  request<S.ProjectFeedbackResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/project-feedbacks`, { body, ...opts });

export interface GetWorkspaceProjectTasksQuery {
  moduleId?: string;
  status?: string;
  archived?: boolean;
  parentId?: string;
  createdById?: string;
  priority?: number;
  estimation?: number;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  labelId?: string;
  workerId?: string;
  q?: string;
  sort?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceProjectTasks = (workspaceId: string, projectId: string, query?: GetWorkspaceProjectTasksQuery, opts?: RequestOptions): Promise<S.TaskListResponse> =>
  request<S.TaskListResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/tasks`, { query, ...opts });

export const postWorkspaceProjectTasks = (workspaceId: string, projectId: string, body: S.CreateTaskRequest, opts?: RequestOptions): Promise<S.TaskResponse> =>
  request<S.TaskResponse>("POST", `/v1/workspaces/${enc(workspaceId)}/projects/${enc(projectId)}/tasks`, { body, ...opts });

export interface GetWorkspaceTaskStatisticsQuery {
  memberId?: string;
  projectId?: string;
  moduleId?: string;
  month?: string;
  week?: string;
  year?: string;
}
export const getWorkspaceTaskStatistics = (workspaceId: string, query?: GetWorkspaceTaskStatisticsQuery, opts?: RequestOptions): Promise<S.TaskStatisticsSummaryResponse> =>
  request<S.TaskStatisticsSummaryResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/task/statistics`, { query, ...opts });

export interface GetWorkspaceTaskStatisticsMeQuery {
  projectId?: string;
  moduleId?: string;
  month?: string;
  week?: string;
  year?: string;
}
export const getWorkspaceTaskStatisticsMe = (workspaceId: string, query?: GetWorkspaceTaskStatisticsMeQuery, opts?: RequestOptions): Promise<S.MyTaskStatisticsResponse> =>
  request<S.MyTaskStatisticsResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/task/statistics/me`, { query, ...opts });

export interface GetWorkspaceThreadsQuery {
  limit?: number;
  page?: number;
}
export const getWorkspaceThreads = (workspaceId: string, query?: GetWorkspaceThreadsQuery, opts?: RequestOptions): Promise<Paged<S.ThreadResponse>> =>
  request<Paged<S.ThreadResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/threads`, { query, ...opts });

export const getWorkspaceThreadsCount = (workspaceId: string, opts?: RequestOptions): Promise<S.ThreadsCountResponse> =>
  request<S.ThreadsCountResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/threads/count`, { ...opts });

export const putWorkspaceWorkSchedules = (workspaceId: string, body: S.UpsertWorkSchedulesRequest, opts?: RequestOptions): Promise<S.WorkScheduleDayResponse[]> =>
  request<S.WorkScheduleDayResponse[]>("PUT", `/v1/workspaces/${enc(workspaceId)}/work/schedules`, { body, ...opts });

export interface GetWorkspaceWorkSchedulesMeQuery {
  month?: string;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceWorkSchedulesMe = (workspaceId: string, query?: GetWorkspaceWorkSchedulesMeQuery, opts?: RequestOptions): Promise<Paged<S.WorkScheduleDayResponse>> =>
  request<Paged<S.WorkScheduleDayResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/work/schedules/me`, { query, ...opts });

export interface GetWorkspaceWorkSchedulesPendingQuery {
  month?: string;
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceWorkSchedulesPending = (workspaceId: string, query?: GetWorkspaceWorkSchedulesPendingQuery, opts?: RequestOptions): Promise<Paged<S.WorkScheduleDayResponse>> =>
  request<Paged<S.WorkScheduleDayResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/work/schedules/pending`, { query, ...opts });

export interface GetWorkspaceWorkScheduleQuery {
  month?: string;
  from?: string;
  to?: string;
  status?: string;
  limit?: number;
  page?: number;
}
export const getWorkspaceWorkSchedule = (workspaceId: string, memberId: string, query?: GetWorkspaceWorkScheduleQuery, opts?: RequestOptions): Promise<Paged<S.WorkScheduleDayResponse>> =>
  request<Paged<S.WorkScheduleDayResponse>>("GET", `/v1/workspaces/${enc(workspaceId)}/work/schedules/${enc(memberId)}`, { query, ...opts });

export const putWorkspaceWorkSchedule = (workspaceId: string, memberId: string, body: S.UpsertMemberWorkSchedulesRequest, opts?: RequestOptions): Promise<S.WorkScheduleDayResponse[]> =>
  request<S.WorkScheduleDayResponse[]>("PUT", `/v1/workspaces/${enc(workspaceId)}/work/schedules/${enc(memberId)}`, { body, ...opts });

export const postWorkspaceWorkScheduleApprove = (workspaceId: string, memberId: string, body: S.UpdateWorkScheduleStatusRequest, opts?: RequestOptions): Promise<S.WorkScheduleDayResponse[]> =>
  request<S.WorkScheduleDayResponse[]>("POST", `/v1/workspaces/${enc(workspaceId)}/work/schedules/${enc(memberId)}/approve`, { body, ...opts });

export const postWorkspaceWorkScheduleApproveAll = (workspaceId: string, memberId: string, opts?: RequestOptions): Promise<S.WorkScheduleDayResponse[]> =>
  request<S.WorkScheduleDayResponse[]>("POST", `/v1/workspaces/${enc(workspaceId)}/work/schedules/${enc(memberId)}/approve-all`, { ...opts });

export const postWorkspaceWorkScheduleReject = (workspaceId: string, memberId: string, body: S.UpdateWorkScheduleStatusRequest, opts?: RequestOptions): Promise<S.WorkScheduleDayResponse[]> =>
  request<S.WorkScheduleDayResponse[]>("POST", `/v1/workspaces/${enc(workspaceId)}/work/schedules/${enc(memberId)}/reject`, { body, ...opts });

export const getWorkspaceWorkWeek = (workspaceId: string, opts?: RequestOptions): Promise<S.WorkWeekResponse> =>
  request<S.WorkWeekResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/work/week`, { ...opts });

export const putWorkspaceWorkWeek = (workspaceId: string, body: S.UpsertWorkWeekRequest, opts?: RequestOptions): Promise<S.WorkWeekResponse> =>
  request<S.WorkWeekResponse>("PUT", `/v1/workspaces/${enc(workspaceId)}/work/week`, { body, ...opts });

export const getWorkspaceWorkWeekMe = (workspaceId: string, opts?: RequestOptions): Promise<S.WorkWeekResponse> =>
  request<S.WorkWeekResponse>("GET", `/v1/workspaces/${enc(workspaceId)}/work/week/me`, { ...opts });

export const putWorkspaceWorkWeekMe = (workspaceId: string, body: S.UpsertWorkWeekRequest, opts?: RequestOptions): Promise<S.WorkWeekResponse> =>
  request<S.WorkWeekResponse>("PUT", `/v1/workspaces/${enc(workspaceId)}/work/week/me`, { body, ...opts });

