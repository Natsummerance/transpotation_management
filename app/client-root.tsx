"use client";
import { UserProvider } from "@/components/user-context";

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
} 