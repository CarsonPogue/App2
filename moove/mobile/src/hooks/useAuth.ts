import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { api } from '@/services/api';
import { QUERY_KEYS } from '@/constants';
import type { LoginCredentials, RegisterCredentials } from '@moove/shared/types';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => api.login(credentials),
    onSuccess: async (data) => {
      await setAuth(data.user, data.tokens);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => api.register(credentials),
    onSuccess: async (data) => {
      await setAuth(data.user, data.tokens);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: async () => {
      await logout();
      queryClient.clear();
    },
    onError: async () => {
      // Still logout locally even if API fails
      await logout();
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useQuery({
    queryKey: [QUERY_KEYS.USER],
    queryFn: async () => {
      const data = await api.getMe();
      updateUser(data.user);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.forgotPassword(email),
  });
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { displayName?: string; username?: string; bio?: string | null }) =>
      api.updateProfile(data),
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
    },
  });
}
