import Link from "next/link";

const navItems = [
  { href: "/overview", label: "Overview" },
  { href: "/exceptions", label: "Exception Queue" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(73,96,141,0.18),transparent_38%),linear-gradient(180deg,#0d1117_0%,#090c11_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Checkgraph
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-50">
              Check Lifecycle Console
            </h1>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
