import { type ComponentType, useEffect, useState } from "react";
import { Activity, GitFork, Github, Home, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import Dashboard from "./pages/Dashboard";
import DevicesPage from "./pages/DevicesPage";
import TopologyPage from "./pages/TopologyPage";
import { BrandBlock } from "./components/Brand";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ThemeToggle } from "./components/ThemeToggle";
import { cn } from "./lib/cn";

type Page = "dashboard" | "devices" | "topology";

interface NavItem {
  id: Page;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "dashboard", labelKey: "nav.overview",  icon: Home        },
  { id: "devices",   labelKey: "nav.devices",   icon: ListChecks  },
  { id: "topology",  labelKey: "nav.topology",  icon: GitFork     }
];

const GITHUB_URL = "https://github.com/zshleon/home-topology-mapper";

export default function App() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState<Page>("dashboard");
  const [animKey, setAnimKey] = useState(0);
  const isTopologyPage = page === "topology";

  // bump a key on every page switch so fade-in animation replays
  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [page]);

  // reflect lang on <html> so screen readers / form autofill behave
  useEffect(() => {
    document.documentElement.setAttribute(
      "lang",
      i18n.language?.startsWith("zh") ? "zh-CN" : "en"
    );
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-transparent text-fg">
      {/* --- Sidebar (desktop) ------------------------------------- */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-surface/80 backdrop-blur-md lg:flex">
        <div className="px-5 pt-6">
          <BrandBlock
            name={t("brand.name")}
            tagline={t("brand.tagline")}
          />
        </div>
        <nav className="mt-8 flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-muted hover:bg-bg-soft hover:text-fg"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border px-3 py-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted hover:bg-bg-soft hover:text-fg"
          >
            <Github className="h-4 w-4" />
            <span>{t("nav.github")}</span>
          </a>
        </div>
      </aside>

      {/* --- Main ---------------------------------------------------- */}
      <main className="lg:pl-64">
        {/* top bar */}
        <div className="sticky top-0 z-10 border-b border-border bg-bg/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
            {/* mobile brand */}
            <div className="lg:hidden">
              <BrandBlock
                name={t("brand.name")}
                tagline={t("brand.tagline")}
              />
            </div>
            {/* desktop: current page indicator */}
            <div className="hidden items-center gap-2 text-sm text-muted lg:flex">
              <Activity className="h-4 w-4 text-success" />
              <span>{t("status.healthy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* mobile nav pill row */}
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 pb-3 lg:hidden">
            {navItems.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                    active
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-border bg-surface text-muted hover:text-fg"
                  )}
                >
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* content */}
        <div
          key={animKey}
          className={cn(
            "animate-fade-in",
            isTopologyPage
              ? "w-full max-w-none px-4 py-4 lg:px-6 lg:py-5"
              : "mx-auto max-w-7xl px-5 py-6 lg:py-8"
          )}
        >
          {page === "dashboard" && (
            <Dashboard onOpenTopology={() => setPage("topology")} />
          )}
          {page === "devices" && <DevicesPage />}
          {page === "topology" && <TopologyPage />}
        </div>
      </main>
    </div>
  );
}
