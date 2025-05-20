
"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null; // AuthGuard will handle redirect
  }
  
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title="My Profile"
          description="View and manage your profile information."
        />
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${initials}`} alt={user.name || user.email} data-ai-hint="profile avatar large" />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.name || "User"}</CardTitle>
                <CardDescription>{user.email} - <span className="capitalize">{user.role}</span></CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name || ""} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={user.email} disabled />
            </div>
             <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input id="avatarUrl" defaultValue={user.avatarUrl || ""} placeholder="https://example.com/avatar.png" />
            </div>
            <Button className="w-full sm:w-auto">Update Profile</Button>
             <CardDescription className="text-xs pt-2">Profile editing is for demonstration and not functional in this scaffold.</CardDescription>
          </CardContent>
        </Card>
      </MainAppLayout>
    </AuthGuard>
  );
}
