"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { Role } from "@/lib/types";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

const UserContext = createContext<{ user: User | null; isLoading: boolean }>({
  user: null,
  isLoading: true,
});

export const UserProvider = ({ children, initialUser }: { children: React.ReactNode; initialUser?: User | null }) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    if (!initialUser) {
      axios.get("/api/auth/me")
        .then((res) => {
          if (res.data.data?.user) {
            setUser(res.data.data.user);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [initialUser]);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
