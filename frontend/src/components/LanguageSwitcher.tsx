import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

interface LanguageOption {
  code: string;
  label: string;
}

const languages: LanguageOption[] = [
  { code: "zh-CN", label: "中文" },
  { code: "en",    label: "EN"   }
];

const STORAGE_KEY = "hometopo.lang";

function normalize(lang: string): string {
  if (!lang) return "zh-CN";
  if (lang.toLowerCase().startsWith("zh")) return "zh-CN";
  return "en";
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = normalize(i18n.language);

  const changeLanguage = (code: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage disabled - still switch for this session */
    }
    void i18n.changeLanguage(code);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("common.language")}
      className="inline-flex items-center rounded-xl border border-border bg-surface p-0.5 shadow-soft"
    >
      <span className="pl-2 pr-1 text-subtle">
        <Globe className="h-4 w-4" />
      </span>
      {languages.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            role="radio"
            aria-checked={active}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              "h-8 rounded-lg px-2.5 text-xs font-medium transition-colors",
              active
                ? "bg-brand/10 text-brand"
                : "text-muted hover:bg-bg-soft hover:text-fg"
            )}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
