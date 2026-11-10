<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Giao diện — đọc trước khi code UI

`docs/KAIRSO-UI-SPEC.md` là hợp đồng thiết kế: token, điều hướng hai tầng, route map,
danh sách component kèm props, quy tắc từng màn, định nghĩa Done.

`docs/design/*.dc.html` là bản thiết kế gốc (17 artboard). Mỗi file là HTML với inline
style — lấy đúng số px và màu trong đó, đừng làm tròn. `docs/design/canvas.json` liệt kê
artboard nào ứng với màn nào.

Luật cứng:
- Không hardcode màu. Chỉ dùng biến CSS khai báo trong `app/globals.css`
  (`--ink`, `--surface`, `--accent`, `--st-*`, `--p0..p3`…) hoặc utility Tailwind ánh xạ
  từ chúng (`bg-surface`, `text-ink-muted`, `border-line`…). Cần màu mới thì thêm token trước.
- Không tự nghĩ khoảng cách/chiều cao. Dùng token mật độ: `h-topbar` 44, `h-toolbar` 42,
  `h-thead` 32, `h-row` 36, `h-ghead` 28, `h-ctl` 32, `h-ctl-sm` 28, `w-sidebar` 240, `w-panel` 460.
- Icon là inline SVG trong `components/icons.tsx` (stroke 1.8, viewBox 24). Không emoji,
  không thêm thư viện icon.
- Control phải là `<button>` / `<a href>` / `<input>` + `<label>` thật. Icon-only dùng
  `IconButton` (bắt buộc prop `label`).
- Điều hướng chỉ truyền id qua URL; màn đích tự fetch dữ liệu và quyền.
- Lọc/nhóm/sắp xếp/cột hiển thị để trong query string.
- Màu biểu đồ trong mục 5 của spec đã kiểm định mù màu — không đổi.
- Bảng màu "tươi": dùng bộ 9 màu ngữ nghĩa qua `lib/domain/hue.ts` (`hueVars(hue)` rồi `text-(--h) bg-(--hs) border-(--hl) bg-(--hv)`) và `components/ui/IconTile`. Màu mới của một loại mục → thêm vào `NAV_HUE`/`KIND_HUE`, đừng chọn màu tại chỗ. Thêm/đổi token màu phải kiểm tương phản ≥ 4.5:1 ở cả hai theme.

## Dữ liệu & kiến trúc (đã nối backend thật)

Mọi màn dùng API thật của `gokairso`. Không còn dữ liệu mock.

- `lib/api/schema.ts` + `lib/api/endpoints.ts` được **sinh tự động** từ `gokairso/docs/swagger.json`
  (`npm run gen:api`). Đừng sửa tay. Tên hàm sinh từ method + path (`getWorkspaceProjectTasks`,
  `patchTask`…) — tra trong `endpoints.ts`. Field bắt buộc/tuỳ chọn suy ra từ tag `json` của mã Go.
- List endpoint trả envelope `{items, page, limit, hasMore}` → dùng `fetchAll` (`lib/query/paged.ts`).
- Fetch/cache bằng React Query. Khoá cache ở `lib/query/keys.ts`; **gốc khoá** (phần tử đầu) là thứ
  `RealtimeProvider` dùng để làm mới khi WebSocket báo có thay đổi. Query mới phải bắt đầu bằng một gốc đã có.
- Hook theo nghiệp vụ ở `lib/hooks/*` (task, module, feedback, chấm công, workflow…); logic thuần ở `lib/domain/*`.
- Trình duyệt chỉ gọi `/api/proxy/...`; route handler ký `X-App-Token` (HMAC) bằng `APP_SIGNATURE_SECRET` (bắt buộc, không có giá trị mặc định).
- Workspace hiện tại: `useWorkspace()` (nhớ trong localStorage, `?ws=` ghi đè khi mở từ thông báo).

Quy ước dễ sai (đã đối chiếu backend):
- **Priority backend là 1..4** (4 = Gấp). Thiết kế gọi P0..P3. Luôn đi qua `lib/domain/task.ts` (`priorityLevel`, `priorityToApi`).
- Backend phân biệt "không gửi" và "gửi `null`" ở `PATCH /tasks/{id}` (xoá module/ngày) — dùng `TaskPatch` trong `lib/hooks/tasks.ts`.
- Ngày cho chấm công/lịch gửi dạng `YYYY-MM-DD` (server gom theo giờ Việt Nam), không gửi ISO/UTC cho `from`/`to`.
- Điều kiện quy trình là **AST riêng của backend** (`{op,args}`, `{var:"form.x"}`, `{const}`), không phải JSONLogic — xem `lib/domain/wfCondition.ts`.
- `variables` khi tạo instance là chính map giá trị form (không bọc trong `form`).
- Chấm công trên web: trình duyệt không đọc được BSSID Wi-Fi. Workspace bật `validationEnabled` thì chỉ chấm công được trên mobile hoặc qua "yêu cầu bổ sung công".
- Panel chi tiết task mở bằng `?task=<id>` (đè lên bảng ≥1024px); `/projects/[id]/tasks/[taskId]` là trang đầy đủ cho deep link/mobile.
- Designer quy trình ở `app/(designer)/…` (toàn màn hình, không sidebar); vị trí node lưu trong `config._position`.

- Soạn/hiển thị markdown (mô tả task, ghi chú) dùng `components/ui/MarkdownEditor` / `MarkdownView` (`@uiw/react-md-editor`). Preview của thư viện cho phép HTML thô, nên **luôn** qua `MD_REHYPE_PLUGINS` (rehype-sanitize) trong `components/ui/markdown.tsx` — không render markdown bằng đường khác.
  Bình luận task/phiếu quy trình cũng là markdown (ô soạn vẫn là `Textarea` để giữ gợi ý @mention); token mention
  `@[Tên](userId)` phải qua `mentionsToMarkdown` trước khi đưa vào `MarkdownView`. Chỗ xem trước một dòng dùng `markdownToPlain`.
  Dán/kéo ảnh vào ô markdown: `components/ui/useImagePaste` (chèn tại con trỏ, `pending` để chặn lưu khi ảnh đang tải).

Next 16: `middleware.ts` đã đổi tên thành `proxy.ts`. Mọi component dùng `useSearchParams` phải nằm dưới `<Suspense>` (đã bọc ở `app/(app)/layout.tsx`).
File `page.tsx`/`layout.tsx` không được export thêm gì ngoài mặc định (đặt hằng số dùng chung ở file riêng).

Theme tối bật bằng `data-theme="dark"` trên `<html>` (nút chuyển ở cuối sidebar).
