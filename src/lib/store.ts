import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserRole } from './types';

interface AuthState {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  clearRole: () => void;
}

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Ensure we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create stores with safe initialization
const createAuthStore = () => 
  create<AuthState>()(
    persist(
      (set) => ({
        role: null,
        setRole: (role) => set({ role }),
        clearRole: () => set({ role: null }),
      }),
      {
        name: 'auth-storage',
        storage: isBrowser ? createJSONStorage(() => localStorage) : undefined,
        partialize: (state) => ({ role: state.role }),
      }
    )
  );

const createThemeStore = () =>
  create<ThemeState>()(
    persist(
      (set) => ({
        isDarkMode: isBrowser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
        toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      }),
      {
        name: 'theme-storage',
        storage: isBrowser ? createJSONStorage(() => localStorage) : undefined,
      }
    )
  );

// Initialize stores lazily
let authStore: ReturnType<typeof createAuthStore>;
let themeStore: ReturnType<typeof createThemeStore>;

export const useAuthStore = (...args: Parameters<typeof createAuthStore>) => {
  if (!authStore) {
    authStore = createAuthStore();
  }
  return authStore(...args);
};

export const useThemeStore = (...args: Parameters<typeof createThemeStore>) => {
  if (!themeStore) {
    themeStore = createThemeStore();
  }
  return themeStore(...args);
};