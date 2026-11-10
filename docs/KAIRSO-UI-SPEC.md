# Kairso Web — Spec giao diện cho agent code

Tài liệu này là **hợp đồng thiết kế** cho bản web Next.js. Agent đọc file này thay vì đoán.
Thiết kế gốc nằm trong canvas "Kairso — Thiết kế lại giao diện web" (17 artboard); file này chép lại mọi quyết định cần để code.

---

## 0. Nguyên tắc (vi phạm = sửa lại)

1. **Tươi nhưng có kỷ luật.** Một accent indigo→tím cho hành động chính và mục đang chọn, cộng **9 màu ngữ nghĩa**
   (`--blue --violet --pink --rose --orange --amber --green --teal --cyan`, mỗi màu có `-soft` / `-line` / `-vivid`).
   Màu dùng để *phân loại và định hướng* (mục điều hướng, loại thông báo, ô số liệu, trạng thái, ưu tiên, avatar), không tô bừa.
   Trạng thái/ưu tiên vẫn luôn có chữ + chấm, không chỉ bằng màu.
   Chữ đặt trên nền `-soft` dùng màu đậm `--X` (tương phản ≥ 4.5:1); `-vivid` chỉ cho khối màu đặc có icon/chữ trắng.
   Gradient (`--accent-grad`, `--hero-grad`, `--brand-grad`) chỉ dành cho điểm nhấn: nút chính, banner, logo, avatar.
2. **Mặt phẳng dùng viền 1px + bóng rất nhẹ (`shadow-sm`).** Bóng đậm chỉ cho lớp nổi (menu, modal, toast, thẻ đang kéo).
3. **Một màn = một việc.** Không xếp chồng nhiều khối khác kiểu trong một trang. Số liệu nằm trong một dải ngang duy nhất (mỗi ô một màu + icon), không phải 4 card.
4. **Sidebar là bản đồ duy nhất của app.** Không lặp lại điều hướng ở giữa nội dung (bỏ hẳn "project switcher" trong trang tổng quan).
5. **Mọi màn dùng chung một thanh trên cao 44px**: breadcrumb → tab view → (đẩy phải) bộ lọc → nút chính.
6. **Dense, desktop-first.** Dòng bảng 36px, control 32/28px. Mobile mới nới ra ≥44px.
7. **Không hardcode màu.** Chỉ dùng biến trong `app/globals.css`.
8. **Không emoji làm icon.** Icon = inline SVG stroke 1.8, viewBox 24, kích thước 13–16px.

---

## 1. Token

Token thật nằm trong `app/globals.css` (khối `:root` và `:root[data-theme="dark"]`). Vài con số hay quên:

| Thứ | Giá trị |
|---|---|
| Sidebar | 240px (rail thu gọn 56px) |
| Thanh trên | 44px · thanh công cụ 42px |
| Header bảng | 32px · dòng bảng **36px** · header nhóm 28px |
| Panel chi tiết task | 460px |
| Control | md 32px, sm 28px, icon-button vuông cùng chiều cao |
| Icon / avatar | 16px / 22px |
| Chữ | body 13px, caption 12px, meta 11px, tiêu đề trang 20px |
| Font | `Be Vietnam Pro` (UI) + `JetBrains Mono` (mã task, ngày, số, giờ) |
| Bo góc | control 6, card/panel 8, overlay 10 |

**Mã task, ngày, giờ, ước tính, số đếm luôn là mono.** Tiêu đề và nhãn luôn là sans.

---

## 2. Điều hướng & route map

Sidebar hai tầng, cố định:

```
[workspace switcher]         ← đổi workspace
[⌘K tìm nhanh]
Tổng quan
Hộp thư            (badge đỏ = số chưa đọc)
Task của tôi       (badge xám = số được giao)
Thảo luận
Lịch & chấm công
── DỰ ÁN ────────────── [+]
▾ ● Kairso Web            ← dự án đang mở thì bung sub-nav
    Task · Board · Timeline · Module · Feedback (badge) · Thống kê
  ● MES Phase 2        18
  ● Nameplate Tool     12
  Xem cả 6 dự án
── WORKSPACE ──────────
Quy trình          (badge đỏ = số chờ bạn duyệt)
Sáng kiến
Phân tích
Thành viên
──────────────────────
[avatar] Cao Viết Đức        [⚙]
```

App Router:

