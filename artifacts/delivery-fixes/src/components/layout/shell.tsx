import { Link, useLocation } from "wouter";
import { Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Issue Queue", icon: Package },
    { href: "/settings", label: "Automation", icon: Settings },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-r border-border bg-card flex flex-col z-10 shrink-0 relative">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-xl shadow-sm">
            D
          </div>
          <span className="font-extrabold text-lg tracking-tight">Delivery Fixes</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-all cursor-pointer whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}