
"use client";

import type { User, UserRole } from "@/types";
import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MOCK_USERS } from "@/lib/mockData"; // Using mock users for demo

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>; // Password for demo, not actually used securely
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "orderflow_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call & password check
    await new Promise(resolve => setTimeout(resolve, 500));
    const foundUser = MOCK_USERS.find(u => u.email === email); // In a real app, password would be checked on backend

    if (foundUser) {
      const userToStore = { ...foundUser };
      // @ts-ignore: delete password for client side storage
      delete userToStore.password; 
      setUser(userToStore);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToStore));
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push("/login");
  }, [router]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
