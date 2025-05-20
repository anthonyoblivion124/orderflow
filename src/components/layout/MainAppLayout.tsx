
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppSidebar from "./AppSidebar";
import { UserNav } from "./UserNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AppLogo from "../AppLogo";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MainAppLayoutProps {
  children: ReactNode;
}

export default function MainAppLayout({ children }: MainAppLayoutProps) {
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex flex-col md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                  <AppLogo />
                </div>
                <ScrollArea className="flex-1">
                  <nav className="px-3 py-4">
                    {user && (
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
                    )}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden md:block">
            {/* Placeholder for breadcrumbs or page title if needed */}
          </div>
          <div className="flex items-center gap-4">
            {/* Other header items can go here */}
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
