# simple-floci-ui

A local multi-cloud services dashboard for the Floci project. Browse and inspect AWS resources plus Azure Blob Storage and GCP Cloud Storage running in your local environment from a single UI with light and dark themes.

The UI is **browser-direct**: it can be hosted once (e.g. on Railway) and every developer's browser talks straight to *their own* local Floci runtimes — AWS/LocalStack, Floci-AZ, and Floci-GCP. Nothing about your local stack is sent to the host.

## Stack

- [SvelteKit 5](https://svelte.dev) + TypeScript (client-rendered SPA, `ssr = false`)
- [`@sveltejs/adapter-static`](https://svelte.dev/docs/kit/adapter-static) — builds a pure static SPA; the host just serves files
- [Tailwind CSS v4](https://tailwindcss.com) + [bits-ui](https://bits-ui.com)
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) — runs **in the browser** for AWS-compatible services
- Browser `fetch` REST clients for Floci-AZ and Floci-GCP storage APIs
- [Bun](https://bun.sh) as the package manager and runtime

## How it works

```
┌─────────────────┐         serves static UI          ┌──────────────────────┐
│  Hosted UI      │ ───────────────────────────────▶  │  Developer's browser │
│  (Railway, etc) │                                    │                      │
└─────────────────┘                                    │   SDK/fetch calls    │
                                                        └──────────┬───────────┘
                                                                   │ direct
                                                                   ▼
                                                     ┌─────────────────────────┐
                                                     │  Local Floci runtimes    │
                                                     │  (this dev's machine)    │
                                                     └─────────────────────────┘
```

The hosted server never reaches your machine — it can't, and doesn't need to. All
Floci calls happen in your browser, against the endpoints you set in **Settings**
(stored per-browser in `localStorage`). SQS message history is likewise stored locally
in your browser.

## Local development

Prerequisites: [Bun](https://bun.sh) and at least one local Floci runtime.

```sh
# start a local Floci/LocalStack
docker run --rm -p 4566:4566 localstack/localstack

# optional: start Floci-AZ for Azure Blob Storage
docker run --rm -p 4577:4577 floci/floci-az:latest

# optional: start Floci-GCP for GCP Cloud Storage
docker run --rm -p 4588:4588 floci/floci-gcp:latest

# run the UI
bun install
bun run dev
```

Open **http://localhost:5975**. Go to **Settings** and point the endpoints at your local
instances. Defaults are AWS `http://localhost:4567`, Azure `http://localhost:4577`, and GCP `http://localhost:4588`.

## Deploy the UI to Railway

The host only serves the built UI — no AWS/Floci config is required on it.

1. Create a Railway project from this repo. Railway uses [`railway.json`](./railway.json):
   it builds with `bun run build` (a static `build/` folder) and serves it with `sirv`
   on the injected `PORT`.
2. Deploy. Note your app URL, e.g. `https://your-app.up.railway.app`.

### What each developer does (one-time)

Because the browser (on a public HTTPS page) calls a service on `localhost`, two browser
rules apply — both solved by LocalStack's built-in trusted-HTTPS loopback domain plus a
single CORS env var:

1. **Use the default endpoint** `http://localhost:4567` (Floci's default port).
   If you're using LocalStack, point it to `http://localhost:4566` in Settings instead.
2. **Allow the hosted origin** on your LocalStack so CORS/Private-Network checks pass:

   ```sh
   EXTRA_CORS_ALLOWED_ORIGINS=https://your-app.up.railway.app \
     docker run --rm -p 4566:4566 \
     -e EXTRA_CORS_ALLOWED_ORIGINS=https://your-app.up.railway.app \
     localstack/localstack
   ```

Then open the hosted URL, confirm/adjust the endpoint in **Settings → Save & test**, and
the green indicator should appear. Each developer's session uses their own machine.

> Browser support: works in Chrome, Edge, Firefox and Safari via the HTTPS loopback
> domain. If a stricter setup still trips Chrome's Private Network Access, run a small
> local TLS/CORS proxy (e.g. Caddy) in front of LocalStack.

## Services

| Route | Service |
|---|---|
| `/sqs` | SQS — list queues, inspect messages, history |
| `/s3` | S3 — list buckets, browse objects, preview/download files |
| `/azure/storage` | Azure Blob Storage — list containers, browse/upload/download/delete blobs |
| `/gcp/storage` | GCP Cloud Storage — list buckets, browse/upload/download/delete objects |
| `/cognito` | Cognito — list user pools, inspect users |
| `/kms` | KMS — list and inspect encryption keys |
| `/lambda` | Lambda — list functions, view config and code |
| `/dynamodb` | DynamoDB — list tables, scan items |
| `/sns` | SNS — list topics and subscriptions |
| `/apigateway` | API Gateway — list REST APIs and routes |
| `/iam` | IAM — list users, roles, and policies |
| `/logs` | CloudWatch Logs — list log groups and streams |
| `/eventbridge` | EventBridge — list buses and rules |
| `/secrets` | Secrets Manager — list and inspect secrets |
| `/ssm` | SSM — list parameters |

The dashboard at `/` aggregates resource counts from every wired service in parallel and shows per-runtime connection status.

### Multi-cloud scope

The first multi-cloud phase is browser-direct storage:

- Azure Blob Storage via Floci-AZ REST routes on port `4577`.
- GCP Cloud Storage via Floci-GCP REST routes on port `4588`.

Provider routes are intentionally separated by prefix:

- Existing AWS pages stay on the current root-level routes such as `/s3`, `/sqs`, and `/lambda`.
- Azure pages live under `/azure/*`.
- GCP pages live under `/gcp/*`.

Shared components are used only for common UI primitives. If a provider service diverges in workflow, capabilities, or data shape, give it its own view under that provider prefix instead of forcing a generic cross-cloud screen.

The other high-use domains are visible as coming soon because they are better served by a local proxy/API phase:

- Messaging: Azure Queue/Service Bus and GCP Pub/Sub.
- Database: Azure Cosmos DB and GCP Firestore/Datastore.
- Serverless: Azure Functions and GCP Cloud Functions/Run.
- Secrets and keys: Azure Key Vault and GCP Secret Manager/KMS.

## Architecture

- **Client factory** (`src/lib/floci/aws.ts`) — AWS SDK v3 clients with per-request
  providers, so the active endpoint/region/credentials resolve from the per-dev Settings
  (browser) at call time (falls back to env vars on the server for not-yet-migrated routes).
- **Azure/GCP REST clients** (`src/lib/floci/azure.ts`, `src/lib/floci/gcp.ts`) — browser-direct
  `fetch` clients for Floci-AZ and Floci-GCP storage APIs.
- **Service registry** (`src/lib/floci/registry.ts`) — declarative list of all services for
  the dashboard aggregator.
- **Settings store** (`src/lib/stores/settings.svelte.ts`) — per-browser connection,
  persisted in `localStorage`.
- **Client actions** (`src/lib/utils/clientAction.ts`) — `use:enhance`-compatible helper that
  runs mutations in the browser (no server form actions).
- **Local history** (`src/lib/floci/storage/`) — SQS history stored per-browser in
  `localStorage`.

## Other commands

```sh
bun run build      # production build
bun run preview    # preview production build
bun run start      # serve the static build locally (sirv on :3000)
bun run check      # type-check with svelte-check
```
