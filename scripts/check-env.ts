import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadDotenv } from 'dotenv';
import { ZodError } from 'zod';
import { getServerFeatureFlags, parseServerEnv, type ServerEnv } from '../src/lib/env-config';

const cwd = process.cwd();
const envFiles = ['.env', '.env.local'];

function loadEnvFiles() {
  const loadedFiles: string[] = [];

  for (const file of envFiles) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    loadDotenv({ path: filePath, override: true });
    loadedFiles.push(file);
  }

  return loadedFiles;
}

function getFeatureWarnings(env: ServerEnv) {
  const warnings: string[] = [];
  const hasAnyPushConfig = Boolean(
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      env.VAPID_PUBLIC_KEY ||
      env.VAPID_PRIVATE_KEY ||
      env.VAPID_SUBJECT
  );
  const flags = getServerFeatureFlags(env);

  if (hasAnyPushConfig && !flags.pushNotifications) {
    warnings.push(
      'Push notifications are only partially configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY together.',
    );
  }

  if (!env.IMGBB_API_KEY) {
    warnings.push('Image uploads are disabled until IMGBB_API_KEY is set.');
  }

  if (!env.DEMO_ADMIN_PASSWORD) {
    warnings.push('Local demo login seeding is disabled until DEMO_ADMIN_PASSWORD is set.');
  }

  return { flags, warnings };
}

function printValidationFailure(error: ZodError) {
  console.error('Environment validation failed.');
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'env';
    console.error(`- ${field}: ${issue.message}`);
  }
}

const loadedFiles = loadEnvFiles();

try {
  const env = parseServerEnv(process.env);
  const { flags, warnings } = getFeatureWarnings(env);

  console.log('Environment validation passed.');
  console.log(
    `Loaded env files: ${loadedFiles.length > 0 ? loadedFiles.join(', ') : 'none (using existing process env only)'}`,
  );
  console.log(`Image uploads: ${flags.imageUpload ? 'enabled' : 'disabled'}`);
  console.log(`Push notifications: ${flags.pushNotifications ? 'enabled' : 'disabled'}`);

  if (warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
} catch (error) {
  if (error instanceof ZodError) {
    printValidationFailure(error);
    process.exit(1);
  }

  throw error;
}
