import type { ReactNode } from "react";
import { hueVars, type Hue } from "@/lib/domain/hue";

export function IconTile({
  hue,
  size = 28,
  solid = false,
  className = "",
  children,
}: {
  hue: Hue;
  size?: number;
  solid?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        ...hueVars(hue),
        width: size,
        height: size,
        ...(solid ? { background: "linear-gradient(135deg, var(--hv), color-mix(in srgb, var(--hv) 78%, black))" } : {}),
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${
        solid ? "text-white shadow-sm" : "bg-(--hs) text-(--h)"
      } ${className}`}
    >
      {children}
    </span>
  );
}
