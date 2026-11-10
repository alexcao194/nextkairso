"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="flex h-8 shrink-0 items-center justify-center bg-warning-bg px-4 text-[12.5px] font-medium text-warning">
      Bạn đang ngoại tuyến — dữ liệu có thể đã cũ, các thay đổi sẽ không được lưu.
    </div>
  );
}
