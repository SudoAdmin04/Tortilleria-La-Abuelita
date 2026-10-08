import { useAuthStore } from '~/stores/auth.store'

export const useAuth = () => {
  const store = useAuthStore()
  return {
    auth: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    loading: computed(() => store.loading),
    login: store.login,
    logout: store.logout,
    register: store.register,
    fetchProfile: store.fetchProfile,
  }
}
