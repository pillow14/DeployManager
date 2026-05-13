import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { flushSync } from 'react-dom'
import Swal from 'sweetalert2'
import { useLogin } from '@/shared/hooks/useAuth'
import { useAuth } from '@/providers/useAuth'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const { login } = useAuth()

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
        id="username"
        label="Usuario"
        placeholder="Ingrese su usuario"
        error={errors.username?.message}
        {...register('username')}
      />
      <Input
        id="password"
        label="Contraseña"
        type="password"
        placeholder="Ingrese su contraseña"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" className="w-full dark:text-white" isLoading={loginMutation.isPending}>
        {loginMutation.isPending ? 'Ingresando...' : 'Iniciar Sesión'}
      </Button>
    </form>
  )
}
