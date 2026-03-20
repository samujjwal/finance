import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, LoginRequest } from "@/types/api";
import { apiService } from "@/services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const login = async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.login(
            credentials.username,
            credentials.password,
          );

          if (response.success && response.data) {
            const { user, token } = response.data as {
              user: User;
              token: string;
            };

            // Store token for both modes
            localStorage.setItem("auth_token", token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: (response as any).error || "Login failed",
            });
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error as string,
          });
        }
      };

      const logout = async () => {
        set({ isLoading: true });

        try {
          await apiService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear token from storage
          localStorage.removeItem("auth_token");

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      };

      const checkAuth = async () => {
        const { token } = get();

        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await apiService.getCurrentUser();

          if (response.success && response.data) {
            set({
              user: response.data as User,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Token invalid, clear auth
            localStorage.removeItem("auth_token");
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          // Clear auth on error
          localStorage.removeItem("auth_token");
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      };

      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login,
        logout,
        checkAuth,
        clearError: () => set({ error: null }),
      };
    },
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
