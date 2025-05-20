
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Package } from "lucide-react"; // Example icon

export default function AppLogo({ size = "md", collapsed = false }: { size?: "sm" | "md" | "lg", collapsed?: boolean }) {
  const iconSize = size === "lg" ? "h-8 w-8" : size === "md" ? "h-7 w-7" : "h-6 w-6";
  const textSize = size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg";

  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-1 -m-1">
      <Package className={`${iconSize} text-accent`} />
      {!collapsed && <span className={`font-bold ${textSize} text-sidebar-foreground`}>{APP_NAME}</span>}
    </Link>
  );
}
