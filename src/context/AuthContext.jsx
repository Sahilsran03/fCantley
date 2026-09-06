import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import api from "../services/api.js";
import {
  clearAuthStorage,
  getStoredUser,
  storeAuth,
  storeUser
} from "../services/tokenStorage.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [isReady] = useState(true);

  const persistSession = useCallback((authPayload) => {
    storeAuth(authPayload);
    setUser(authPayload.user);
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  }, []);

  const verifyOtp = useCallback(
    async (payload) => {
      const response = await api.post("/auth/verify-otp", payload);
      persistSession(response.data);
      return response.data;
    },
    [persistSession]
  );

  const resendOtp = useCallback(async (payload) => {
    const response = await api.post("/auth/resend-otp", payload);
    return response.data;
  }, []);

  const login = useCallback(
    async (payload) => {
      const response = await api.post("/auth/login", payload);
      if (response.data.requiresTwoFactor) {
        return response.data;
      }
      persistSession(response.data);
      return response.data;
    },
    [persistSession]
  );

  const googleLogin = useCallback(async (credential) => {
    const response = await api.post("/auth/google", { credential }, { skipAuthRefresh: true });
    persistSession(response.data);
    return response.data;
  }, [persistSession]);

  const verifyAdminTwoFactor = useCallback(
    async (payload) => {
      const response = await api.post("/auth/verify-admin-2fa", payload);
      persistSession(response.data);
      return response.data;
    },
    [persistSession]
  );

  const resendAdminTwoFactor = useCallback(async (payload) => {
    const response = await api.post("/auth/resend-admin-2fa", payload);
    return response.data;
  }, []);

  const forgotPassword = useCallback(async (payload) => {
    const response = await api.post("/auth/forgot-password", payload);
    return response.data;
  }, []);

  const resetPassword = useCallback(async (payload) => {
    const response = await api.post("/auth/reset-password", payload);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const response = await api.get("/users/profile");
    storeUser(response.data.user);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const response = await api.put("/users/profile", payload);
    storeUser(response.data.user);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady,
      register,
      verifyOtp,
      resendOtp,
      login,
      googleLogin,
      verifyAdminTwoFactor,
      resendAdminTwoFactor,
      forgotPassword,
      resetPassword,
      logout,
      refreshProfile,
      updateProfile
    }),
    [forgotPassword, googleLogin, isReady, login, logout, refreshProfile, register, resendAdminTwoFactor, resendOtp, resetPassword, updateProfile, user, verifyAdminTwoFactor, verifyOtp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};
