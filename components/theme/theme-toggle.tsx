"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeMode } from "@/components/theme/theme-mode-provider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { themeMode, toggleThemeMode } = useThemeMode();
  const isDark = themeMode === "dark";

  return (
    <button
      type="button"
      onClick={toggleThemeMode}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-pressed={isDark}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-background-card text-foreground-default transition-colors duration-200 hover:border-primary hover:text-primary",
        className,
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
