# simple-floci-ui

A local AWS services dashboard for the Floci project. Browse and inspect resources across 13 AWS services running in your local environment (LocalStack or similar) — queues, buckets, tables, functions, logs, secrets, and more — from a single UI with light and dark themes.

## Stack

- [SvelteKit 5](https://svelte.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [bits-ui](https://bits-ui.com) for headless UI primitives
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Bun](https://bun.sh) as the package manager and runtime

## Getting started

```sh
bun install
bun run dev
```

The app runs at **http://localhost:5975**.

## Configuration

The app connects to a local AWS endpoint. Configure via environment variables:

| Variable | Default | Description |
|---|---|---|
| `AWS_ENDPOINT_URL` | `http://localhost:4566` | Local AWS endpoint (e.g. LocalStack) |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | `test` | Access key (any value for local) |
| `AWS_SECRET_ACCESS_KEY` | `test` | Secret key (any value for local) |

Create a `.env` file at the project root to override defaults.

## Services

| Route | Service |
|---|---|
| `/sqs` | SQS — list queues, inspect messages |
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

The dashboard at `/` aggregates resource counts from every service in parallel and surfaces per-service errors without failing the whole page.

## Architecture

- **Client factory** (`src/lib/server/aws.ts`) — single source of truth for AWS SDK clients; reads endpoint and credentials from env.
- **Service registry** (`src/lib/server/registry.ts`) — declarative list of all services for the dashboard aggregator.
- **Shared load helpers** (`src/lib/server/load.ts`) — pagination and partial-failure handling for SvelteKit `load` functions.
- **Theme** — light/dark toggle with system preference detection, persisted in `localStorage`.

## Other commands

```sh
bun run build      # production build
bun run preview    # preview production build
bun run check      # type-check with svelte-check
```
