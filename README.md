# simple-floci-ui

A local multi-cloud services dashboard for the Floci project. Browse and inspect AWS resources, the Azure service catalog, Azure Blob Storage, and GCP Cloud Storage running in your local environment from a single UI with light and dark themes.

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
# start your local Floci AWS runtime
# default UI setting: http://localhost:4567
# common local Floci core port: http://localhost:4545

# optional: start Floci-AZ for Azure Blob Storage and service health
docker run --rm -p 4577:4577 floci/floci-az:latest

# optional: start Floci-GCP for GCP Cloud Storage
docker run --rm -p 4588:4588 floci/floci-gcp:latest

# run the UI
bun install
bun run dev
```

Open **http://localhost:5975**. Go to **Settings** and point the endpoints at your local
instances. Defaults are AWS `http://localhost:4567`, Azure `http://localhost:4577`, and GCP `http://localhost:4588`.

During `bun run dev`, loopback endpoints such as `http://localhost:4545`, `http://localhost:4577`, and `http://localhost:4588` are automatically routed through a same-origin Vite proxy. This avoids browser CORS failures while Floci does not expose CORS flags yet. The values stored in Settings remain the real Floci runtime URLs.

## Deploy the UI to Railway

The host only serves the built UI — no AWS/Floci config is required on it.

1. Create a Railway project from this repo. Railway uses [`railway.json`](./railway.json):
   it builds with `bun run build` (a static `build/` folder) and serves it with `sirv`
   on the injected `PORT`.
2. Deploy. Note your app URL, e.g. `https://your-app.up.railway.app`.

### What each developer does (one-time)

Because the browser on a public HTTPS page calls services on `localhost`, the Floci runtimes must allow that hosted origin with CORS and Private Network Access headers.

The dev-only Vite proxy is not part of the static production build. Until Floci exposes CORS configuration, use a small local CORS proxy in front of Floci for hosted UI sessions, or run the UI with `bun run dev` locally.

Then open the hosted URL, confirm/adjust the endpoint in **Settings → Save & test**, and the green indicator should appear. Each developer's session uses their own machine.

> Browser support: works in Chrome, Edge, Firefox and Safari when the local Floci endpoint returns the required CORS headers. If a stricter setup still trips Chrome's Private Network Access, run a small local TLS/CORS proxy in front of Floci.

## Services

| Route | Service |
|---|---|
| `/azure` | Azure catalog — Floci-AZ service landing page |
| `/azure/storage` | Azure Blob Storage — list containers, browse/upload/download/delete blobs |
| `/azure/{service}` | Azure planned services — dedicated placeholder routes for each Floci-AZ service |
| `/gcp/storage` | GCP Cloud Storage — list buckets, browse/upload/download/delete objects |
| `/sqs` | SQS — list queues, inspect messages, history |
| `/s3` | S3 — list buckets, browse objects, preview/download files |
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

Azure planned routes are generated from `src/lib/floci/azure-catalog.ts`. The catalog currently reserves routes for Queue Storage, Table Storage, Azure Functions, App Configuration, Key Vault, Event Hubs, Service Bus, Cosmos DB, AKS, Azure SQL, API Management, Virtual Machines, Cache for Redis, Container Registry, Virtual Network, Azure Monitor, Microsoft Entra ID, and Email Communication.

### Multi-cloud scope

The first multi-cloud phase is browser-direct storage plus provider-specific cataloging:

- Azure Blob Storage via Floci-AZ REST routes on port `4577`.
- GCP Cloud Storage via Floci-GCP REST routes on port `4588`.
- Azure planned service routes under `/azure/*` so each service can grow into its own view.

Provider routes are intentionally separated by prefix:

- Existing AWS pages stay on the current root-level routes such as `/s3`, `/sqs`, and `/lambda`.
- Azure pages live under `/azure/*`.
- GCP pages live under `/gcp/*`.

Shared components are used only for common UI primitives. If a provider service diverges in workflow, capabilities, or data shape, give it its own view under that provider prefix instead of forcing a generic cross-cloud screen.

Most non-storage Azure and GCP services are visible as planned because they are likely better served by a local proxy/API phase or service-specific browser clients.

## Architecture

- **Client factory** (`src/lib/floci/aws.ts`) — AWS SDK v3 clients with per-request
  providers, so the active endpoint/region/credentials resolve from the per-dev Settings
  (browser) at call time (falls back to env vars on the server for not-yet-migrated routes).
- **Azure/GCP REST clients** (`src/lib/floci/azure.ts`, `src/lib/floci/gcp.ts`) — browser-direct
  `fetch` clients for Floci-AZ and Floci-GCP storage APIs.
- **Azure catalog** (`src/lib/floci/azure-catalog.ts`) — service definitions, route prefixes,
  status, protocol hints, and dashboard/sidebar metadata for Floci-AZ views.
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
