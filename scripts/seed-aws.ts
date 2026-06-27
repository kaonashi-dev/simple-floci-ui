/**
 * Seed script for Floci-AWS (LocalStack-compatible) local services.
 * Run with: bun scripts/seed-aws.ts
 */

import { SQSClient, CreateQueueCommand, SendMessageCommand, ListQueuesCommand } from "@aws-sdk/client-sqs";
import { S3Client, CreateBucketCommand, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, CreateTopicCommand, PublishCommand, ListTopicsCommand } from "@aws-sdk/client-sns";
import { SecretsManagerClient, CreateSecretCommand, ListSecretsCommand } from "@aws-sdk/client-secrets-manager";
import { SSMClient, PutParameterCommand, GetParametersByPathCommand } from "@aws-sdk/client-ssm";
import { IAMClient, CreateUserCommand, CreateRoleCommand, ListUsersCommand } from "@aws-sdk/client-iam";
import { LambdaClient, CreateFunctionCommand, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { CloudWatchLogsClient, CreateLogGroupCommand, PutLogEventsCommand, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { EventBridgeClient, CreateEventBusCommand, PutRuleCommand, ListEventBusesCommand } from "@aws-sdk/client-eventbridge";
import { KMSClient, CreateKeyCommand, CreateAliasCommand, ListKeysCommand } from "@aws-sdk/client-kms";

// ─── Config ──────────────────────────────────────────────────────────────────

const ENDPOINT = "http://localhost:59595";
const REGION   = "us-east-1";
const CREDS    = { accessKeyId: "test", secretAccessKey: "test" };

const cfg = {
  endpoint: ENDPOINT,
  region: REGION,
  credentials: CREDS,
  forcePathStyle: true,
};

const cfgNoPath = { ...cfg, forcePathStyle: undefined };

// ─── Logging ─────────────────────────────────────────────────────────────────

const OK   = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const SKIP = "\x1b[33m~\x1b[0m";

function header(name: string) {
  console.log(`\n\x1b[1;35m══ AWS — ${name} \x1b[0m`);
}

function ok(msg: string, detail?: unknown) {
  const d = detail ? "  \x1b[90m" + JSON.stringify(detail).slice(0, 100) + "\x1b[0m" : "";
  console.log(`  ${OK} ${msg}${d}`);
}

function skip(msg: string) { console.log(`  ${SKIP} ${msg}  [already exists]`); }

function fail(msg: string, err: unknown) {
  const txt = err instanceof Error ? err.message : String(err);
  const alreadyExists = /already exists|EntityAlreadyExists|ResourceInUseException|BucketAlreadyExists|BucketAlreadyOwnedByYou/i.test(txt);
  if (alreadyExists) { skip(msg); return; }
  console.log(`  ${FAIL} ${msg}  \x1b[31m${txt.slice(0, 120)}\x1b[0m`);
}

async function run<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const r = await fn();
    ok(label, r);
    return r;
  } catch (e) {
    fail(label, e);
    return null;
  }
}

// ─── 1. SQS ──────────────────────────────────────────────────────────────────

async function seedSQS() {
  header("SQS");
  const sqs = new SQSClient(cfg);

  const queues = ["demo-queue", "order-events", "dead-letter-queue", "email-notifications"];
  const urls: string[] = [];

  for (const name of queues) {
    const r = await run(`create queue  ${name}`, () =>
      sqs.send(new CreateQueueCommand({
        QueueName: name,
        Attributes: name === "dead-letter-queue" ? { MessageRetentionPeriod: "1209600" } : {},
      }))
    );
    if (r?.QueueUrl) urls.push(r.QueueUrl);
  }

  // Send sample messages
  const messages = [
    { queue: "demo-queue",       body: JSON.stringify({ type: "demo", ts: Date.now() }) },
    { queue: "order-events",     body: JSON.stringify({ orderId: "ord-001", status: "created", total: 49.99 }) },
    { queue: "order-events",     body: JSON.stringify({ orderId: "ord-002", status: "shipped", total: 89.00 }) },
    { queue: "email-notifications", body: JSON.stringify({ to: "user@test.com", subject: "Welcome!" }) },
  ];

  for (const msg of messages) {
    const queueUrl = `${ENDPOINT}/000000000000/${msg.queue}`;
    await run(`send message → ${msg.queue}`, () =>
      sqs.send(new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: msg.body }))
    );
  }

  const list = await sqs.send(new ListQueuesCommand({}));
  ok(`list queues`, { count: list.QueueUrls?.length ?? 0 });
}

