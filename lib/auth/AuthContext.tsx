"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../api/firebase";
import { getCurrentUser } from "../api/auth";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    nickname: string,
    region: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase가 제대로 설정되지 않은 경우를 위한 처리
    try {
      const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
        if (firebaseUser) {
          try {
            const userData = await getCurrentUser();
            setUser(userData);
          } catch (error) {
            console.error("사용자 정보 가져오기 실패:", error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase 초기화 실패:", error);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { signIn: firebaseSignIn } = await import("../api/auth");
    const userData = await firebaseSignIn(email, password);
    setUser(userData);
  };

  const signUp = async (
    email: string,
    password: string,
    nickname: string,
    region: string
  ) => {
    const { signUp: firebaseSignUp } = await import("../api/auth");
    const userData = await firebaseSignUp(email, password, nickname, region);
    setUser(userData);
  };

  const logout = async () => {
    const { logout: firebaseLogout } = await import("../api/auth");
    await firebaseLogout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
