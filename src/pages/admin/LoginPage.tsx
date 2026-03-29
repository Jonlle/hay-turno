import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { signInWithEmail } from '../../services/supabase/auth';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { LoadingState } from '../../components/queue/LoadingState';

const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export function AdminLoginPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthorized, isLoading, needsLogin } = useAuthGuard(slug);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const { error } = await signInWithEmail(data.email, data.password);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['membership'] });
      navigate(`/admin/${slug}/queue`, { replace: true });
    },
    onError: () => {
      setError('root', {
        message: 'Credenciales incorrectas. Verificá tu email y contraseña.',
      });
    },
  });

  // If already authorized, redirect to queue
  if (isAuthorized) {
    navigate(`/admin/${slug}/queue`, { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AdminHeader title="Accediendo..." />
        <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
          <LoadingState />
        </main>
      </div>
    );
  }

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="admin-login-page">
      <AdminHeader title="Acceso Administrador" />

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6">
        <div className="ht-card">
          <p className="text-sm text-gray-500">
            Ingresá con tu cuenta de administrador para gestionar la cola.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="ht-card space-y-4"
          data-testid="login-form"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@ejemplo.com"
              className="ht-input"
              disabled={loginMutation.isPending}
              data-testid="login-email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Contraseña
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="current-password"
              className="ht-input"
              disabled={loginMutation.isPending}
              data-testid="login-password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p className="text-red-500 text-sm" role="alert">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            className="ht-btn-primary w-full flex items-center justify-center gap-2"
            disabled={loginMutation.isPending}
            data-testid="login-submit"
          >
            <LogIn className="w-4 h-4" />
            {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </main>
    </div>
  );
}

function AdminHeader({ title }: { title: string }) {
  return (
    <header className="bg-[var(--ht-primary)] text-[var(--ht-surface)] px-4 py-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-xs opacity-75 mt-1">HayTurno Admin</p>
      </div>
    </header>
  );
}