// ─── 2. S3 ───────────────────────────────────────────────────────────────────

async function seedS3() {
  header("S3");
  const s3 = new S3Client(cfg);

  const buckets = ["floci-assets", "floci-uploads", "floci-backups", "floci-logs"];
  for (const b of buckets) {
    await run(`create bucket  ${b}`, () =>
      s3.send(new CreateBucketCommand({ Bucket: b }))
    );
  }

  const objects: [string, string, string][] = [
    ["floci-assets",  "images/logo.png",   "PNG_PLACEHOLDER"],
    ["floci-assets",  "css/style.css",     "body { margin: 0; }"],
    ["floci-uploads", "2026/01/report.csv", "id,name,value\n1,test,42"],
    ["floci-backups", "db-2026-01-01.sql",  "-- backup placeholder"],
  ];

  for (const [bucket, key, body] of objects) {
    await run(`upload  ${bucket}/${key}`, () =>
      s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body }))
    );
  }

  const list = await s3.send(new ListBucketsCommand({}));
  ok("list buckets", { count: list.Buckets?.length ?? 0 });
}

// ─── 3. DynamoDB ─────────────────────────────────────────────────────────────

async function seedDynamoDB() {
  header("DynamoDB");
  const ddb = new DynamoDBClient(cfg);
  const doc = DynamoDBDocumentClient.from(ddb);

  const tables = [
    { TableName: "users",    KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],    AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }] },
    { TableName: "orders",   KeySchema: [{ AttributeName: "orderId", KeyType: "HASH" }],   AttributeDefinitions: [{ AttributeName: "orderId", AttributeType: "S" }] },
    { TableName: "sessions", KeySchema: [{ AttributeName: "sessionId", KeyType: "HASH" }], AttributeDefinitions: [{ AttributeName: "sessionId", AttributeType: "S" }] },
  ];

  for (const table of tables) {
    await run(`create table  ${table.TableName}`, () =>
      ddb.send(new CreateTableCommand({ ...table, BillingMode: "PAY_PER_REQUEST" }))
    );
  }

  // Put items
  const items = [
    { table: "users",  item: { userId: "u-001", name: "Alice",   email: "alice@test.com", role: "admin"  } },
    { table: "users",  item: { userId: "u-002", name: "Bob",     email: "bob@test.com",   role: "viewer" } },
    { table: "orders", item: { orderId: "o-001", userId: "u-001", total: 49.99, status: "shipped" } },
    { table: "orders", item: { orderId: "o-002", userId: "u-002", total: 89.00, status: "pending" } },
  ];

  for (const { table, item } of items) {
    await run(`put item  ${table} / ${Object.values(item)[0]}`, () =>
      doc.send(new PutCommand({ TableName: table, Item: item }))
    );
  }

  const list = await ddb.send(new ListTablesCommand({}));
  ok("list tables", { tables: list.TableNames });
}

// ─── 4. SNS ──────────────────────────────────────────────────────────────────

async function seedSNS() {
  header("SNS");
  const sns = new SNSClient(cfg);

  const topics = ["order-notifications", "system-alerts", "user-events"];
  const arns: string[] = [];

  for (const name of topics) {
    const r = await run(`create topic  ${name}`, () =>
      sns.send(new CreateTopicCommand({ Name: name }))
    );
    if (r?.TopicArn) arns.push(r.TopicArn);
  }

  // Publish messages
  const msgs = [
    { topic: "order-notifications", msg: JSON.stringify({ orderId: "o-001", event: "shipped" }) },
    { topic: "system-alerts",       msg: JSON.stringify({ level: "warn",    message: "High memory" }) },
    { topic: "user-events",         msg: JSON.stringify({ userId: "u-001",  event: "login" }) },
  ];

  for (const { topic, msg } of msgs) {
    const arn = `arn:aws:sns:${REGION}:000000000000:${topic}`;
    await run(`publish → ${topic}`, () =>
      sns.send(new PublishCommand({ TopicArn: arn, Message: msg }))
    );
  }

  const list = await sns.send(new ListTopicsCommand({}));
  ok("list topics", { count: list.Topics?.length ?? 0 });
}

// ─── 5. Secrets Manager ──────────────────────────────────────────────────────

