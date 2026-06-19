/**
 * Seed all three Floci clouds in parallel.
 * Run with: bun scripts/seed-all.ts
 */

import { seedGCP   } from "./seed-gcp";
import { seedAWS   } from "./seed-aws";
import { seedAzure } from "./seed-azure";

console.log("\x1b[1m⚡ Seeding all clouds in parallel…\x1b[0m");
const start = Date.now();

await Promise.all([seedGCP(), seedAWS(), seedAzure()]);

const secs = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\n\x1b[1m✓ Done in ${secs}s\x1b[0m\n`);
