"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

// Tabbed settings: the panels are server-rendered and passed in as nodes; the
// client only toggles which one is visible. All panels stay mounted (`hidden`)
// so any in-panel form state (e.g. the importer) survives tab switches.
export function SettingsTabs({
  tabs,
}: {
  tabs: { id: string; label: string; panel: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-muted/20">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 font-body text-sm transition-colors",
                on
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={t.id !== active}>
          {t.panel}
        </div>
      ))}
    </div>
  );
}