async function seedSecretsManager() {
  header("Secrets Manager");
  const sm = new SecretsManagerClient(cfg);

  const secrets = [
    { name: "prod/db/password",  value: "super-secret-db-pass-2026" },
    { name: "prod/api/key",      value: "sk-localstack-test-api-key" },
    { name: "prod/jwt/secret",   value: "jwt-signing-secret-local-123" },
    { name: "dev/stripe/secret", value: "sk_test_floci_local_stripe" },
  ];

  for (const s of secrets) {
    await run(`create secret  ${s.name}`, () =>
      sm.send(new CreateSecretCommand({ Name: s.name, SecretString: s.value }))
    );
  }

  const list = await sm.send(new ListSecretsCommand({}));
  ok("list secrets", { count: list.SecretList?.length ?? 0 });
}

// ─── 6. SSM Parameter Store ──────────────────────────────────────────────────

async function seedSSM() {
  header("SSM Parameter Store");
  const ssm = new SSMClient(cfg);

  const params = [
    { Name: "/app/config/log-level",      Value: "info",             Type: "String"       },
    { Name: "/app/config/max-connections", Value: "100",              Type: "String"       },
    { Name: "/app/env",                    Value: "local",            Type: "String"       },
    { Name: "/app/secrets/db-url",         Value: "postgresql://...", Type: "SecureString" },
    { Name: "/app/feature-flags/dark-mode", Value: "true",            Type: "String"       },
  ] as const;

  for (const p of params) {
    await run(`put param  ${p.Name}`, () =>
      ssm.send(new PutParameterCommand({ ...p, Overwrite: true }))
    );
  }

  const list = await ssm.send(new GetParametersByPathCommand({ Path: "/app", Recursive: true }));
  ok("get params /app", { count: list.Parameters?.length ?? 0 });
}

// ─── 7. IAM ──────────────────────────────────────────────────────────────────

async function seedIAM() {
  header("IAM");
  const iam = new IAMClient(cfgNoPath);

  const users = ["alice", "bob", "ci-bot", "deploy-user"];
  for (const u of users) {
    await run(`create user  ${u}`, () =>
      iam.send(new CreateUserCommand({ UserName: u }))
    );
  }

  const roles = [
    { RoleName: "LambdaExecutionRole",   AssumeRolePolicyDocument: JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Principal: { Service: "lambda.amazonaws.com" }, Action: "sts:AssumeRole" }] }) },
    { RoleName: "ECSTaskRole",           AssumeRolePolicyDocument: JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Principal: { Service: "ecs-tasks.amazonaws.com" }, Action: "sts:AssumeRole" }] }) },
  ];
  for (const r of roles) {
    await run(`create role  ${r.RoleName}`, () => iam.send(new CreateRoleCommand(r)));
  }

  const list = await iam.send(new ListUsersCommand({}));
  ok("list users", { count: list.Users?.length ?? 0 });
}

// ─── 8. Lambda ───────────────────────────────────────────────────────────────

async function seedLambda() {
  header("Lambda");
  const lambda = new LambdaClient(cfg);

  // Minimal zip containing index.js handler
  const handlerZip = Buffer.from(
    "UEsDBAoAAAAAAMVnUFkAAAAAAAAAAAAAAAAJAAAAaW5kZXguanNleHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+ICh7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAiT0siLCBldmVudCB9KSB9KTsKUEsBAj8ACgAAAAAAoHBQWQAAAAAAAAAAAAAAAAkAAAAAAAAAAAAQAAAAAAAAAGluZGV4LmpzUEsFBgAAAAABAAEANwAAADcAAAAAAA==",
    "base64"
  );

  const functions = [
    { name: "api-handler",    handler: "index.handler", runtime: "nodejs20.x" },
    { name: "event-processor", handler: "index.handler", runtime: "nodejs20.x" },
    { name: "cron-job",       handler: "index.handler", runtime: "nodejs20.x" },
  ];

  for (const fn of functions) {
    await run(`create function  ${fn.name}`, () =>
      lambda.send(new CreateFunctionCommand({
        FunctionName: fn.name,
        Handler: fn.handler,
        Runtime: fn.runtime as any,
        Role: `arn:aws:iam::000000000000:role/LambdaExecutionRole`,
        Code: { ZipFile: handlerZip },
      }))
    );
  }

  const list = await lambda.send(new ListFunctionsCommand({}));
  ok("list functions", { count: list.Functions?.length ?? 0 });
}

