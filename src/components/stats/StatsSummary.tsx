import type { AttendedStats } from '../../services/supabase/stats';
import type { StatsRange } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsSummaryProps {
  stats: AttendedStats;
  range: StatsRange;
}

export function StatsSummary({ stats, range }: StatsSummaryProps) {
  const { total, bySource, byTimeGroup } = stats;

  return (
    <div className="space-y-4" data-testid="stats-summary">
      {/* Total cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ht-card text-center">
          <p className="text-2xl font-bold text-[var(--ht-primary)]">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="ht-card text-center">
          <p className="text-2xl font-bold">{bySource.walkIn}</p>
          <p className="text-xs text-gray-500 mt-1">Walk-in</p>
        </div>
        <div className="ht-card text-center">
          <p className="text-2xl font-bold">{bySource.remote}</p>
          <p className="text-xs text-gray-500 mt-1">Remote</p>
        </div>
      </div>

      {/* Chart */}
      {byTimeGroup.length > 0 && (
        <div className="ht-card" data-testid="stats-chart">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Atendidos por {range === 'day' ? 'hora' : range === 'week' ? 'día' : 'mes'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTimeGroup}>
              <XAxis
                dataKey="key"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="var(--ht-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {byTimeGroup.length === 0 && (
        <div className="ht-card text-center py-8">
          <p className="text-sm text-gray-400">
            Sin datos para este rango
          </p>
        </div>
      )}
    </div>
  );
}
