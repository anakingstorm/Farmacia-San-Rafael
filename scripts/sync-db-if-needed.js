const { execFileSync } = require('child_process');

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function shouldSync() {
  return process.env.VERCEL === '1' || process.env.RUN_DB_SYNC === '1';
}

async function main() {
  if (!shouldSync()) {
    console.log('[db-sync] Skipping schema sync (not running on Vercel).');
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.log('[db-sync] Skipping schema sync (DATABASE_URL is missing).');
    return;
  }

  console.log('[db-sync] Syncing Prisma schema with the database...');
  run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'db', 'push', '--skip-generate']);
  console.log('[db-sync] Schema sync completed.');
}

main().catch((error) => {
  console.error('[db-sync] Schema sync failed:', error);
  process.exit(1);
});
