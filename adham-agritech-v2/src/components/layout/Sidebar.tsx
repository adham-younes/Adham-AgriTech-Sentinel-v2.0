"use client";

import { Bot, LayoutDashboard, Satellite, FileText } from "lucide-react";

const links = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Satellite", icon: Satellite },
  { label: "Reports", icon: FileText },
  { label: "AI Agent", icon: Bot },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-primary/20 bg-black/90 px-6 py-8 text-text shadow-lg shadow-primary/10 lg:flex">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Adham</p>
        <h1 className="text-2xl font-semibold text-primary">AgriTech V2</h1>
      </div>
      <nav className="space-y-3">
        {links.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
              index === 0
                ? "bg-primary/15 text-primary shadow-inner shadow-primary/30"
                : "bg-surface text-muted hover:text-primary"
            }`}
            type="button"
          >
            <Icon size={18} />
            <span className="font-medium tracking-wide">{label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-primary/20 bg-surface px-4 py-5 text-xs text-muted">
        <p className="uppercase tracking-wide text-primary">Zero-Input Mode</p>
        <p className="mt-2 text-sm text-text">
          ESODA telemetry streaming live. All analytics auto-synced every 15min.
        </p>
      </div>
    </aside>
  );
}
