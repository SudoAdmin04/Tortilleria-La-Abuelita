export const useApi = () => {
  const { $api } = useNuxtApp()
  return { api: $api as typeof $fetch }
}
