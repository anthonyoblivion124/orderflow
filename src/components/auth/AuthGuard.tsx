
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { UserRole } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredFeature?: string; // New prop for specific feature permission
}

export default function AuthGuard({ children, allowedRoles, requiredFeature }: AuthGuardProps) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.user) {
        router.replace("/login");
      } else {
        let hasRequiredRole = true;
        if (allowedRoles && allowedRoles.length > 0) {
          hasRequiredRole = auth.hasRole(allowedRoles);
        }

        let hasRequiredFeaturePermission = true;
        if (requiredFeature) {
          hasRequiredFeaturePermission = auth.hasFeaturePermission(requiredFeature);
        }

        if (!hasRequiredRole || !hasRequiredFeaturePermission) {
          router.replace("/dashboard?error=unauthorized");
        }
      }
    }
  }, [auth.user, auth.isLoading, router, allowedRoles, requiredFeature, auth]);

  if (auth.isLoading || !auth.user) {
    return <FullScreenLoader message="Verifying access..." />;
  }

  // Check again after loading state is resolved
  let hasRequiredRole = true;
  if (allowedRoles && allowedRoles.length > 0) {
    hasRequiredRole = auth.hasRole(allowedRoles);
  }

  let hasRequiredFeaturePermission = true;
  if (requiredFeature) {
    hasRequiredFeaturePermission = auth.hasFeaturePermission(requiredFeature);
  }

  if (!hasRequiredRole || !hasRequiredFeaturePermission) {
    // Still show loader while redirecting for role/permission mismatch
    return <FullScreenLoader message="Access denied. Redirecting..." />;
  }

  return <>{children}</>;
}
