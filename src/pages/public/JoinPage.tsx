import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { turnClientNameSchema } from '../../schemas/turn';
import { getBarbershopBySlug } from '../../services/supabase/barbershops';
import { joinQueueRemote } from '../../services/supabase/queue';
import { queueKeys } from '../../hooks/usePublicQueue';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import { LoadingState } from '../../components/queue/LoadingState';
import { NotFoundPage } from './NotFoundPage';

const joinFormSchema = z.object({
  clientName: turnClientNameSchema,
});

type JoinFormData = z.infer<typeof joinFormSchema>;

export function JoinPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: barbershop, isLoading } = useQuery({
    queryKey: ['barbershop', slug],
    queryFn: () => getBarbershopBySlug(slug),
    retry: false,
  });

  // Apply barbershop theme
  useTheme(barbershop?.theme_settings as Record<string, string> | undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinFormData>({
    resolver: zodResolver(joinFormSchema),
  });

  const joinMutation = useMutation({
    mutationFn: (data: JoinFormData) =>
      joinQueueRemote(barbershop!.id, data.clientName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.bySlug(slug) });
      navigate(`/b/${slug}`, { replace: true });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <JoinHeader />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (!barbershop) {
    return <NotFoundPage />;
  }

  const onSubmit = (data: JoinFormData) => {
    joinMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="join-page">
      <JoinHeader />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        <div className="ht-card">
          <h2 className="text-lg font-bold mb-1">{barbershop.name}</h2>
          <p className="text-sm text-gray-500">
            Completa tus datos para unirte a la cola
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="ht-card space-y-4"
          data-testid="join-form"
        >
          <div>
            <label
              htmlFor="clientName"
              className="block text-sm font-medium mb-1"
            >
              Tu nombre
            </label>
            <input
              {...register('clientName')}
              id="clientName"
              type="text"
              placeholder="Ej: Juan Pérez"
              className="ht-input"
              disabled={joinMutation.isPending}
              data-testid="join-name-input"
            />
            {errors.clientName && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {errors.clientName.message}
              </p>
            )}
          </div>

          {joinMutation.error && (
            <p className="text-red-500 text-xs" role="alert">
              No se pudo unir a la cola. Intenta de nuevo.
            </p>
          )}

          <button
            type="submit"
            className="ht-btn-primary w-full flex items-center justify-center gap-2"
            disabled={joinMutation.isPending}
            data-testid="join-submit"
          >
            <UserPlus className="w-4 h-4" />
            {joinMutation.isPending ? 'Uniéndose...' : 'Unirse a la cola'}
          </button>
        </form>

        <Link
          to={`/b/${slug}`}
          className="ht-btn-secondary block text-center"
          data-testid="back-to-queue"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Volver a la cola
        </Link>
      </main>
    </div>
  );
}

function JoinHeader() {
  return (
    <header className="bg-(--ht-primary) text-(--ht-surface) px-4 py-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold">Unirse a la cola</h1>
        <p className="text-xs opacity-75 mt-1">HayTurno</p>
      </div>
    </header>
  );
}
