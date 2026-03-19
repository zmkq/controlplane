import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadDotenv } from 'dotenv';
import { ZodError } from 'zod';
import { parseServerEnv } from '../src/lib/env-config';
import { getOperationalWarnings, getPushFeatureState } from '../src/lib/ops-status';

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
  const warnings = getOperationalWarnings(env);
  const pushState = getPushFeatureState(env);

  console.log('Environment validation passed.');
  console.log(
    `Loaded env files: ${loadedFiles.length > 0 ? loadedFiles.join(', ') : 'none (using existing process env only)'}`,
  );
  console.log(`Image uploads: ${env.IMGBB_API_KEY ? 'enabled' : 'disabled'}`);
  console.log(`Push notifications: ${pushState}`);

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
