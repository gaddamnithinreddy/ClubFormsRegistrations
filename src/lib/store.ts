import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'president' | 'audience' | null;

interface AuthState {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    { name: 'theme-storage' }
  )
);