import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import Swal from 'sweetalert2'
import { useLogin } from '@/shared/hooks/useAuth'
import { useAuth } from '@/providers/useAuth'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
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
      login(response.token, response.refreshToken, response.username, response.role)
      await Swal.fire({
        icon: 'success',
        title: 'Inicio de sesión exitoso',
        timer: 1500,
        showConfirmButton: false,
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
        label="Username"
        placeholder="Enter your username"
        error={errors.username?.message}
        {...register('username')}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
        {loginMutation.isPending ? 'Ingresando...' : 'Sign In'}
      </Button>
    </form>
  )
}
