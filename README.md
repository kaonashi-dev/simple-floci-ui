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

> ## ⚠️ Security: local/test runtimes only — never real credentials
>
> This UI is for **LOCAL/TEST** Floci/LocalStack runtimes only (e.g. LocalStack
> `test`/`test`). **Never enter real cloud credentials.** Connection details are kept in
> the browser's `localStorage` — readable by any XSS on the page — and are sent
> **directly from your browser** to the endpoint you configure. Treat anything you type
> in Settings as throwaway local test data.

## Run it locally (recommended)

Running the UI on your own machine is the lowest-friction path: the browser talks to
your Floci runtimes **same-origin** through a built-in proxy, so there is **no CORS
config, no Local Network Access prompt, and no mixed-content** — for AWS, Azure, and GCP
alike. The values you store in Settings remain the real Floci runtime URLs; the proxy is
transparent.

Prerequisites: [Bun](https://bun.sh) and at least one local Floci runtime.

```sh
# start your local Floci AWS runtime
# default UI setting: http://localhost:4567
# common local Floci core port: http://localhost:4545

# optional: start Floci-AZ for Azure Blob Storage and service health
docker run --rm -p 4577:4577 floci/floci-az:latest

# optional: start Floci-GCP for GCP Cloud Storage
docker run --rm -p 4588:4588 floci/floci-gcp:latest

bun install
```

Then pick one of the two local options — both proxy same-origin, so **neither needs any
CORS setup**:

- **`bun run dev`** — dev server with hot reload. Open **http://localhost:5975**.
- **`bun run start:local`** — runs the production build behind the same proxy
  (`bun server.js`), bound to `127.0.0.1` for security. Build first, then start:

  ```sh
  bun run build
  bun run start:local         # serves on http://127.0.0.1:3000 (honors HOST/PORT)
  ```

In either case, go to **Settings** and point the endpoints at your local instances.
Defaults are AWS `http://localhost:4567`, Azure `http://localhost:4577`, and GCP
`http://localhost:4588`.

### How the same-origin proxy works

Under both `bun run dev` and `bun run start:local`, loopback endpoints such as
`http://localhost:4545`, `http://localhost:4577`, and `http://localhost:4588` are
automatically routed through a same-origin proxy on the loopback host serving the UI.
This sidesteps browser CORS and Local Network Access friction entirely, regardless of
each runtime's CORS configuration. The values stored in Settings remain the real Floci
runtime URLs.

> **Note:** the proxy is only active when the UI is served from a loopback host — i.e.
> `bun run dev` and `bun run start:local`. It is **not** included in `vite preview`
> (`bun run preview`) and is **not** available on Railway (a hosted box cannot reach your
> localhost). To run the built app locally, use `bun run start:local`, **not**
> `vite preview`.

## Deploy the UI to Railway (advanced)

The hosted page is best treated as a demo/landing. Because the host cannot reach your
machine, the browser must talk to your local runtimes **directly**, which requires
per-runtime CORS **and** the browser's Local Network Access permission (both below). If
you just want it to work, [run it locally](#run-it-locally-recommended) with
`bun run start:local` instead.

The host only serves the built UI — no AWS/Floci config is required on it.

1. Create a Railway project from this repo. Railway uses [`railway.json`](./railway.json):
   it builds with `bun run build` (a static `build/` folder) and serves it with `sirv`
   on the injected `PORT`.
2. Deploy. Note your app URL, e.g. `https://your-app.up.railway.app`.

### What each developer does (one-time)

When you open the hosted UI (a public **HTTPS** page) it makes calls straight to your local Floci runtimes on `http://localhost`. Browsers gate this in two independent ways, and **both** must be satisfied.

#### 1. CORS — start the Floci runtime with the CORS flags (server side)

Floci core exposes CORS configuration as of **`floci/floci:1.5.26`** (older images such as `1.5.11` predate the feature). Start it with the hosted origin allowed:

```sh
docker pull floci/floci:1.5.26

docker run --rm \
  -p 4545:4566 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e 'FLOCI_SECURITY_EXTRA_CORS_ALLOWED_ORIGINS=https://simple-floci-ui.xyz,http://localhost:5975' \
  -e 'FLOCI_SECURITY_EXTRA_CORS_ALLOWED_HEADERS=authorization,content-type,x-amz-content-sha256,x-amz-date,x-amz-security-token,x-amz-target,x-amz-user-agent,amz-sdk-invocation-id,amz-sdk-request' \
  -e 'FLOCI_SECURITY_EXTRA_CORS_EXPOSE_HEADERS=etag,x-amz-request-id,x-amz-id-2,x-amzn-requestid,content-length,content-type' \
  floci/floci:1.5.26
```

- `FLOCI_SECURITY_EXTRA_CORS_ALLOWED_ORIGINS` is comma-separated. **Prefer enumerating explicit origins** — the hosted URL plus your localhost (e.g. `https://simple-floci-ui.xyz,http://localhost:5975`). Avoid `*`: it lets **any** website you visit reach your local Floci runtime. The risk is low because it is local test data (and you should never put real credentials here — see the security note above), but it is not best practice; reserve `*` for throwaway local use only.
- `amz-sdk-invocation-id` and `amz-sdk-request` are sent by AWS SDK v3 on every request — without them the `OPTIONS` preflight fails even though the rest of the header list looks correct.
- Do **not** set `FLOCI_SECURITY_DISABLE_CORS_HEADERS=true` — it turns CORS off.
- Map the container to whichever host port your **Settings → AWS endpoint** uses (`4545` here, or `4567` for the UI default).

Verify the preflight before touching the UI:

```sh
curl -i -X OPTIONS 'http://localhost:4545/' \
  -H 'Origin: https://simple-floci-ui.xyz' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,x-amz-date,x-amz-content-sha256,content-type'
# expect a 2xx response carrying: Access-Control-Allow-Origin: https://simple-floci-ui.xyz
```

#### 2. Local Network Access — grant the browser permission (client side)

CORS alone is no longer enough. Since **Chrome 142** (Oct 2025), a public HTTPS page reaching `localhost`/loopback triggers a **"Local network access"** permission prompt. This replaces the old Private Network Access `Access-Control-Allow-Private-Network` header — **there is no server flag for it**, so no Floci setting can grant it for you. Click **Allow** when it appears; if you dismissed or denied it, re-enable via the **lock / site-settings icon → Local network access → Allow** and reload. Once granted, Chrome also relaxes mixed-content for the local target. Edge follows Chrome; Firefox and Safari differ and are generally more permissive for `localhost`.

#### Azure (4577) and GCP (4588)

Floci-AZ and Floci-GCP do not expose global CORS flags yet, so the hosted UI cannot reach them directly. For those providers, run the UI locally with `bun run dev` or `bun run start:local` (both same-origin) — see [Run it locally](#run-it-locally-recommended) — or put a small local CORS proxy in front of the runtime until upstream CORS support lands.

Then open the hosted URL, confirm/adjust the endpoint in **Settings → Save & test**, and the green indicator should appear. Each developer's session uses their own machine.

## Services

| Route | Service |
|---|---|
| `/azure` | Azure catalog — Floci-AZ service landing page |
| `/azure/storage` | Azure Blob Storage — list containers, browse/upload/download/delete blobs |
| `/azure/{service}` | Azure planned services — dedicated placeholder routes for each Floci-AZ service |
| `/gcp/storage` | GCP Cloud Storage — list buckets, browse/upload/download/delete objects |
| `/aws/sqs` | SQS — list queues, inspect messages, history |
| `/aws/s3` | S3 — list buckets, browse objects, preview/download files |
| `/aws/cognito` | Cognito — list user pools, inspect users |
| `/aws/kms` | KMS — list and inspect encryption keys |
| `/aws/lambda` | Lambda — list functions, view config and code |
| `/aws/dynamodb` | DynamoDB — list tables, scan items |
| `/aws/sns` | SNS — list topics and subscriptions |
| `/aws/apigateway` | API Gateway — list REST APIs and routes |
| `/aws/iam` | IAM — list users, roles, and policies |
| `/aws/logs` | CloudWatch Logs — list log groups and streams |
| `/aws/eventbridge` | EventBridge — list buses and rules |
| `/aws/secrets` | Secrets Manager — list and inspect secrets |
| `/aws/ssm` | SSM — list parameters |

The dashboard at `/` aggregates resource counts from every wired service in parallel and shows per-runtime connection status.

Azure planned routes are generated from the service catalog (`src/lib/catalog/azure.ts`). The catalog currently reserves routes for Queue Storage, Table Storage, Azure Functions, App Configuration, Key Vault, Event Hubs, Service Bus, Cosmos DB, AKS, Azure SQL, API Management, Virtual Machines, Cache for Redis, Container Registry, Virtual Network, Azure Monitor, Microsoft Entra ID, and Email Communication.

### Multi-cloud scope

The first multi-cloud phase is browser-direct storage plus provider-specific cataloging:

- Azure Blob Storage via Floci-AZ REST routes on port `4577`.
- GCP Cloud Storage via Floci-GCP REST routes on port `4588`.
- Azure planned service routes under `/azure/*` so each service can grow into its own view.

Every provider is namespaced under its own prefix — no provider is the root default:

- AWS pages live under `/aws/*` (e.g. `/aws/s3`, `/aws/sqs`, `/aws/lambda`).
- Azure pages live under `/azure/*`.
- GCP pages live under `/gcp/*`.
- The root `/` is the cross-cloud dashboard; `/settings` is shared.

Shared components are used only for common UI primitives. If a provider service diverges in workflow, capabilities, or data shape, give it its own view under that provider prefix instead of forcing a generic cross-cloud screen.

Most non-storage Azure and GCP services are visible as planned because they are likely better served by a local proxy/API phase or service-specific browser clients.

## Architecture

- **Client factory** (`src/lib/floci/aws.ts`) — AWS SDK v3 clients with per-request
  providers, so the active endpoint/region/credentials resolve from the per-dev Settings
  (browser) at call time (falls back to env vars on the server for not-yet-migrated routes).
- **Azure/GCP REST clients** (`src/lib/floci/azure.ts`, `src/lib/floci/gcp.ts`) — browser-direct
  `fetch` clients for Floci-AZ and Floci-GCP storage APIs, sharing response helpers from
  `src/lib/floci/cloud-storage-rest.ts`.
- **Service catalog** (`src/lib/catalog/`) — the single source of truth for every service's
  identity and presentation across all three providers (route, icon, status, category,
  dashboard `countKey`/`unit`). Pure display metadata with one icon-component map, read by the
  sidebar, dashboard, provider overviews, and `[service]` placeholder routes.
- **Service registry** (`src/lib/floci/registry.ts`) — binds each catalog `countKey` to the AWS
  SDK / REST call that produces its dashboard count, keeping the catalog free of SDK imports.
- **Settings store** (`src/lib/stores/settings.svelte.ts`) — per-browser connection,
  persisted in `localStorage`.
- **Client actions** (`src/lib/utils/clientAction.ts`) — `use:enhance`-compatible helper that
  runs mutations in the browser (no server form actions).
- **Local history** (`src/lib/floci/storage/`) — SQS history stored per-browser in
  `localStorage`.

## Other commands

```sh
bun run build       # production build
bun run start:local # built app + same-origin proxy (bun server.js, 127.0.0.1:3000) — best for local use
bun run preview     # preview production build (vite preview) — NO same-origin proxy
bun run start       # serve the static build (sirv, host 0.0.0.0:3000) — the Railway/static command, no proxy
bun run check       # type-check with svelte-check
```

To run the built app locally without CORS/Local-Network-Access friction, use
`bun run start:local` (same-origin proxy), **not** `bun run preview`.