```
app/
  (auth)/login/page.tsx
  (app)/layout.tsx                        ← AppShell: Sidebar + TopBar + <main>
    page.tsx                              /                       Tổng quan
    inbox/page.tsx                        /inbox                  list + pane, ?id= chọn mục
    my-tasks/page.tsx                     /my-tasks               ?tab=assigned|review|created|done
    threads/page.tsx                      /threads                ?id= chọn chủ đề
    calendar/page.tsx                     /calendar               ?tab=attendance|schedule|pending|late
    projects/[projectId]/
      tasks/page.tsx                      bảng task (mặc định)
      board/page.tsx
      timeline/page.tsx
      modules/page.tsx
      feedback/page.tsx
      stats/page.tsx
      settings/page.tsx
      @panel/(.)tasks/[taskId]/page.tsx   ← intercepting route: panel phải, URL đổi, F5 ra trang đầy đủ
      tasks/[taskId]/page.tsx             ← fallback trang đầy đủ (deep link, mobile)
    workflows/page.tsx                    ?tab=pending|mine|definitions
      workflows/[key]/designer/page.tsx   chế độ toàn màn (KHÔNG có sidebar app)
      workflows/instances/[id]/page.tsx
    initiatives/page.tsx
    analytics/page.tsx                    ?tab=workspace|members|projects|workflows
    settings/[section]/page.tsx           members|invites|roles|workspace|resources|labels|
                                          attendance|shifts|kpi|notifications|integrations|audit
```

Quy tắc điều hướng giữ nguyên từ bản Flutter: **chỉ truyền id/ngày qua URL**, màn đích tự fetch mọi thứ kể cả quyền. Không truyền object hay cờ `canEdit` từ màn gọi.

Trạng thái view (lọc, nhóm, sắp xếp, cột hiển thị) sống trong **query string**, để share link được.

---

## 3. Component dùng chung

Đặt trong `components/ui/` (primitive) và `components/kairso/` (theo nghiệp vụ). Tên file = tên component.

### Primitive
`Button` (variant: primary|secondary|ghost|danger, size: md|sm) · `IconButton` (bắt buộc `aria-label`) ·
`Input` · `SearchInput` · `Select` · `Textarea` · `Checkbox` · `Radio` · `Switch` ·
`Tabs` · `SegmentedControl` · `Menu` · `Modal` · `SidePanel` · `Toast` · `Tooltip` ·
`Badge` · `CountBadge` (tone: danger|neutral|accent) · `Avatar` (size 18|22|28) · `AvatarGroup` (max=3, +N) ·
`EmptyState` · `Skeleton` · `Alert` (tone: info|warning|danger)

### Theo nghiệp vụ
| Component | Props chính |
|---|---|
| `StatusChip` | `status: backlog\|todo\|inProgress\|review\|done\|canceled`, `size` |
| `PriorityTag` | `priority: 0..3 \| null` → P0 Gấp / P1 Cao / P2 Vừa / P3 Thấp |
| `LabelChip` | `name`, `color` |
| `ModuleChip` | `name` |
| `DueDate` | `date`, `isOverdue` → mono, đỏ khi quá hạn, "Hôm nay" khi trùng ngày |
| `TaskTable` | `tasks`, `groupBy`, `columns`, `onOpenTask` — ảo hoá khi >200 dòng |
| `TaskRow` / `TaskGroupHeader` | |
| `TaskCard` / `BoardColumn` | thẻ board: mã + P + tiêu đề + module + hạn + avatar |
| `TaskDetailPanel` | `taskId` — tự fetch, không nhận object |
| `PropertyRow` | `label` (rộng 108px) + children |
| `CommentList` / `CommentComposer` / `ActivityList` | |
| `ActionableList` / `ActionableRow` | dòng 44px: [loại] [mã] [tiêu đề] [meta] [hành động] |
| `MetricStrip` / `MetricItem` | dải ngang 58px, các ô ngăn bằng vạch 1px |
| `ProjectProgressRow` | tên + thanh tiến độ 4px + `xong/tổng` |
| `ApprovalChain` / `ApprovalActionBar` | chuỗi bước dọc; thanh hành động dính đáy |
| `AttendanceCalendar` / `AttendanceDayCell` | ô ngày: số + chấm trạng thái + số giờ |
| `WorkflowCanvas` / `WorkflowNode` / `NodeInspector` | node 268px, kiểu: start/approval/condition/automation/notify/end |
| `KpiTable` · `ThroughputChart` · `StatusDistributionBar` | xem mục 5 |

---

## 4. Quy tắc từng màn (chỉ phần dễ làm sai)

**Tổng quan** — dải 5 số liệu (Task đang chạy / Quá hạn / Chờ bạn duyệt / Xong tuần này / Đã chấm công) rồi lưới 1.85fr : 1fr. Trái: **"Cần bạn xử lý"** — một danh sách duy nhất gộp notification + workflow chờ duyệt + feedback chưa gán + lịch chờ duyệt + check request + task quá hạn, mỗi dòng 44px cùng khuôn: `[chip loại 86px] [mã 74px] [tiêu đề co giãn] [meta] [hành động]`. Dưới là "Hoạt động gần đây" (dòng 34px). Phải: danh sách dự án có thanh tiến độ, và thẻ Tài nguyên có tab Ghi chú/Link/File.

