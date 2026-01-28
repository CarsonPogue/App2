import { create } from 'zustand';
import storage from '@/utils/storage';
import { STORAGE_KEYS } from '@/constants';
import type { User, AuthTokens } from '@moove/shared/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAuth: (user: User, tokens: AuthTokens) => Promise<void>;
  updateUser: (user: User) => void;
  updateTokens: (tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setAuth: async (user, tokens) => {
    await storage.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await storage.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    await storage.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));

    set({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  updateUser: (user) => {
    storage.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)).catch(console.error);
    set({ user });
  },

  updateTokens: async (tokens) => {
    await storage.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await storage.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    set({ tokens });
  },

  logout: async () => {
    await storage.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.deleteItemAsync(STORAGE_KEYS.USER);

    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
    });
  },

  initialize: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        storage.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        storage.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        storage.getItemAsync(STORAGE_KEYS.USER),
      ]);

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          user,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes
          },
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({
        isLoading: false,
        isInitialized: true,
      });
    }
  },
}));
