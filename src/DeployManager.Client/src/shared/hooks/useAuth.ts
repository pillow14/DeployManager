import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/shared/api/auth'
import type { LoginRequest } from '@/shared/types/auth'

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      localStorage.setItem('token', response.token)
      localStorage.setItem('refreshToken', response.refreshToken)
    },
  })
}
