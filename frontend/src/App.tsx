import { type ComponentType, useState } from "react";
import { Activity, GitFork, Home, ListChecks } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import DevicesPage from "./pages/DevicesPage";
import TopologyPage from "./pages/TopologyPage";

type Page = "dashboard" | "devices" | "topology";

const navItems: Array<{ id: Page; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "dashboard", label: "Overview", icon: Home },
  { id: "devices", label: "Devices", icon: ListChecks },
  { id: "topology", label: "Topology", icon: GitFork }
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white/80 p-5 backdrop-blur lg:block">
        <div className="mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Home Topology Mapper</h1>
          <p className="mt-1 text-sm text-slate-500">Discover, arrange, and keep your homelab map alive.</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  active ? "bg-slate-950 text-white shadow-soft" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`rounded-lg px-4 py-2 text-sm ${page === item.id ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {page === "dashboard" && <Dashboard onOpenTopology={() => setPage("topology")} />}
          {page === "devices" && <DevicesPage />}
          {page === "topology" && <TopologyPage />}
        </div>
      </main>
    </div>
  );
}
