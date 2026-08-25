import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { flushSync } from 'react-dom'
import Swal from 'sweetalert2'
import { useLogin } from '@/shared/hooks/useAuth'
import { useAuth } from '@/providers/useAuth'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await loginMutation.mutateAsync(data)
      flushSync(() => {
        login(response.token, response.refreshToken, response.username, response.role)
      })
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response) {
          await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Usuario o contraseña incorrectos',
          })
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No fue posible conectar con el servidor. Intente nuevamente.',
          })
        }
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error inesperado. Intente nuevamente.',
        })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="login-username"
        label="Usuario"
        placeholder="Ingrese su usuario"
        autoComplete="username"
        error={errors.username?.message}
        {...register('username')}
      />

      <div className="relative">
        <Input
          id="login-password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="Ingrese su contraseña"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-outline hover:text-primary-container transition-colors"
          tabIndex={-1}
          title="Mostrar/ocultar contraseña"
        >
          <span className="material-symbols-outlined text-[20px]">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>

      <Button
        type="submit"
        isLoading={loginMutation.isPending}
        className="w-full mt-2"
        size="lg"
      >
        {!loginMutation.isPending && (
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        )}
        {loginMutation.isPending ? 'Autenticando...' : 'Ingresar'}
      </Button>
    </form>
  )
}
