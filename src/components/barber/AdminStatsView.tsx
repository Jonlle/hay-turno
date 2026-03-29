import { useAttendedStats } from '../../hooks/useAttendStats';
import type { StatsRange } from '../../types';
import { StatsRangeToggle } from '../stats/StatsRangeToggle';
import { StatsSummary } from '../stats/StatsSummary';

interface AdminStatsViewProps {
  barbershopId: string;
  currentRange: StatsRange;
  onRangeChange: (range: StatsRange) => void;
}

export function AdminStatsView({
  barbershopId,
  currentRange,
  onRangeChange,
}: AdminStatsViewProps) {
  const { data, isLoading, error } = useAttendedStats(
    barbershopId,
    currentRange
  );

  return (
    <div className="space-y-4" data-testid="admin-stats-view">
      <StatsRangeToggle current={currentRange} onChange={onRangeChange} />

      {isLoading && (
        <div className="ht-card text-center py-8">
          <p className="text-sm text-gray-500">Cargando estadísticas...</p>
        </div>
      )}

      {error && (
        <div className="ht-card text-center py-8">
          <p className="text-sm text-red-500">
            No se pudieron cargar las estadísticas.
          </p>
        </div>
      )}

      {data && <StatsSummary stats={data} range={currentRange} />}
    </div>
  );
}