// ─── 9. CloudWatch Logs ──────────────────────────────────────────────────────

async function seedLogs() {
  header("CloudWatch Logs");
  const logs = new CloudWatchLogsClient(cfg);

  const groups = ["/app/api", "/app/worker", "/app/cron", "/infra/nginx"];
  for (const g of groups) {
    await run(`create log group  ${g}`, () =>
      logs.send(new CreateLogGroupCommand({ logGroupName: g }))
    );
  }

  // Put log events
  const events = [
    { group: "/app/api",    stream: "2026/01/01/[$LATEST]abc", msgs: ["GET /health 200", "POST /api/v1/orders 201", "GET /api/v1/users 200"] },
    { group: "/app/worker", stream: "2026/01/01/[$LATEST]def", msgs: ["Job started", "Processed 42 items", "Job completed in 1.2s"] },
  ];

  for (const e of events) {
    // Create stream (ignore already exists)
    try {
      await logs.send({ input: { logGroupName: e.group, logStreamName: e.stream } } as any);
    } catch {}

    await run(`put log events → ${e.group}`, () =>
      logs.send(new PutLogEventsCommand({
        logGroupName: e.group,
        logStreamName: e.stream,
        logEvents: e.msgs.map((m) => ({ message: m, timestamp: Date.now() })),
      }))
    );
  }

  const list = await logs.send(new DescribeLogGroupsCommand({}));
  ok("list log groups", { count: list.logGroups?.length ?? 0 });
}

// ─── 10. EventBridge ─────────────────────────────────────────────────────────

async function seedEventBridge() {
  header("EventBridge");
  const eb = new EventBridgeClient(cfg);

  const buses = ["orders-bus", "notifications-bus"];
  for (const b of buses) {
    await run(`create event bus  ${b}`, () =>
      eb.send(new CreateEventBusCommand({ Name: b }))
    );
  }

  const rules = [
    { EventBusName: "orders-bus",        Name: "order-created-rule",  EventPattern: JSON.stringify({ "detail-type": ["OrderCreated"] }), State: "ENABLED" },
    { EventBusName: "notifications-bus", Name: "user-signup-rule",    EventPattern: JSON.stringify({ "detail-type": ["UserSignedUp"] }), State: "ENABLED" },
  ];

  for (const r of rules) {
    await run(`create rule  ${r.Name}`, () => eb.send(new PutRuleCommand(r as any)));
  }

  const list = await eb.send(new ListEventBusesCommand({}));
  ok("list event buses", { count: list.EventBuses?.length ?? 0 });
}

// ─── 11. KMS ─────────────────────────────────────────────────────────────────

async function seedKMS() {
  header("KMS");
  const kms = new KMSClient(cfg);

  const keys: { desc: string; alias: string }[] = [
    { desc: "Data encryption key",    alias: "alias/data-key"   },
    { desc: "Backup encryption key",  alias: "alias/backup-key" },
    { desc: "Secrets signing key",    alias: "alias/sign-key"   },
  ];

  for (const k of keys) {
    const r = await run(`create key  ${k.alias}`, () =>
      kms.send(new CreateKeyCommand({ Description: k.desc }))
    );
    if (r?.KeyMetadata?.KeyId) {
      await run(`create alias  ${k.alias}`, () =>
        kms.send(new CreateAliasCommand({ AliasName: k.alias, TargetKeyId: r.KeyMetadata!.KeyId! }))
      );
    }
  }

  const list = await kms.send(new ListKeysCommand({}));
  ok("list keys", { count: list.Keys?.length ?? 0 });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function seedAWS() {
  // Health check
  const health = await fetch(`${ENDPOINT}/health`).catch(() => null);
  if (!health?.ok) {
    const res = await fetch(ENDPOINT).catch(() => null);
    if (!res) {
      console.log("\n\x1b[31mCannot reach Floci-AWS at " + ENDPOINT + "\x1b[0m");
      return;
    }
  }

  console.log("\n\x1b[1;35m▶  AWS  \x1b[0m" + ENDPOINT);

  await seedSQS();
  await seedS3();
  await seedDynamoDB();
  await seedSNS();
  await seedSecretsManager();
  await seedSSM();
  await seedIAM();
  await seedLambda();
  await seedLogs();
  await seedEventBridge();
  await seedKMS();
}

if (import.meta.main) {
  seedAWS();
}
