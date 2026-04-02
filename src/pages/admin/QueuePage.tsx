import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { useQueueRealtime } from '../../hooks/useQueueRealtime';
import { useTheme } from '../../hooks/useTheme';
import { QueueBoard } from '../../components/queue/QueueBoard';
import { LoadingState } from '../../components/queue/LoadingState';
import { WalkInForm } from '../../components/barber/WalkInForm';
import { NextButton } from '../../components/barber/NextButton';
import { LogOut, BarChart3 } from 'lucide-react';
import { signOut } from '../../services/supabase/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function AdminQueuePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    user,
    membership,
    barbershopId,
    barbershopName,
    themeSettings,
    isAuthorized,
    isLoading: authLoading,
    needsLogin,
  } = useAuthGuard(slug);

  // Apply barbershop theme
  useTheme(themeSettings);

  // Subscribe to realtime changes
  useQueueRealtime({ barbershopId });

  const {
    turns,
    currentCalled,
    waitingTurns,
    isLoading: queueLoading,
    addWalkIn,
    isAddingWalkIn,
    walkInError,
    callNext,
    isCallingNext,
    cancelTurn,
  } = useAdminQueue(barbershopId);

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
      navigate(`/admin/${slug}/login`, { replace: true });
    },
    onError: (error) => {
      console.error('Sign out failed:', error);
    },
  });

  // Redirect if login needed
  useEffect(() => {
    if (needsLogin) {
      navigate(`/admin/${slug}/login`, { replace: true });
    }
  }, [needsLogin, navigate, slug]);

  if (needsLogin) {
    return null;
  }

  if (authLoading || queueLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AdminHeader name={barbershopName ?? '...'} onLogout={() => {}} />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <AdminHeader name="Acceso denegado" onLogout={() => {}} />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <div className="ht-card text-center py-8">
            <p className="text-sm text-gray-500">
              No tienes permisos para acceder a esta barbería.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const handleWalkIn = (clientName: string) => {
    if (membership) {
      addWalkIn({ clientName, membershipId: membership.id });
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="admin-queue-page">
      <AdminHeader
        name={barbershopName!}
        onLogout={() => logoutMutation.mutate()}
      />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        {/* Queue view */}
        <QueueBoard
          queueState={{
            barbershopName: barbershopName!,
            barbershopSlug: slug,
            currentCalled,
            waitingTurns,
          }}
          onCancel={(turnId) => cancelTurn(turnId)}
        />

        {/* Next button */}
        <NextButton
          onClick={() => callNext()}
          isDisabled={!currentCalled}
          isPending={isCallingNext}
          hasCurrentTurn={!!currentCalled}
          hasWaitingTurns={waitingTurns.length > 0}
        />

        {/* Walk-in form */}
        <WalkInForm
          onSubmit={handleWalkIn}
          isSubmitting={isAddingWalkIn}
          defaultName={`Cliente ${turns.length + 1}`}
          error={walkInError}
        />

        {/* Stats link */}
        <Link
          to={`/admin/${slug}/stats`}
          className="ht-btn-secondary text-center flex items-center justify-center gap-2"
          data-testid="stats-link"
        >
          <BarChart3 className="w-4 h-4" />
          Ver estadísticas
        </Link>
      </main>
    </div>
  );
}

interface AdminHeaderProps {
  name: string;
  onLogout: () => void;
}

function AdminHeader({ name, onLogout }: AdminHeaderProps) {
  return (
    <header className="bg-(--ht-primary) text-(--ht-surface) px-4 py-4">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{name}</h1>
          <p className="text-xs opacity-75">HayTurno Admin</p>
        </div>
        <button
          onClick={onLogout}
          className="text-(--ht-surface) opacity-75 hover:opacity-100 p-2"
          aria-label="Cerrar sesión"
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
