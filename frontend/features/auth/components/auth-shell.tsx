import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-xl font-bold text-accent-foreground">
            J
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-foreground">
              Jukebox
            </div>
            <div className="text-xs text-muted">{subtitle}</div>
          </div>
        </div>
        <h1 className="sr-only">{title}</h1>
        {children}
      </div>
    </div>
  );
}
