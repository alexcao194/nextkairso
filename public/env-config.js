// Giá trị cấu hình CLIENT nạp lúc chạy (Firebase, WS host...). Khi self-host,
// container web tự GHI ĐÈ file này từ biến môi trường lúc khởi động
// (xem docker-entrypoint.sh). Mặc định rỗng → dùng giá trị bake lúc build hoặc
// mặc định trong mã. An toàn để commit.
window.__KAIRSO_ENV__ = window.__KAIRSO_ENV__ || {};
