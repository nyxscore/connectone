"use client";

import { useAuthStore } from "./store";
import { authActions } from "./actions";
import { User } from "../../data/types";
import { useCallback } from "react";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout } =
    useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authActions.login(email, password);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    },
    [setUser]
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      nickname: string,
      region: string,
      phoneNumber?: string
    ) => {
      const result = await authActions.signup(
        email,
        password,
        nickname,
        region,
        phoneNumber
      );
      if (result.success) {
        setUser(result.user);
      }
      return result;
    },
    [setUser]
  );

  const logoutUser = useCallback(async () => {
    const result = await authActions.logout();
    if (result.success) {
      logout();
    }
    return result;
  }, [logout]);

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      const result = await authActions.updateProfile(updates);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    },
    [setUser]
  );

  const verifyPhone = useCallback(async (phoneNumber: string) => {
    const result = await authActions.verifyPhone(phoneNumber);
    return result;
  }, []);

  const confirmPhoneVerification = useCallback(
    async (verificationCode: string) => {
      const result =
        await authActions.confirmPhoneVerification(verificationCode);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    },
    [setUser]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout: logoutUser,
    updateProfile,
    verifyPhone,
    confirmPhoneVerification,
  };
}

