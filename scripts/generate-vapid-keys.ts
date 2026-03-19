#!/usr/bin/env bun

/**
 * Generate VAPID keys for web push notifications
 * 
 * Usage: bun run scripts/generate-vapid-keys.ts
 * 
 * This script generates VAPID (Voluntary Application Server Identification) keys
 * required for web push notifications. The keys are used to identify your server
 * to push services and ensure secure communication.
 */

import webPush from 'web-push';

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Generated\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Public Key (use in client-side code):');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key (keep secret, use in server-side code):');
console.log(vapidKeys.privateKey);
console.log('\n═══════════════════════════════════════════════════════════════\n');
console.log('📝 Add these to your .env file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com\n`);
console.log('⚠️  Important:');
console.log('  - Keep the private key SECRET');
console.log('  - Never commit private keys to version control');
console.log('  - Use different keys for development and production');
console.log('  - VAPID_SUBJECT should be a mailto: URL or your website URL\n');

