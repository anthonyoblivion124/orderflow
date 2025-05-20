
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import UserForm from "@/components/users/UserForm";
import type { UserManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_USERS } from "@/lib/mockData";
import type { User } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (id) {
      // Simulate fetching data
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(u => u.id === id);
        if (foundUser) {
          setUserToEdit(foundUser);
        } else {
           toast({ title: "User Not Found", description: "The user you are trying to edit does not exist.", variant: "destructive" });
           router.push("/users");
        }
        setIsLoading(false);
      }, 300);
    }
  }, [id, router, toast]);

  const handleSubmit = async (data: UserManagementFormData) => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast({ title: "Authorization Error", description: "You are not authorized to edit users.", variant: "destructive" });
      return;
    }
    
    // Prevent admin from changing their own role
    if (userToEdit && currentUser.id === userToEdit.id && currentUser.role === 'admin' && data.role !== 'admin') {
        toast({
            title: "Action Not Allowed",
            description: "Admins cannot change their own role.",
            variant: "destructive"
        });
        return;
    }


    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      MOCK_USERS[userIndex] = {
        ...MOCK_USERS[userIndex],
        name: data.name || MOCK_USERS[userIndex].name, // Keep old name if new one is empty
        // Email is not changed as per form logic (disabled for edit)
        role: data.role,
        avatarUrl: data.avatarUrl || undefined,
        // Add updatedAt if part of your User type for management
      };
    }
    
    setIsSubmitting(false);
    toast({
      title: "User Updated",
      description: `User "${data.email}" has been successfully updated.`,
    });
    router.push("/users");
  };

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading user for editing..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  if (!userToEdit) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback:
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <MainAppLayout>
          <PageHeader title="User Not Found" />
          <p>The user you are trying to edit does not exist.</p>
           <Button variant="outline" asChild className="mt-4">
            <Link href="/users"><ArrowLeft className="mr-2 h-4 w-4"/> Back to User List</Link>
          </Button>
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <MainAppLayout>
        <PageHeader
          title="Edit User"
          description={`Editing profile for ${userToEdit.email}`}
        />
        <UserForm onSubmit={handleSubmit} initialData={userToEdit} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}
