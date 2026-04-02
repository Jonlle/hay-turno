import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useAdminUiStore } from '../../stores/adminUi';
import { useTheme } from '../../hooks/useTheme';
import { AdminStatsView } from '../../components/barber/AdminStatsView';
import { LoadingState } from '../../components/queue/LoadingState';
import { ArrowLeft } from 'lucide-react';

export function AdminStatsPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { statsRange, setStatsRange } = useAdminUiStore();

  const {
    barbershopId,
    barbershopName,
    themeSettings,
    isAuthorized,
    isLoading,
    needsLogin,
  } = useAuthGuard(slug);

  // Apply barbershop theme
  useTheme(themeSettings);

  // Redirect if login needed
  useEffect(() => {
    if (needsLogin) {
      navigate(`/admin/${slug}/login`, { replace: true });
    }
  }, [needsLogin, navigate, slug]);

  if (needsLogin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <StatsHeader name="..." />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <StatsHeader name="Acceso denegado" />
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

  return (
    <div className="min-h-screen flex flex-col" data-testid="admin-stats-page">
      <StatsHeader name={barbershopName!} />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        <AdminStatsView
          barbershopId={barbershopId!}
          currentRange={statsRange}
          onRangeChange={setStatsRange}
        />

        <Link
          to={`/admin/${slug}/queue`}
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

function StatsHeader({ name }: { name: string }) {
  return (
    <header className="bg-(--ht-primary) text-(--ht-surface) px-4 py-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-lg font-bold">Estadísticas</h1>
        <p className="text-xs opacity-75 mt-1">{name}</p>
      </div>
    </header>
  );
}
