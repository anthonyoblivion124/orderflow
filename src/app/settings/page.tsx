
"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <AuthGuard allowedRoles={["admin", "manager"]}> {/* Example: only admin/manager can access */}
      <MainAppLayout>
        <PageHeader
          title="Application Settings"
          description="Manage your application preferences and configurations."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Receive email updates for important events.
                  </span>
                </Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="inapp-notifications" className="flex flex-col space-y-1">
                  <span>In-App Notifications</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Show notifications within the app.
                  </span>
                </Label>
                <Switch id="inapp-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Customize the application appearance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Toggle dark mode for the application.
                  </span>
                </Label>
                <Switch id="dark-mode" />
              </div>
               <CardDescription className="text-xs pt-2">Theme switching is for demonstration and not fully functional in this scaffold.</CardDescription>
            </CardContent>
          </Card>
        </div>
      </MainAppLayout>
    </AuthGuard>
  );
}
