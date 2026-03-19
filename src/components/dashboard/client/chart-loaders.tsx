'use client';

import dynamic from 'next/dynamic';

const PerformanceChartRaw = dynamic(
  () => import('@/components/dashboard/performance-chart').then(mod => ({ default: mod.PerformanceChart })),
  { ssr: false }
);

const InventoryDistributionRaw = dynamic(
  () => import('@/components/dashboard/inventory-distribution').then(mod => ({ default: mod.InventoryDistribution })),
  { ssr: false }
);

const ChannelPerformanceRaw = dynamic(
  () => import('@/components/dashboard/channel-performance').then(mod => ({ default: mod.ChannelPerformance })),
  { ssr: false }
);

const GlowingBarChartRaw = dynamic(
  () => import('@/components/charts/GlowingBarChart').then(mod => ({ default: mod.GlowingBarChart })),
  { ssr: false }
);

const LiveActivityFeedRaw = dynamic(
  () => import('@/components/dashboard/live-activity-feed').then(mod => ({ default: mod.LiveActivityFeed })),
  { ssr: false }
);

export const PerformanceChartClient = PerformanceChartRaw;
export const InventoryDistributionClient = InventoryDistributionRaw;
export const ChannelPerformanceClient = ChannelPerformanceRaw;
export const GlowingBarChartClient = GlowingBarChartRaw;
export const LiveActivityFeedClient = LiveActivityFeedRaw;
