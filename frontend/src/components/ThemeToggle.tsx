import { Moon, Sun, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";
import { useTheme, type Theme } from "./ThemeProvider";

interface Option {
  value: Theme;
  icon: React.ReactNode;
  labelKey: string;
}

const options: Option[] = [
  { value: "light",  icon: <Sun     className="h-4 w-4" />, labelKey: "theme.light"  },
  { value: "system", icon: <Monitor className="h-4 w-4" />, labelKey: "theme.system" },
  { value: "dark",   icon: <Moon    className="h-4 w-4" />, labelKey: "theme.dark"   }
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  return (
    <div
      role="radiogroup"
      aria-label={t("theme.aria")}
      className="inline-flex items-center rounded-xl border border-border bg-surface p-0.5 shadow-soft"
    >
      {options.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            title={t(opt.labelKey)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors",
              active
                ? "bg-brand/10 text-brand"
                : "hover:bg-bg-soft hover:text-fg"
            )}
          >
            {opt.icon}
            <span className="sr-only">{t(opt.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
