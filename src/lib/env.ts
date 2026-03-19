'server-only';

import { getServerFeatureFlags, parseServerEnv } from '@/lib/env-config';

export const env = parseServerEnv(process.env);

export const featureFlags = getServerFeatureFlags(env);
