
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userManagementFormSchema, type UserManagementFormData } from "@/lib/schemas";
import { USER_ROLES } from "@/lib/constants";
import type { User, UserRole } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface UserFormProps {
  onSubmit: (data: UserManagementFormData) => Promise<void>;
  initialData?: User;
  isSubmitting?: boolean;
}

export default function UserForm({ onSubmit, initialData, isSubmitting }: UserFormProps) {
  const { user: currentUser } = useAuth(); // Get current logged-in user

  const form = useForm<UserManagementFormData>({
    resolver: zodResolver(userManagementFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          email: initialData.email,
          role: initialData.role,
          avatarUrl: initialData.avatarUrl || "",
        }
      : {
          name: "",
          email: "",
          role: "viewer" as UserRole, // Default role for new users
          avatarUrl: "",
        },
  });

  const handleSubmit = async (data: UserManagementFormData) => {
    await onSubmit(data);
    // Consider not resetting form on edit, only on create if desired
  };

  const isEditingSelf = initialData && currentUser && initialData.id === currentUser.id;
  const isCurrentUserAdmin = currentUser?.role === 'admin';

  return (
    <Card className="shadow-lg max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit User" : "Create New User"}</CardTitle>
        <CardDescription>
          {initialData ? "Update the user's details." : "Fill in the form to add a new user."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., user@example.com" {...field} disabled={!!initialData} />
                  </FormControl>
                  {initialData && <FormMessage>Email cannot be changed for existing users.</FormMessage>}
                  {!initialData && <FormMessage />}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isEditingSelf && isCurrentUserAdmin} // Admin cannot change their own role
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role} className="capitalize">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(isEditingSelf && isCurrentUserAdmin) && <FormMessage>Admins cannot change their own role.</FormMessage>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Password field could be added for creation, but requires more complex handling for edit */}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-6 border-t">
            <Button type="button" variant="outline" asChild>
              <Link href="/users">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create User"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
