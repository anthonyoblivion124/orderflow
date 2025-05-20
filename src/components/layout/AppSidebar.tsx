
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import AppLogo from "@/components/AppLogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out md:translate-x-0">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <AppLogo />
      </div>
      <ScrollArea className="flex-1">
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {NAV_LINKS.filter(link => hasRole(link.roles)).map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-in-out",
                      isActive
                        ? "bg-sidebar-item-active-background text-sidebar-item-active-foreground shadow-sm"
                        : "hover:bg-sidebar-item-hover-background hover:text-sidebar-item-hover-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <link.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-sidebar-item-active-foreground" : "text-sidebar-foreground/80 group-hover:text-sidebar-item-hover-foreground")} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
      {/* Optional: Sidebar footer content */}
      {/* <div className="mt-auto border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} OrderFlow</p>
      </div> */}
    </aside>
  );
}
