import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { UserSession, ToastNotification } from "../types/hrms";
import { api, ApiError } from "../api/client";

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustResetPassword: boolean;
  toasts: ToastNotification[];
  login: (identifier: string, password: string) => Promise<UserSession>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  resetPassword: (newPass: string, confirmPass: string) => Promise<void>;
  addToast: (toast: Omit<ToastNotification, "id">) => void;
  removeToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const savedUser = localStorage.getItem("dayflow_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("dayflow_access_token");
    } catch {
      return null;
    }
  });

  const [mustResetPassword, setMustResetPassword] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dayflow_must_reset_password") === "true";
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.auth.getMe();
      if (res.user) {
        setUser(res.user);
        setMustResetPassword(Boolean(res.user.must_reset_password));
        localStorage.setItem("dayflow_user", JSON.stringify(res.user));
        localStorage.setItem(
          "dayflow_must_reset_password",
          String(Boolean(res.user.must_reset_password))
        );
      }
    } catch (err: any) {
      console.warn("Session verification notice:", err);
      if (err instanceof ApiError && err.status === 401) {
        // Token expired or invalid
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (identifier: string, password: string): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(identifier, password);
      const accessToken = res.access_token;
      const userData = res.user;
      const mustReset = Boolean(res.must_reset_password);

      setToken(accessToken);
      setUser(userData);
      setMustResetPassword(mustReset);

      localStorage.setItem("dayflow_access_token", accessToken);
      localStorage.setItem("dayflow_user", JSON.stringify(userData));
      localStorage.setItem("dayflow_must_reset_password", String(mustReset));

      addToast({
        type: "success",
        title: "Welcome back!",
        message: `Signed in as ${userData.full_name} (${userData.role.toUpperCase()})`,
      });

      return userData;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setMustResetPassword(false);
    try {
      localStorage.removeItem("dayflow_access_token");
      localStorage.removeItem("dayflow_user");
      localStorage.removeItem("dayflow_must_reset_password");
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
    addToast({
      type: "info",
      title: "Signed Out",
      message: "You have been safely signed out.",
    });
  };

  const resetPassword = async (newPass: string, confirmPass: string) => {
    const res = await api.auth.resetPassword(newPass, confirmPass);
    setMustResetPassword(false);
    localStorage.setItem("dayflow_must_reset_password", "false");
    if (res.employee && user) {
      const updatedUser = { ...user, must_reset_password: false };
      setUser(updatedUser);
      localStorage.setItem("dayflow_user", JSON.stringify(updatedUser));
    }
    addToast({
      type: "success",
      title: "Password Updated",
      message: res.message || "Your password has been changed successfully.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        mustResetPassword,
        toasts,
        login,
        logout,
        refreshUser,
        resetPassword,
        addToast,
        removeToast,
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
