/**
 * Seed script for Floci-AZ (Azurite-compatible) local services.
 * Run with: bun scripts/seed-azure.ts
 */

const BASE    = "http://localhost:4577";
const ACCOUNT = "devstoreaccount1";

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function azureReq(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: string | Uint8Array,
): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(`${BASE}/${ACCOUNT}${path}`, {
    method,
    headers: {
      "x-ms-version": "2023-08-03",
      "x-ms-date": new Date().toUTCString(),
      ...headers,
    },
    body,
  });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, text };
}

// ─── Logging ─────────────────────────────────────────────────────────────────

const OK   = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const SKIP = "\x1b[33m~\x1b[0m";

function header(name: string) {
  console.log(`\n\x1b[1;34m══ Azure — ${name} \x1b[0m`);
}

function log(icon: string, msg: string, detail?: string) {
  const d = detail ? "  \x1b[90m" + detail.slice(0, 100) + "\x1b[0m" : "";
  console.log(`  ${icon} ${msg}${d}`);
}

function logR(label: string, r: { ok: boolean; status: number; text: string }) {
  if (r.ok)           log(OK,   label);
  else if (r.status === 409) log(SKIP, `${label}  [already exists]`);
  else                log(FAIL, `${label} [HTTP ${r.status}]`, r.text.slice(0, 80));
}

// ─── 1. Blob Storage — Containers & Blobs ────────────────────────────────────

async function seedBlobStorage() {
  header("Blob Storage");

  const containers = ["assets", "uploads", "backups", "exports", "thumbnails"];

  for (const c of containers) {
    const r = await azureReq("PUT", `/${c}?restype=container`);
    logR(`create container  ${c}`, r);
  }

  // Upload blobs
  const blobs: [string, string, string, string][] = [
    ["assets",    "logo.svg",          "image/svg+xml",       "<svg xmlns='http://www.w3.org/2000/svg'/>"],
    ["assets",    "styles/main.css",   "text/css",            "body { margin: 0; font-family: sans-serif; }"],
    ["uploads",   "2026/report.csv",   "text/csv",            "id,name,value\n1,alpha,100\n2,beta,200"],
    ["uploads",   "2026/data.json",    "application/json",    JSON.stringify({ seeded: true, ts: Date.now() })],
    ["backups",   "db-snapshot.sql",   "application/sql",     "-- Azure Blob backup placeholder"],
    ["exports",   "users-export.csv",  "text/csv",            "userId,name,email\nu-001,Alice,alice@test.com"],
    ["thumbnails","img-001-thumb.jpg", "image/jpeg",          "JPEG_PLACEHOLDER"],
  ];

  for (const [container, blob, contentType, body] of blobs) {
    const r = await azureReq(
      "PUT",
      `/${container}/${blob}`,
      {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": contentType,
        "Content-Length": String(new TextEncoder().encode(body).length),
      },
      body,
    );
    logR(`upload  ${container}/${blob}`, r);
  }

  // List containers
  const list = await azureReq("GET", "?comp=list");
  log(list.ok ? OK : FAIL, "list containers");
}

// ─── 2. Queue Storage ────────────────────────────────────────────────────────

async function seedQueueStorage() {
  header("Queue Storage (Azure Queue)");

  // Queue Storage is under a different endpoint path structure
  const queues = ["orders-queue", "notifications-queue", "email-queue", "retry-queue"];

  for (const q of queues) {
    // Azure Queue REST: PUT /{account}/{queue}?restype=…  — actually queues use their own service
    const res = await fetch(`${BASE}/${ACCOUNT}/${q}`, {
      method: "PUT",
      headers: {
        "x-ms-version": "2023-08-03",
        "x-ms-date": new Date().toUTCString(),
      },
    });
    const text = await res.text().catch(() => "");
    logR(`create queue  ${q}`, { ok: res.ok, status: res.status, text });
  }

  // Send messages to a queue
  const msgs = [
    { queue: "orders-queue",        msg: JSON.stringify({ orderId: "az-001", status: "pending" }) },
    { queue: "notifications-queue", msg: JSON.stringify({ type: "email",     to: "user@test.com" }) },
  ];

  for (const { queue, msg } of msgs) {
    const encoded = btoa(msg);
    const body = `<QueueMessage><MessageText>${encoded}</MessageText></QueueMessage>`;
    const res = await fetch(`${BASE}/${ACCOUNT}/${queue}/messages`, {
      method: "POST",
      headers: {
        "x-ms-version": "2023-08-03",
        "Content-Type": "application/xml",
        "Content-Length": String(new TextEncoder().encode(body).length),
      },
      body,
    });
    const text = await res.text().catch(() => "");
    logR(`enqueue message → ${queue}`, { ok: res.ok, status: res.status, text });
  }
}

// ─── 3. Table Storage ────────────────────────────────────────────────────────

async function seedTableStorage() {
  header("Table Storage");

  // Azure Table Storage uses a different API path: /Tables
  const tables = ["Users", "Products", "Sessions"];

  for (const t of tables) {
    const body = JSON.stringify({ TableName: t });
    const res = await fetch(`${BASE}/${ACCOUNT}/Tables`, {
      method: "POST",
      headers: {
        "x-ms-version": "2023-08-03",
        "Content-Type": "application/json",
        "Accept": "application/json;odata=nometadata",
      },
      body,
    });
    const text = await res.text().catch(() => "");
    logR(`create table  ${t}`, { ok: res.ok, status: res.status, text });
  }

  // Insert entities
  const entities = [
    { table: "Users",    row: { PartitionKey: "users", RowKey: "u-001", Name: "Alice", Role: "admin"  } },
    { table: "Users",    row: { PartitionKey: "users", RowKey: "u-002", Name: "Bob",   Role: "viewer" } },
    { table: "Products", row: { PartitionKey: "prod",  RowKey: "p-001", Name: "Widget", Price: 9.99  } },
  ];

  for (const { table, row } of entities) {
    const body = JSON.stringify(row);
    const res = await fetch(`${BASE}/${ACCOUNT}/${table}`, {
      method: "POST",
      headers: {
        "x-ms-version": "2023-08-03",
        "Content-Type": "application/json",
        "Accept": "application/json;odata=nometadata",
      },
      body,
    });
    const text = await res.text().catch(() => "");
    logR(`insert entity  ${table}/${row.RowKey}`, { ok: res.ok, status: res.status, text });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function seedAzure() {
  // Health check — try the account endpoint
  const health = await fetch(`${BASE}/${ACCOUNT}?comp=list`, {
    headers: { "x-ms-version": "2023-08-03" },
  }).catch(() => null);

  if (!health) {
    console.log("\n\x1b[31mCannot reach Floci-AZ at " + BASE + "\x1b[0m");
    return;
  }

  console.log("\n\x1b[1;34m▶  Azure  \x1b[0m" + BASE + "  account=" + ACCOUNT);

  await seedBlobStorage();
  await seedQueueStorage();
  await seedTableStorage();
}

if (import.meta.main) {
  seedAzure();
}
