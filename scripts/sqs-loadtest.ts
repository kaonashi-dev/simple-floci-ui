/**
 * Quick SQS load generator for exercising the metrics dashboard's LIVE depth
 * chart (Available / In-flight / Delayed). Sends N messages, optionally
 * consumes them.
 *
 *   bun scripts/sqs-loadtest.ts [queue] [count] [mode] [delayMs]
 *
 *   queue    queue name (created if missing)   default: demo-queue
 *   count    number of messages               default: 100
 *   mode     send | consume | both            default: both
 *   delayMs  pause between ops (spreads the    default: 150
 *            change out so the live chart,
 *            which polls every 2s+, captures
 *            the rise/fall)
 *
 * Examples:
 *   bun scripts/sqs-loadtest.ts demo-queue 100 send 200   # watch depth climb to 100
 *   bun scripts/sqs-loadtest.ts demo-queue 100 consume    # then watch it drain
 *
 * NOTE: this drives the live depth chart only. Throughput / time-in-queue
 * charts come from the browser's localStorage event log — see the console
 * snippet to seed those.
 */
import {
	SQSClient,
	CreateQueueCommand,
	GetQueueUrlCommand,
	SendMessageCommand,
	ReceiveMessageCommand,
	DeleteMessageCommand
} from '@aws-sdk/client-sqs';

const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:59595';
const region = process.env.AWS_REGION || 'us-east-1';
const queueName = process.argv[2] || 'demo-queue';
const count = Number(process.argv[3] || 100);
const mode = (process.argv[4] || 'both') as 'send' | 'consume' | 'both';
const delayMs = Number(process.argv[5] ?? 150);

const sqs = new SQSClient({
	endpoint,
	region,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
	}
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

await sqs.send(new CreateQueueCommand({ QueueName: queueName })).catch(() => {});
const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }));
const url = QueueUrl!;
console.log(`Queue: ${queueName}\nEndpoint: ${endpoint}\n`);

if (mode === 'send' || mode === 'both') {
	console.log(`→ Sending ${count} messages…`);
	for (let i = 1; i <= count; i++) {
		await sqs.send(
			new SendMessageCommand({
				QueueUrl: url,
				MessageBody: JSON.stringify({ i, ts: Date.now() })
			})
		);
		if (i % 20 === 0) console.log(`   sent ${i}/${count}`);
		if (delayMs) await sleep(delayMs);
	}
	console.log(`✓ Sent ${count}\n`);
}

if (mode === 'consume' || mode === 'both') {
	console.log(`→ Consuming…`);
	let done = 0;
	let empty = 0;
	while (done < count && empty < 5) {
		const r = await sqs.send(
			new ReceiveMessageCommand({ QueueUrl: url, MaxNumberOfMessages: 10, WaitTimeSeconds: 1 })
		);
		if (!r.Messages?.length) {
			empty++;
			continue;
		}
		empty = 0;
		for (const m of r.Messages) {
			await sqs.send(new DeleteMessageCommand({ QueueUrl: url, ReceiptHandle: m.ReceiptHandle! }));
			done++;
		}
		console.log(`   consumed ${done}`);
		if (delayMs) await sleep(delayMs);
	}
	console.log(`✓ Consumed ${done}\n`);
}

console.log('Open the queue → Metrics to watch the live depth chart.');
