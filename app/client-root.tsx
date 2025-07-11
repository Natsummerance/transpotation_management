"use client";
import { UserProvider } from "@/components/user-context";
import { Toaster } from "@/components/ui/sonner";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      {children}
      <Toaster />
    </UserProvider>
  );
} 