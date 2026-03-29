import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organizationName: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
        // Redirect handled in component or interceptor
      },
      hydrate: () => {
        // Zustand persist handles initial hydration, but we might want to check token expiry here
        const state = useAuthStore.getState();
        if (state.token) {
          try {
            // Basic JWT expiry check (if it's a real JWT)
            const payload = JSON.parse(atob(state.token.split('.')[1]));
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              state.logout();
            }
          } catch (e) {
            // Not a valid JWT or missing parts, ignore for mock
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
