import { useParams, Link } from 'react-router-dom';
import { usePublicQueue } from '../../hooks/usePublicQueue';
import { useQueueRealtime } from '../../hooks/useQueueRealtime';
import { useTheme } from '../../hooks/useTheme';
import { QueueBoard } from '../../components/queue/QueueBoard';
import { LoadingState } from '../../components/queue/LoadingState';
import { NotFoundPage } from './NotFoundPage';

export function PublicQueuePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { barbershopId, themeSettings, queueState, isLoading, notFound } = usePublicQueue(slug);

  // Apply barbershop theme
  useTheme(themeSettings);

  // Subscribe to realtime changes
  useQueueRealtime({ barbershopId, slug });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header name="HayTurno" />
        <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (notFound || !queueState) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="public-queue-page">
      <Header name={queueState.barbershopName} />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        <QueueBoard queueState={queueState} />

        <Link
          to={`/b/${slug}/join`}
          className="ht-btn-primary block text-center py-4 text-lg"
          data-testid="join-queue-link"
        >
          Unirse a la cola
        </Link>
      </main>
    </div>
  );
}

function Header({ name }: { name: string }) {
  return (
    <header className="bg-(--ht-primary) text-(--ht-surface) px-4 py-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold">{name}</h1>
        <p className="text-xs opacity-75 mt-1">HayTurno</p>
      </div>
    </header>
  );
}
