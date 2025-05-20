
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PenSquare, Trash2 } from "lucide-react";
import type { User } from "@/types";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_AVATARS, DEFAULT_AVATAR_HINTS } from "@/lib/constants";

interface UsersTableProps {
  users: User[];
  onDelete: (userId: string, userNameOrId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function UsersTable({ users, onDelete, searchTerm, onSearchTermChange }: UsersTableProps) {
  const router = useRouter(); // Initialize router
  const { user: currentUser } = useAuth(); 

  const handleDelete = (userId: string, userNameOrId: string) => {
    onDelete(userId, userNameOrId);
  };

  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase();
    }
    if (email) { 
      return email[0].toUpperCase();
    }
    return "U"; 
  };

  const getUserDisplayName = (user: User): string => {
    return user.name || user.email; 
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {users.length === 0 && !searchTerm && (
           <div className="text-center p-10 text-muted-foreground">
            No users found. <Link href="/users/create" className="text-primary hover:underline">Add your first user</Link>.
          </div>
        )}
        {users.length === 0 && searchTerm && (
           <div className="text-center p-10 text-muted-foreground">
            No users found matching your search criteria.
          </div>
        )}
        {users.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const avatarSrc = user.avatarUrl || DEFAULT_AVATARS[user.role];
                const avatarHint = user.avatarUrl ? "avatar user" : DEFAULT_AVATAR_HINTS[user.role];
                return (
                  <TableRow 
                    key={user.id}
                    onClick={() => router.push(`/users/${user.id}/edit`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarSrc} alt={getUserDisplayName(user)} data-ai-hint={avatarHint} />
                        <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()} /* Prevent row click for dropdown */ >
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                               <Link href={`/users/${user.id}/edit`} className="cursor-pointer">
                                <PenSquare className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            {currentUser && user.id !== currentUser.id && ( 
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user "{getUserDisplayName(user)}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.id, getUserDisplayName(user))}
                              className={buttonVariants({ variant: "destructive" })}
                            >
                              Yes, delete user
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
