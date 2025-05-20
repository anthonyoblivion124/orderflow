
"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link"; // Keep for other links if any
import { UserNav } from "./UserNav";
import AppLogo from "../AppLogo";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
// import { ScrollArea } from "@/components/ui/scroll-area"; // Potentially not needed if SidebarContent scrolls

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar"; // Import new sidebar components

interface MainAppLayoutProps {
  children: ReactNode;
}

function InternalSidebar() {
  const { user, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const sidebar = useSidebar();

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader>
        <AppLogo collapsed={sidebar.state === 'collapsed' && !sidebar.isMobile} />
        <SidebarTrigger className="ml-auto hidden group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden md:flex" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV_LINKS.filter(link => hasRole(link.roles)).map((navLink) => {
            const isActive = pathname === navLink.href || (navLink.href !== "/dashboard" && pathname.startsWith(navLink.href));
            return (
              <SidebarMenuItem key={navLink.href}>
                <SidebarMenuButton
                  onClick={() => {
                    if (sidebar.open && !sidebar.isMobile) {
                      sidebar.setOpen(false);
                    }
                    // For mobile, Sidebar component handles its own sheet closing on navigation implicitly if Link is used.
                    // If navigation is programmatic like this, we might need to explicitly close it.
                    if (sidebar.isMobile && sidebar.openMobile) {
                         sidebar.setOpenMobile(false);
                    }
                    router.push(navLink.href);
                  }}
                  tooltip={navLink.label}
                  isActive={isActive}
                >
                  <navLink.icon className={cn("h-5 w-5 flex-shrink-0")} />
                  <span>{navLink.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      {/* Optional: Sidebar footer content */}
      {/* <SidebarFooter>...</SidebarFooter> */}
    </Sidebar>
  );
}

export default function MainAppLayout({ children }: MainAppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}> {/* `defaultOpen` can be true or false based on preference or cookie */}
      <div className="min-h-screen bg-background text-foreground flex">
        <InternalSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
            {/* Mobile hamburger menu trigger */}
            <SidebarTrigger className="md:hidden" /> 
            <div className="flex-1" /> {/* Spacer to push UserNav to the right */}
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
