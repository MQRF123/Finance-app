"use client";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type Ctx = { user: User | null; loading: boolean };
export const AuthContext = createContext<Ctx>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}
