"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/icons";
import { IconButton } from "@/components/ui/Button";
import { tr } from "@/lib/i18n";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("kairso-theme", next);
    } catch {
      /* chế độ riêng tư — bỏ qua */
    }
    setTheme(next);
  }

  return (
    <IconButton
      label={theme === "dark" ? tr().ui.themeLight : tr().ui.themeDark}
      variant="ghost"
      size="sm"
      onClick={toggle}
    >
      {theme === "dark" ? <IconSun size={15} /> : <IconMoon size={15} />}
    </IconButton>
  );
}