**Bảng task** — mặc định hiện 8 cột: Mã · Tiêu đề · Trạng thái · Ưu tiên · Module · Người làm · Hạn · Ước tính. 7 cột còn lại (Alert, Feedback, Comments, Nhãn, Người chịu lỗi, Dự án, Bắt đầu) nằm trong menu "Cột", lưu theo người dùng. Nhóm theo trạng thái, header nhóm 28px có thể gập. Chỉ kẻ ngang, không kẻ dọc. Dòng cuối là "＋ Thêm task" inline.

**Chi tiết task** — panel phải 460px đè lên bảng; dòng đang mở có nền accent-soft + vạch trái 2px. Thứ tự: header (mã, ◀▶ chuyển task, link, …, đóng) → tiêu đề → hàng nút Trạng thái/Ưu tiên/Người làm + chip cảnh báo → 6 dòng thuộc tính → mô tả → tab (Bình luận / Task con / Lịch sử) → ô nhập dính đáy.

**Hộp thư** — list 400px + pane. Điểm mấu chốt: **duyệt ngay trong pane**, không điều hướng đi đâu. Pane = header → tiêu đề + người gửi → lưới trường dữ liệu 2 cột → `ApprovalChain` → thanh hành động dính đáy (ghi chú + Từ chối / Yêu cầu bổ sung / Duyệt).

**Lịch & chấm công** — lịch tháng 7×5, ô 4 trạng thái (đủ công / đi muộn / nghỉ phép / thiếu công), cuối tuần nền chìm, hôm nay viền accent 2px. Cột phải: số liệu tháng → "Chờ bạn duyệt" (gộp bổ sung công, nghỉ phép, đổi ca, lịch tuần) → "Yêu cầu của tôi".

**Thiết kế quy trình** — chế độ toàn màn, **không có sidebar app**, chỉ nút ◀ quay lại. Palette 208px · canvas nền chấm 20px · inspector 340px. Node 268px. Nhánh điều kiện vẽ bằng đường 2px `--border-strong`, có nhãn "Đúng"/"Sai". Inspector có: tên bước, người duyệt (chip), chế độ duyệt (segmented: Bất kỳ 1 / Tất cả / Theo thứ tự), SLA + xử lý khi quá SLA, điều kiện chạy (JSONLogic, textarea mono), hành vi khi từ chối, 2 switch. Cuối inspector là ô "Kiểm tra" cảnh báo cấu hình thiếu.

**Cài đặt** — nav con 216px chia 4 nhóm (Con người / Workspace / Vận hành / Hệ thống). Bảng thành viên dòng 48px, ô vai trò là `Select` sửa tại chỗ. Thanh mời nhanh dính đáy.

**Mobile (≤ 640px)** — sidebar → tab bar 5 mục cao 60px; bảng task → danh sách thẻ nhóm theo trạng thái; panel chi tiết → trang riêng; nút chính → FAB pill 48px. Mọi vùng chạm ≥44px, dòng nội dung ≥56px.

---

## 5. Biểu đồ (bắt buộc theo đúng cái này)

- Chuỗi 1 `--chart-1` #3B5BDB, chuỗi 2 `--chart-2` #0F9463. **Đã kiểm định mù màu — không đổi.**
- Stacked trạng thái: dùng `--chart-st-*`, các đoạn cách nhau 2px, **luôn kèm legend có nhãn chữ**.
- Đường 2px, điểm ≥8px, lưới `--chart-grid` mảnh, nhãn trục `--chart-axis-ink`.
- Không bao giờ hai trục y. Hai đơn vị khác nhau ⇒ hai biểu đồ.
- Số và nhãn dùng màu chữ (`--ink`, `--ink-muted`), không dùng màu chuỗi.

---

## 6. Tiếp cận (a11y) — điều kiện nghiệm thu

- Control là `<button>` / `<a href>` / `<input>` + `<label>` thật. **Không** `div` gắn `onClick`.
- Icon-only button bắt buộc `aria-label`.
- Tương phản chữ ≥ 4.5:1 (≥3:1 với cỡ ≥24px).
- Tab đi được hết một màn; focus ring nhìn thấy rõ.
- Skeleton giữ đúng chiều cao thật (dòng 36px) để không giật layout.
- Trạng thái không bao giờ chỉ bằng màu — luôn có chấm + chữ.

---

## 7. Định nghĩa Done cho mỗi màn

1. Không có hex nào trong component (chỉ `var(--…)`).
2. Chạy đúng ở cả light và dark, đổi bằng `data-theme` trên `<html>`.
3. Chạy đúng ở 1280px và 390px.
4. Trạng thái rỗng, đang tải (skeleton), và lỗi đều có.
5. Bộ lọc/nhóm/sắp xếp phản ánh vào URL.
6. Không dùng `GoRouterState.extra`-kiểu truyền object: màn tự fetch theo id.
