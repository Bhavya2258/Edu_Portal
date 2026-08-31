import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, UserRole, UserStatus } from "../types";
import { api } from "../services/api";
import { socketService, useSocketEvent } from "../services/socket";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: (customData?: { email: string; name?: string; avatar?: string; requestedRole?: string }) => Promise<User>;
  logout: () => void;
  switchAccount: (targetUser: User) => void;
  refreshUser: () => Promise<void>;
  demoUsers: User[];
  reloadDemoUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  const loadDemoUsers = useCallback(async () => {
    try {
      const list = await api.getDemoUsers();
      setDemoUsers(list);
    } catch (e) {
      console.error("Failed to load demo accounts", e);
    }
  }, []);

  // Initial load from localStorage
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        await loadDemoUsers();
        const stored = localStorage.getItem("eduportal_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            try {
              const freshUser: any = await api.getMe();
              if (freshUser && freshUser.id) {
                setUser(freshUser);
                localStorage.setItem("eduportal_user", JSON.stringify(freshUser));
                socketService.connect(freshUser.id, freshUser.role);
              } else {
                setUser(parsed);
                socketService.connect(parsed.id, parsed.role);
              }
            } catch (e) {
              // fallback to stored
              setUser(parsed);
              socketService.connect(parsed.id, parsed.role);
            }
          }
        }
      } catch (e) {
        console.error("Auth init error", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [loadDemoUsers]);

  // Real-time approval listener: if current user is approved by admin, update state immediately
  useSocketEvent("USER_APPROVED", (data: { user: User }) => {
    if (user && data.user && data.user.id === user.id) {
      setUser(data.user);
      localStorage.setItem("eduportal_user", JSON.stringify(data.user));
      socketService.connect(data.user.id, data.user.role);
    }
    loadDemoUsers();
  });

  useSocketEvent("USER_REJECTED", (data: { user: User }) => {
    if (user && data.user && data.user.id === user.id) {
      setUser(data.user);
      localStorage.setItem("eduportal_user", JSON.stringify(data.user));
    }
    loadDemoUsers();
  });

  const loginWithGoogle = async (customData?: {
    email: string;
    name?: string;
    avatar?: string;
    requestedRole?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const email = customData?.email || "patelbhavya2207@gmail.com";
      const name = customData?.name || (email.split("@")[0].replace(".", " "));
      const avatar = customData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

      const res = await api.googleLogin({
        email,
        name,
        avatar,
        requestedRole: customData?.requestedRole || "student"
      });

      const loggedUser = res.user;
      setUser(loggedUser);
      localStorage.setItem("eduportal_user", JSON.stringify(loggedUser));
      socketService.connect(loggedUser.id, loggedUser.role);
      await loadDemoUsers();
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = (targetUser: User) => {
    setUser(targetUser);
    localStorage.setItem("eduportal_user", JSON.stringify(targetUser));
    socketService.connect(targetUser.id, targetUser.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("eduportal_user");
    socketService.disconnect();
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const fresh = await api.getMe();
      setUser(fresh);
      localStorage.setItem("eduportal_user", JSON.stringify(fresh));
      await loadDemoUsers();
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGoogle,
        logout,
        switchAccount,
        refreshUser,
        demoUsers,
        reloadDemoUsers: loadDemoUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
