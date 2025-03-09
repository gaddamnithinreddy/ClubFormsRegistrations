import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      setRole: (role) => set({ role }),
      clearRole: () => set({ role: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ role: state.role }),
    }
  )
);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    { name: 'theme-storage' }
  )
);