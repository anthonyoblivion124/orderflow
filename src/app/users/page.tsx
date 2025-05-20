
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_USERS } from "@/lib/mockData";
import UsersTable from "@/components/users/UsersTable";
import { useState, useEffect } from "react";
import type { User } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader"; 
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setUsers(MOCK_USERS);
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

  const filteredUsers = users.filter(user =>
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading users..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <MainAppLayout>
        <PageHeader
          title="User Management"
          description="Manage all users in the system."
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
      </MainAppLayout>
    </AuthGuard>
  );
}
