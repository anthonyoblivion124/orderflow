
import type { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { UserNav } from "./UserNav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AppLogo from "../AppLogo";

interface MainAppLayoutProps {
  children: ReactNode;
}

export default function MainAppLayout({ children }: MainAppLayoutProps) {
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
              <SheetContent side="left" className="w-64 bg-sidebar p-0">
                {/* Simplified sidebar content for mobile sheet */}
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                  <AppLogo />
                </div>
                <nav className="px-3 py-4">
                  {/* You might want to render NAV_LINKS here similarly to AppSidebar */}
                  <p className="text-sidebar-foreground p-4">Navigation links here...</p>
                </nav>
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
