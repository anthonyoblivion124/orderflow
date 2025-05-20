
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import UserForm from "@/components/users/UserForm";
import type { UserManagementFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_USERS, getNewUserId } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";

export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: currentUser } = useAuth(); // For createdBy/updatedBy if those fields are added to User type

  const handleSubmit = async (data: UserManagementFormData) => {
    if (!currentUser || currentUser.role !== 'admin') { 
      toast({ title: "Authorization Error", description: "You are not authorized to create users.", variant: "destructive" });
      return;
    }

    // Check for duplicate email only if email is provided
    if (data.email && MOCK_USERS.some(user => user.email === data.email)) {
        toast({
            title: "Creation Failed",
            description: "A user with this email address already exists.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser = {
      id: getNewUserId(),
      name: data.name || undefined, 
      email: data.email || undefined, // Email can now be undefined
      role: data.role,
      avatarUrl: data.avatarUrl || undefined,
      // Add createdAt, updatedAt if needed in your User type for management
    };
    MOCK_USERS.push(newUser);
    
    setIsSubmitting(false);
    toast({
      title: "User Created",
      description: `User "${data.name || data.email || 'New User'}" has been successfully added.`,
    });
    router.push("/users");
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <MainAppLayout>
        <PageHeader
          title="Add New User"
          description="Enter the details for the new user."
        />
        <UserForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}

