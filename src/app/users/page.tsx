
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_USERS, MOCK_ROLE_PERMISSIONS, updateMockRolePermission } from "@/lib/mockData";
import UsersTable from "@/components/users/UsersTable";
import { useState, useEffect } from "react";
import type { User, UserRole } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader"; 
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { APP_FEATURES_PERMISSIONS, USER_ROLES as ALL_USER_ROLES } from "@/lib/constants";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Local state for role permissions to trigger re-renders
  const [rolePermissions, setRolePermissions] = useState(JSON.parse(JSON.stringify(MOCK_ROLE_PERMISSIONS))); 
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setRolePermissions(JSON.parse(JSON.stringify(MOCK_ROLE_PERMISSIONS))); // Ensure fresh copy
      setIsLoading(false);
    }, 300); 
  }, []);

  const handleDeleteUser = (userId: string, userName: string) => {
    if (currentUser && userId === currentUser.id) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    const index = MOCK_USERS.findIndex(u => u.id === userId);
    if (index > -1) {
      MOCK_USERS.splice(index, 1);
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({
      title: "User Deleted",
      description: `User "${userName}" has been removed.`,
    });
  };

  const handlePermissionChange = (role: UserRole, featureId: string, enabled: boolean) => {
    if (role === 'admin') return; // Should not happen with UI controls but good check
    updateMockRolePermission(role, featureId, enabled);
    setRolePermissions(JSON.parse(JSON.stringify(MOCK_ROLE_PERMISSIONS))); // Update local state to re-render
    toast({
      title: "Permission Updated",
      description: `Permission for ${featureId} for role ${role} has been ${enabled ? 'enabled' : 'disabled'}.`
    });
  };

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Roles whose permissions can be managed (exclude admin)
  const manageableRoles = ALL_USER_ROLES.filter(role => role !== 'admin') as Exclude<UserRole, 'admin'>[];

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading user management..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <MainAppLayout>
        <PageHeader
          title="User Management"
          description="Manage all users and their permissions in the system."
          action={
            <Button asChild>
              <Link href="/users/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New User
              </Link>
            </Button>
          }
        />
        <UsersTable 
          users={filteredUsers} 
          onDelete={handleDeleteUser}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />

        {currentUser?.role === 'admin' && (
          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <CardTitle>Role Feature Permissions</CardTitle>
              <CardDescription>
                Toggle features on or off for specific user roles. Admin role always has all permissions.
                Note: Full enforcement of these toggles across the app requires further development.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {manageableRoles.map((role) => (
                <div key={role} className="space-y-4 p-4 border rounded-md bg-muted/30">
                  <h3 className="text-lg font-semibold capitalize text-foreground">{role}</h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {APP_FEATURES_PERMISSIONS.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between space-x-2 p-3 border rounded-md bg-card">
                        <Label htmlFor={`${role}-${feature.id}`} className="flex flex-col space-y-1 cursor-pointer">
                          <span>{feature.label}</span>
                          <span className="font-normal text-xs leading-snug text-muted-foreground">
                            {feature.description}
                          </span>
                        </Label>
                        <Switch
                          id={`${role}-${feature.id}`}
                          checked={rolePermissions[role]?.[feature.id] || false}
                          onCheckedChange={(checked) => handlePermissionChange(role, feature.id, checked)}
                          aria-label={`Toggle ${feature.label} for ${role}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </MainAppLayout>
    </AuthGuard>
  );
}
