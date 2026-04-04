import {
  getTimeGroupingKey,
  groupDatesByRange,
  groupRecordsByRange,
  startOfColombiaDayUTC,
} from './time';

describe('time grouping helpers', () => {
  it('groups a UTC timestamp by Colombia day', () => {
    expect(getTimeGroupingKey('2026-03-27T04:30:00.000Z', 'day')).toBe('2026-03-26');
  });

  it('uses Monday as the Colombia week start', () => {
    expect(getTimeGroupingKey('2026-03-29T15:00:00.000Z', 'week')).toBe('2026-03-23');
    expect(getTimeGroupingKey('2026-03-30T05:30:00.000Z', 'week')).toBe('2026-03-30');
  });

  it('groups a UTC timestamp by Colombia month', () => {
    expect(getTimeGroupingKey('2026-04-01T02:00:00.000Z', 'month')).toBe('2026-03');
    expect(getTimeGroupingKey('2026-04-01T07:00:00.000Z', 'month')).toBe('2026-04');
  });

  it('counts grouped dates in sorted order', () => {
    expect(
      groupDatesByRange(
        [
          '2026-03-27T04:30:00.000Z',
          '2026-03-27T13:00:00.000Z',
          '2026-04-01T07:00:00.000Z',
        ],
        'day',
      ),
    ).toEqual([
      { key: '2026-03-26', count: 1 },
      { key: '2026-03-27', count: 1 },
      { key: '2026-04-01', count: 1 },
    ]);
  });

  it('returns midnight Colombia as UTC (05:00 UTC) for startOfColombiaDayUTC', () => {
    // 2026-03-27T13:00:00Z is 08:00 COT on Mar 27 → midnight COT = 05:00 UTC same day
    const result = startOfColombiaDayUTC('2026-03-27T13:00:00.000Z');
    expect(result.toISOString()).toBe('2026-03-27T05:00:00.000Z');
  });

  it('handles late-night UTC that is previous day in Colombia', () => {
    // 2026-03-27T04:30:00Z is 23:30 COT on Mar 26 → midnight COT Mar 26 = 2026-03-26T05:00:00Z
    const result = startOfColombiaDayUTC('2026-03-27T04:30:00.000Z');
    expect(result.toISOString()).toBe('2026-03-26T05:00:00.000Z');
  });

  it('skips records without completed dates when grouping', () => {
    const records = [
      { completedAt: '2026-03-27T13:00:00.000Z' },
      { completedAt: null },
      { completedAt: '2026-03-27T18:00:00.000Z' },
    ];

    expect(groupRecordsByRange(records, (record) => record.completedAt, 'day')).toEqual([
      { key: '2026-03-27', count: 2 },
    ]);
  });
});
