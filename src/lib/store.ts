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

// Initialize stores after React is loaded
const initializeStores = () => {
  const authStore = create<AuthState>()(
    persist(
      (set) => ({
        role: null,
        setRole: (role) => set({ role }),
        clearRole: () => set({ role: null }),
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ role: state.role }),
      }
    )
  );

  const themeStore = create<ThemeState>()(
    persist(
      (set) => ({
        isDarkMode: typeof window !== 'undefined' 
          ? window.matchMedia('(prefers-color-scheme: dark)').matches 
          : false,
        toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      }),
      {
        name: 'theme-storage',
        storage: createJSONStorage(() => localStorage),
      }
    )
  );

  return { authStore, themeStore };
};

const stores = initializeStores();

export const useAuthStore = stores.authStore;
export const useThemeStore = stores.themeStore;