/**
 * Seed script for Floci-GCP local services.
 * Run with: bun scripts/seed-gcp.ts
 */

const BASE = "http://localhost:4588";
const PROJECT = "floci-local";
const LOCATION = "us-central1";

// ─── HTTP helpers ────────────────────────────────────────────────────────────

type Result = { ok: boolean; status: number; body: unknown };

async function api(
  method: string,
  path: string,
  body?: unknown,
): Promise<Result> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = await res.text().catch(() => "(no body)");
  }
  return { ok: res.ok, status: res.status, body: json };
}

async function get(path: string) { return api("GET", path); }
async function post(path: string, body?: unknown) { return api("POST", path, body); }
async function put(path: string, body?: unknown) { return api("PUT", path, body ?? {}); }
async function patch(path: string, body: unknown) { return api("PATCH", path, body); }

// ─── Logging ─────────────────────────────────────────────────────────────────

const OK   = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const SKIP = "\x1b[33m~\x1b[0m";

function header(name: string) {
  console.log(`\n\x1b[1;36m══ GCP — ${name} \x1b[0m`);
}

function log(icon: string, msg: string, detail?: unknown) {
  const d = detail
    ? "  \x1b[90m" + JSON.stringify(detail).slice(0, 120) + "\x1b[0m"
    : "";
  console.log(`  ${icon} ${msg}${d}`);
}

function logResult(label: string, r: Result) {
  if (r.ok)          log(OK,   label, r.body);
  else if (r.status === 409) log(SKIP, `${label}  [already exists]`);
  else               log(FAIL, `${label} [HTTP ${r.status}]`, r.body);
}

// ─── 1. Cloud Storage ────────────────────────────────────────────────────────

async function seedStorage() {
  header("Cloud Storage  /storage/v1");

  const buckets = ["floci-demo-bucket", "floci-assets", "floci-backups"];

  for (const name of buckets) {
    const r = await post(`/storage/v1/b?project=${PROJECT}`, { name });
    logResult(`create bucket  ${name}`, r);
  }

  // Upload objects into first bucket
  const objects: [string, string, string][] = [
    ["floci-demo-bucket", "hello.txt", "Hello from Floci-GCP!"],
    ["floci-demo-bucket", "data/sample.json", JSON.stringify({ seed: true, ts: Date.now() })],
    ["floci-assets",      "logo.svg", "<svg xmlns='http://www.w3.org/2000/svg'/>"],
  ];

  for (const [bucket, key, content] of objects) {
    const r = await fetch(
      `${BASE}/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(key)}`,
      { method: "POST", headers: { "Content-Type": "text/plain" }, body: content },
    );
    const body = await r.json().catch(() => ({}));
    log(r.ok ? OK : FAIL, `upload  ${bucket}/${key}`, body);
  }
}

// ─── 2. Pub/Sub ──────────────────────────────────────────────────────────────

async function seedPubSub() {
  header("Pub/Sub  /v1beta2/projects/…/topics  (gRPC service — REST bridge)");

  const topics = ["demo-events", "order-created", "user-signups"];

  for (const topic of topics) {
    // Pub/Sub REST: PUT /v1/projects/{project}/topics/{topic}
    // v1 returns 404; try v1beta2 which Floci routes differently
    let r = await put(`/v1/projects/${PROJECT}/topics/${topic}`);
    if (!r.ok) r = await post(`/v1/projects/${PROJECT}/topics`, { name: `projects/${PROJECT}/topics/${topic}` });
    logResult(`create topic  ${topic}`, r);
  }

  // Subscription
  const r = await put(`/v1/projects/${PROJECT}/subscriptions/demo-sub`, {
    topic: `projects/${PROJECT}/topics/demo-events`,
    ackDeadlineSeconds: 30,
  });
  logResult("create subscription  demo-sub", r);

  // Publish a message
  const pub = await post(`/v1/projects/${PROJECT}/topics/demo-events:publish`, {
    messages: [
      { data: btoa(JSON.stringify({ event: "seed", source: "floci" })) },
    ],
  });
  logResult("publish message to  demo-events", pub);
}

// ─── 3. Firestore ────────────────────────────────────────────────────────────

