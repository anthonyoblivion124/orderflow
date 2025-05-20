
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_USERS, MOCK_ROLE_PERMISSIONS } from "@/lib/mockData"; // Removed updateMockRolePermission as it's handled by direct mutation on save
import UsersTable from "@/components/users/UsersTable";
import { useState, useEffect } from "react";
import type { User, UserRole, RolePermissions } from "@/types";
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
  // Local state for role permissions to trigger re-renders of switches and hold pending changes
  const [pendingRolePermissions, setPendingRolePermissions] = useState<RolePermissions>(() => 
    JSON.parse(JSON.stringify(MOCK_ROLE_PERMISSIONS)) // Deep copy for initial state
  ); 
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setUsers(MOCK_USERS);
      // Initialize pending permissions from the global mock data source on mount
      setPendingRolePermissions(JSON.parse(JSON.stringify(MOCK_ROLE_PERMISSIONS))); 
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

  const handlePermissionChange = (role: Exclude<UserRole, 'admin'>, featureId: string, enabled: boolean) => {
    setPendingRolePermissions(prev => {
      const newPermissions = JSON.parse(JSON.stringify(prev)); // Deep copy to ensure state update
      if (!newPermissions[role]) {
        newPermissions[role] = {};
      }
      newPermissions[role]![featureId] = enabled;
      return newPermissions;
    });
    // Individual toast removed, will be shown on save
  };

  const handleSavePermissions = () => {
    // Update the global MOCK_ROLE_PERMISSIONS with the pending changes
    manageableRoles.forEach(role => {
      const roleKey = role as Exclude<UserRole, 'admin'>;
      if (MOCK_ROLE_PERMISSIONS[roleKey] && pendingRolePermissions[roleKey]) {
        MOCK_ROLE_PERMISSIONS[roleKey] = { ...pendingRolePermissions[roleKey] };
      } else if (pendingRolePermissions[roleKey]) { // If role didn't exist in MOCK_ROLE_PERMISSIONS but does in pending
         MOCK_ROLE_PERMISSIONS[roleKey] = { ...pendingRolePermissions[roleKey] };
      }
    });
  
    toast({
      title: "Permissions Saved",
      description: "Role feature permissions have been successfully updated.",
    });
    // Optionally, after saving, you might want to re-sync pendingRolePermissions if MOCK_ROLE_PERMISSIONS could be changed elsewhere.
    // For this mock setup, it's generally fine as AuthContext reads the mutated MOCK_ROLE_PERMISSIONS.
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
                          checked={pendingRolePermissions[role]?.[feature.id] || false}
                          onCheckedChange={(checked) => handlePermissionChange(role, feature.id, checked)}
                          aria-label={`Toggle ${feature.label} for ${role}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-6 flex justify-end border-t pt-4">
                <Button onClick={handleSavePermissions}>Save Permissions</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </MainAppLayout>
    </AuthGuard>
  );
}
