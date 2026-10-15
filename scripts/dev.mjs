// `npm run dev`: when DATABASE_URL points at this machine, start the bundled local
// Postgres (embedded-postgres, data kept in ./.local-db), apply migrations, then run
// `next dev`. Local development never depends on a cloud database branch, so it
// can't break because a Neon branch was deleted or its password changed.
// If DATABASE_URL points anywhere else, this just runs `next dev`.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

// fileURLToPath decodes %20 etc., so paths with spaces ("Real Estate") work.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbUrl = process.env.DATABASE_URL ?? "";
let parsed = null;
try {
  parsed = new URL(dbUrl);
} catch {
  // not a URL — fall through to plain `next dev`
}
const isLocal = parsed && ["localhost", "127.0.0.1"].includes(parsed.hostname);

let pg = null;

async function startLocalDatabase() {
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const databaseDir = path.join(root, ".local-db");
  const port = Number(parsed.port || 5432);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "agentprofile";

  pg = new EmbeddedPostgres({
    databaseDir,
    user: decodeURIComponent(parsed.username || "postgres"),
    password: decodeURIComponent(parsed.password || "postgres"),
    port,
    persistent: true,
    onLog: () => {},
  });

  if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
    console.log("▸ Creating the local database (first run only)…");
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase(database);
    console.log(`▸ Created database "${database}"`);
  } catch {
    // already exists
  }
  console.log(`▸ Local Postgres running on port ${port} (data in .local-db/)`);

  const migrate = spawnSync(path.join(root, "node_modules/.bin/prisma"), ["migrate", "deploy"], { cwd: root, stdio: "inherit" });
  if (migrate.status !== 0) throw new Error("prisma migrate deploy failed");
}

async function stopLocalDatabase() {
  if (!pg) return;
  const instance = pg;
  pg = null;
  try {
    await instance.stop();
  } catch {
    // already stopped
  }
}

async function main() {
  if (isLocal) {
    try {
      await startLocalDatabase();
    } catch (err) {
      console.error("✖ Couldn't start the local database:", err?.message ?? err);
      await stopLocalDatabase();
      process.exit(1);
    }
  }

  const next = spawn(path.join(root, "node_modules/.bin/next"), ["dev", ...process.argv.slice(2)], { cwd: root, stdio: "inherit" });

  const shutdown = async (code) => {
    next.kill("SIGTERM");
    await stopLocalDatabase();
    process.exit(code ?? 0);
  };
  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
  next.on("exit", (code) => shutdown(code ?? 0));
}

main();
