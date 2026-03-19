import packageJson from '../../package.json';
import { prisma } from '@/lib/prisma';
import { env, featureFlags } from '@/lib/env';
import {
  getOperationalWarningCodes,
  getPushFeatureState,
  type FeatureState,
  type OperationalWarningCode,
} from '@/lib/ops-status';

type ServiceState = 'ok' | 'error';

export type ApplicationHealth = {
  status: 'ok' | 'degraded';
  checkedAt: string;
  environment: typeof env.NODE_ENV;
  version: string;
  uptimeSeconds: number;
  database: {
    status: ServiceState;
    latencyMs: number | null;
  };
  features: {
    imageUpload: FeatureState;
    pushNotifications: FeatureState;
  };
  warnings: OperationalWarningCode[];
};

export async function getApplicationHealth(): Promise<ApplicationHealth> {
  const checkedAt = new Date().toISOString();
  const startedAt = performance.now();
  let databaseStatus: ServiceState = 'ok';
  let databaseLatencyMs: number | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseLatencyMs = Math.round(performance.now() - startedAt);
  } catch (error) {
    console.error('[health] Health check failed:', error);
    databaseStatus = 'error';
  }

  return {
    status: databaseStatus === 'ok' ? 'ok' : 'degraded',
    checkedAt,
    environment: env.NODE_ENV,
    version: packageJson.version,
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: databaseStatus,
      latencyMs: databaseLatencyMs,
    },
    features: {
      imageUpload: featureFlags.imageUpload ? 'enabled' : 'disabled',
      pushNotifications: getPushFeatureState(env),
    },
    warnings: getOperationalWarningCodes(env),
  };
}
