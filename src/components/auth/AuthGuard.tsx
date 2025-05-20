
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { UserRole } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[]; // If not provided, just checks for authentication
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      } else if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        // Optional: Redirect to an unauthorized page or dashboard if role mismatch
        // For now, redirect to dashboard, could be a specific 'unauthorized' page
        router.replace("/dashboard?error=unauthorized"); 
      }
    }
  }, [user, isLoading, router, allowedRoles, hasRole]);

  if (isLoading || !user) {
    return <FullScreenLoader message="Verifying access..." />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
     // Still show loader while redirecting for role mismatch
    return <FullScreenLoader message="Access denied. Redirecting..." />;
  }

  return <>{children}</>;
}
