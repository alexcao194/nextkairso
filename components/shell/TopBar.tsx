import type { ReactNode } from "react";

export function TopBar({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-topbar shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur">
      {children}
    </header>
  );
}

export function TopBarDivider() {
  return <span className="h-[18px] w-px shrink-0 bg-line" aria-hidden="true" />;
}

export function TopBarSpacer() {
  return <span className="flex-1" />;
}