async function seedFirestore() {
  header("Firestore  /v1beta1/projects/…/databases/(default)/documents");

  // v1beta1 is the path that Floci recognizes
  const base = `/v1beta1/projects/${PROJECT}/databases/(default)/documents`;
  const docs = [
    { collection: "users",    id: "user-1", fields: { name: "Alice",   role: "admin"  } },
    { collection: "users",    id: "user-2", fields: { name: "Bob",     role: "viewer" } },
    { collection: "products", id: "prod-1", fields: { sku: "GCP-001",  price: 9.99    } },
    { collection: "products", id: "prod-2", fields: { sku: "GCP-002",  price: 19.99   } },
  ];

  for (const doc of docs) {
    const fields = Object.fromEntries(
      Object.entries(doc.fields).map(([k, v]) => [
        k,
        typeof v === "number"
          ? { doubleValue: v }
          : { stringValue: String(v) },
      ]),
    );
    // POST to collection creates a document with specific ID via ?documentId=
    const r = await fetch(
      `${BASE}${base}/${doc.collection}?documentId=${doc.id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      },
    );
    const body = await r.json().catch(() => ({}));
    log(r.ok ? OK : FAIL, `write  ${doc.collection}/${doc.id}`, body);
  }

  // List collection
  const list = await get(`${base}/users`);
  logResult("list  users", list);
}

// ─── 4. Datastore ────────────────────────────────────────────────────────────

async function seedDatastore() {
  header("Datastore  /v1/projects/…:commit");

  // Insert entity via commit (upsert mutation)
  const entities = [
    { kind: "Task",    name: "task-1", props: { title: "Build Floci UI", done: false } },
    { kind: "Task",    name: "task-2", props: { title: "Write seeder",   done: true  } },
    { kind: "Product", name: "sku-1",  props: { name: "Widget",          price: 5.0  } },
  ];

  for (const e of entities) {
    const r = await post(`/v1/projects/${PROJECT}:commit`, {
      mode: "NON_TRANSACTIONAL",
      mutations: [
        {
          upsert: {
            key: { partitionId: { projectId: PROJECT }, path: [{ kind: e.kind, name: e.name }] },
            properties: Object.fromEntries(
              Object.entries(e.props).map(([k, v]) => [
                k,
                typeof v === "boolean"
                  ? { booleanValue: v }
                  : typeof v === "number"
                  ? { doubleValue: v }
                  : { stringValue: String(v) },
              ]),
            ),
          },
        },
      ],
    });
    logResult(`upsert  ${e.kind}/${e.name}`, r);
  }

  // Run query
  const q = await post(`/v1/projects/${PROJECT}:runQuery`, {
    gqlQuery: { queryString: "SELECT * FROM Task" },
  });
  logResult("runQuery  SELECT * FROM Task", q);
}

// ─── 5. Secret Manager ───────────────────────────────────────────────────────

async function seedSecretManager() {
  header("Secret Manager  /v1/projects/…/secrets");

  const secrets: [string, string][] = [
    ["db-password",  "super-secret-db-pass-123"],
    ["api-key",      "sk-floci-demo-key-abc"],
    ["jwt-secret",   "jwt-signing-secret-xyz"],
  ];

  for (const [id, value] of secrets) {
    // Create secret
    const create = await post(
      `/v1/projects/${PROJECT}/secrets?secretId=${id}`,
      { replication: { automatic: {} } },
    );
    logResult(`create secret  ${id}`, create);

    // Add version
    const version = await post(`/v1/projects/${PROJECT}/secrets/${id}:addVersion`, {
      payload: { data: btoa(value) },
    });
    logResult(`add version  ${id}`, version);
  }
}

// ─── 6. IAM ──────────────────────────────────────────────────────────────────

async function seedIAM() {
  header("IAM  /v1/projects/…/serviceAccounts");

  const accounts = [
    { accountId: "floci-app-sa",    displayName: "Floci App Service Account"  },
    { accountId: "floci-worker-sa", displayName: "Floci Worker Service Account"},
    { accountId: "floci-deploy-sa", displayName: "Floci Deploy Service Account"},
  ];

  for (const sa of accounts) {
    const r = await post(`/v1/projects/${PROJECT}/serviceAccounts`, {
      accountId: sa.accountId,
      serviceAccount: { displayName: sa.displayName },
    });
    logResult(`create service account  ${sa.accountId}`, r);
  }

  const list = await get(`/v1/projects/${PROJECT}/serviceAccounts`);
  logResult("list service accounts", list);
}

// ─── 7. Managed Kafka ────────────────────────────────────────────────────────

async function seedKafka() {
  header("Managed Kafka  /v1/projects/…/locations/…/clusters");

  // Create cluster
  const cluster = await post(
    `/v1/projects/${PROJECT}/locations/${LOCATION}/clusters?clusterId=floci-kafka`,
    {
      name: `projects/${PROJECT}/locations/${LOCATION}/clusters/floci-kafka`,
      capacityConfig: { vcpuCount: "3", memoryBytes: "3221225472" },
      gcpConfig: { accessConfig: { networkConfigs: [{ subnet: "projects/floci-local/regions/us-central1/subnetworks/default" }] } },
    },
  );
  logResult("create cluster  floci-kafka", cluster);

  // Create topics in cluster
  const topics = ["orders", "events", "dlq"];
  for (const topic of topics) {
    const r = await post(
      `/v1/projects/${PROJECT}/locations/${LOCATION}/clusters/floci-kafka/topics?topicId=${topic}`,
      { partitionCount: 3, replicationFactor: 1, configs: {} },
    );
    logResult(`create topic  ${topic}`, r);
  }

  const list = await get(`/v1/projects/${PROJECT}/locations/${LOCATION}/clusters`);
  logResult("list clusters", list);
}

// ─── 8. Cloud Tasks ──────────────────────────────────────────────────────────

async function seedCloudTasks() {
  header("Cloud Tasks  /v2/projects/…/locations/…/queues");

  const queues = [
    { id: "email-queue",      maxDispatchesPerSecond: 10 },
    { id: "report-queue",     maxDispatchesPerSecond: 5  },
    { id: "webhook-queue",    maxDispatchesPerSecond: 20 },
  ];

  for (const q of queues) {
    const r = await post(
      `/v2/projects/${PROJECT}/locations/${LOCATION}/queues`,
      {
        name: `projects/${PROJECT}/locations/${LOCATION}/queues/${q.id}`,
        rateLimits: { maxDispatchesPerSecond: q.maxDispatchesPerSecond },
      },
    );
    logResult(`create queue  ${q.id}`, r);
  }

  // Create a task in email-queue
  const task = await post(
    `/v2/projects/${PROJECT}/locations/${LOCATION}/queues/email-queue/tasks`,
    {
      task: {
        httpRequest: {
          url: "http://localhost:3000/hooks/email",
          httpMethod: "POST",
          body: btoa(JSON.stringify({ to: "user@example.com", template: "welcome" })),
        },
      },
    },
  );
  logResult("create task in  email-queue", task);
}

// ─── 9. Cloud Run ────────────────────────────────────────────────────────────

async function seedCloudRun() {
  header("Cloud Run  /v2/projects/…/locations/…/services");

  const services = [
    {
      id: "floci-api",
      image: "gcr.io/floci-local/api:latest",
      port: 8080,
      env: [{ name: "ENV", value: "local" }],
    },
    {
      id: "floci-worker",
      image: "gcr.io/floci-local/worker:latest",
      port: 9090,
      env: [{ name: "ENV", value: "local" }],
    },
  ];

  for (const svc of services) {
    const r = await post(
      `/v2/projects/${PROJECT}/locations/${LOCATION}/services?serviceId=${svc.id}`,
      {
        template: {
          containers: [
            {
              image: svc.image,
              ports: [{ containerPort: svc.port }],
              env: svc.env,
            },
          ],
        },
      },
    );
    logResult(`create service  ${svc.id}`, r);
  }

  const list = await get(`/v2/projects/${PROJECT}/locations/${LOCATION}/services`);
  logResult("list services", list);
}

// ─── 10. Cloud SQL ───────────────────────────────────────────────────────────

async function seedCloudSQL() {
  header("Cloud SQL  /sql/v1beta4/projects/…/instances");

  const instances = [
    { name: "floci-pg-main", version: "POSTGRES_15", tier: "db-f1-micro" },
    { name: "floci-pg-read", version: "POSTGRES_15", tier: "db-f1-micro" },
  ];

  for (const inst of instances) {
    const r = await post(`/sql/v1beta4/projects/${PROJECT}/instances`, {
      name: inst.name,
      databaseVersion: inst.version,
      settings: { tier: inst.tier },
      region: LOCATION,
    });
    logResult(`create instance  ${inst.name}`, r);
  }

  // Create a database inside main instance
  const db = await post(
    `/sql/v1beta4/projects/${PROJECT}/instances/floci-pg-main/databases`,
    { name: "app_db", instance: "floci-pg-main", project: PROJECT },
  );
  logResult("create database  app_db  in  floci-pg-main", db);

  const list = await get(`/sql/v1beta4/projects/${PROJECT}/instances`);
  logResult("list instances", list);
}

// ─── 11. Cloud Functions ─────────────────────────────────────────────────────

async function seedCloudFunctions() {
  header("Cloud Functions  /v2/projects/…/locations/…/functions");

  const functions = [
    {
      id: "hello-http",
      entryPoint: "helloHttp",
      runtime: "nodejs20",
      trigger: "HTTP",
    },
    {
      id: "process-event",
      entryPoint: "processEvent",
      runtime: "nodejs20",
      trigger: "PUBSUB",
    },
  ];

  for (const fn of functions) {
    const r = await post(
      `/v2/projects/${PROJECT}/locations/${LOCATION}/functions?functionId=${fn.id}`,
      {
        name: `projects/${PROJECT}/locations/${LOCATION}/functions/${fn.id}`,
        buildConfig: {
          runtime: fn.runtime,
          entryPoint: fn.entryPoint,
          source: { storageSource: { bucket: "floci-assets", object: "functions/src.zip" } },
        },
        serviceConfig: { maxInstanceCount: 5 },
      },
    );
    logResult(`create function  ${fn.id}`, r);
  }

  const list = await get(`/v2/projects/${PROJECT}/locations/${LOCATION}/functions`);
  logResult("list functions", list);
}

// ─── 12. Cloud KMS ───────────────────────────────────────────────────────────

async function seedKMS() {
  header("Cloud KMS  /v1/projects/…/locations/global/keyRings");

  const rings = ["app-keyring", "backup-keyring"];

  for (const ring of rings) {
    const r = await post(
      `/v1/projects/${PROJECT}/locations/global/keyRings?keyRingId=${ring}`,
      {},
    );
    logResult(`create key ring  ${ring}`, r);
  }

  // Create crypto keys inside app-keyring
  const keys: { id: string; purpose: string; algorithm?: string }[] = [
    { id: "data-encryption-key", purpose: "ENCRYPT_DECRYPT" },
    { id: "signing-key",         purpose: "ASYMMETRIC_SIGN", algorithm: "RSA_SIGN_PKCS1_2048_SHA256" },
  ];

  for (const key of keys) {
    const body: Record<string, unknown> = { purpose: key.purpose };
    if (key.algorithm) {
      body.versionTemplate = { algorithm: key.algorithm };
    }
    const r = await post(
      `/v1/projects/${PROJECT}/locations/global/keyRings/app-keyring/cryptoKeys?cryptoKeyId=${key.id}`,
      body,
    );
    logResult(`create crypto key  ${key.id}  (${key.purpose})`, r);
  }

  const list = await get(`/v1/projects/${PROJECT}/locations/global/keyRings`);
  logResult("list key rings", list);
}

// ─── 13. Cloud Logging ───────────────────────────────────────────────────────

async function seedLogging() {
  header("Cloud Logging  /v2/entries:write");

  const entries = [
    { severity: "INFO",    payload: { service: "floci-api",    message: "Server started on :8080" } },
    { severity: "WARNING", payload: { service: "floci-api",    message: "High memory usage: 85%" } },
    { severity: "ERROR",   payload: { service: "floci-worker", message: "Job failed after 3 retries" } },
    { severity: "DEBUG",   payload: { service: "floci-deploy", message: "Deploying revision v42" } },
    { severity: "INFO",    payload: { service: "floci-api",    message: "Request handled in 120ms" } },
  ];

  const r = await post(`/v2/entries:write`, {
    logName: `projects/${PROJECT}/logs/floci-app`,
    resource: { type: "global", labels: { project_id: PROJECT } },
    entries: entries.map((e) => ({
      severity: e.severity,
      jsonPayload: e.payload,
      timestamp: new Date().toISOString(),
    })),
  });
  logResult(`write ${entries.length} log entries`, r);

  // List logs
  const logs = await get(`/v2/projects/${PROJECT}/logs`);
  logResult("list logs", logs);
}

// ─── 14. Cloud Monitoring ────────────────────────────────────────────────────

async function seedMonitoring() {
  header("Cloud Monitoring  /v3/projects/…/timeSeries");

  const now = new Date().toISOString();

  const r = await post(`/v3/projects/${PROJECT}/timeSeries`, {
    timeSeries: [
      {
        metric: {
          type: "custom.googleapis.com/floci/request_count",
          labels: { service: "floci-api", env: "local" },
        },
        resource: { type: "global", labels: { project_id: PROJECT } },
        points: [
          { interval: { endTime: now }, value: { doubleValue: 142.0 } },
        ],
      },
      {
        metric: {
          type: "custom.googleapis.com/floci/error_rate",
          labels: { service: "floci-worker", env: "local" },
        },
        resource: { type: "global", labels: { project_id: PROJECT } },
        points: [
          { interval: { endTime: now }, value: { doubleValue: 0.02 } },
        ],
      },
      {
        metric: {
          type: "custom.googleapis.com/floci/latency_ms",
          labels: { service: "floci-api", endpoint: "/api/v1/data" },
        },
        resource: { type: "global", labels: { project_id: PROJECT } },
        points: [
          { interval: { endTime: now }, value: { doubleValue: 87.4 } },
        ],
      },
    ],
  });
  logResult("write 3 time series", r);

  const list = await get(`/v3/projects/${PROJECT}/timeSeries?filter=metric.type%3D"custom.googleapis.com/floci/request_count"`);
  logResult("list time series (request_count)", list);
}

// ─── 15. Cloud Scheduler ─────────────────────────────────────────────────────

async function seedScheduler() {
  header("Cloud Scheduler  /v1/projects/…/locations/…/jobs");

  const jobs = [
    {
      name: `projects/${PROJECT}/locations/${LOCATION}/jobs/daily-report`,
      schedule: "0 9 * * *",
      timeZone: "America/Los_Angeles",
      httpTarget: { uri: "http://localhost:8080/jobs/daily-report", httpMethod: "POST" },
    },
    {
      name: `projects/${PROJECT}/locations/${LOCATION}/jobs/cleanup-cron`,
      schedule: "0 */6 * * *",
      timeZone: "UTC",
      httpTarget: { uri: "http://localhost:8080/jobs/cleanup", httpMethod: "POST" },
    },
    {
      name: `projects/${PROJECT}/locations/${LOCATION}/jobs/health-ping`,
      schedule: "*/5 * * * *",
      timeZone: "UTC",
      httpTarget: { uri: "http://localhost:8080/health", httpMethod: "GET" },
    },
  ];

  for (const job of jobs) {
    const r = await post(`/v1/projects/${PROJECT}/locations/${LOCATION}/jobs`, job);
    logResult(`create job  ${job.name.split("/").pop()}`, r);
  }

  const list = await get(`/v1/projects/${PROJECT}/locations/${LOCATION}/jobs`);
  logResult("list jobs", list);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function seedGCP() {
  const health = await fetch(`${BASE}/health`).then((r) => r.json()).catch(() => null);
  if (!health) {
    console.log("\n\x1b[31mCannot reach Floci-GCP at " + BASE + "\x1b[0m");
    return;
  }

  console.log(`\n\x1b[1;36m▶  GCP  \x1b[0m${BASE}  project=${PROJECT}  v${(health as any).version}`);

  await seedStorage();
  await seedPubSub();
  await seedFirestore();
  await seedDatastore();
  await seedSecretManager();
  await seedIAM();
  await seedKafka();
  await seedCloudTasks();
  await seedCloudRun();
  await seedCloudSQL();
  await seedCloudFunctions();
  await seedKMS();
  await seedLogging();
  await seedMonitoring();
  await seedScheduler();
}

if (import.meta.main) {
  seedGCP();
}
