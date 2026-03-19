'use client';

import { useCallback, useEffect, useState } from 'react';

type Metrics = {
  liveOrders: number | null;
  avgTurnaroundLabel: string;
  limitedUnits: number | null;
  onDemandQueue: number | null;
};

const INITIAL_STATE: Metrics = {
  liveOrders: null,
  avgTurnaroundLabel: '--',
  limitedUnits: null,
  onDemandQueue: null,
};

export function useOperationalMetrics() {
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/metrics', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }
      const payload = await response.json();
      setMetrics({
        liveOrders: typeof payload.liveOrders === 'number' ? payload.liveOrders : 0,
        avgTurnaroundLabel: payload.avgTurnaroundLabel ?? '--',
        limitedUnits: typeof payload.limitedUnits === 'number' ? payload.limitedUnits : 0,
        onDemandQueue: typeof payload.onDemandQueue === 'number' ? payload.onDemandQueue : 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      if (!mounted) return;
      await load();
    };
    boot();
    const interval = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [load]);

  return { metrics, loading, refresh: load };
}
