import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { useQueueRealtime } from '../../hooks/useQueueRealtime';
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
    isAuthorized,
    isLoading: authLoading,
    needsLogin,
  } = useAuthGuard(slug);

  // Subscribe to realtime changes
  useQueueRealtime(barbershopId);

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
  } = useAdminQueue(barbershopId);

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
      navigate(`/admin/${slug}/login`, { replace: true });
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
              No tenés permisos para acceder a esta barbería.
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
        />

        {/* Next button */}
        <NextButton
          onClick={() => callNext()}
          isDisabled={!currentCalled}
          isPending={isCallingNext}
          hasWaitingTurns={waitingTurns.length > 0}
        />

        {/* Walk-in form */}
        <WalkInForm
          onSubmit={handleWalkIn}
          isSubmitting={isAddingWalkIn}
          error={walkInError}
        />

        {/* Stats link */}
        <Link
          to={`/admin/${slug}/stats`}
          className="ht-btn-secondary block text-center flex items-center justify-center gap-2"
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
    <header className="bg-[var(--ht-primary)] text-[var(--ht-surface)] px-4 py-4">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{name}</h1>
          <p className="text-xs opacity-75">HayTurno Admin</p>
        </div>
        <button
          onClick={onLogout}
          className="text-[var(--ht-surface)] opacity-75 hover:opacity-100 p-2"
          aria-label="Cerrar sesión"
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
