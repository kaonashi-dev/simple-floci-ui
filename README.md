# simple-floci-ui

A local AWS services dashboard for the Floci project. Browse and inspect SQS queues, S3 buckets, Cognito user pools, and KMS keys running in your local environment (LocalStack or similar).

## Stack

- [SvelteKit 5](https://svelte.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [bits-ui](https://bits-ui.com) for headless UI primitives
- [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) (SQS, S3, Cognito, KMS)
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

## Other commands

```sh
bun run build      # production build
bun run preview    # preview production build
bun run check      # type-check with svelte-check
```
