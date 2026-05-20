import db from './db';
import type { SqsHistoryEvent, SqsQueueStats } from '$lib/types/sqs-history';
import type { SqsMessage } from '$lib/types/sqs';

const BODY_PREVIEW_LEN = 200;

export function recordSent(queueName: string, messageId: string | undefined, body: string): void {
	db.prepare(
		`INSERT INTO sqs_message_events (queue_name, message_id, event_type, body_preview, event_at_ms)
     VALUES (?, ?, 'sent', ?, ?)`
	).run(queueName, messageId ?? null, body.slice(0, BODY_PREVIEW_LEN), Date.now());
}

export function recordReceived(queueName: string, messages: SqsMessage[]): void {
	const stmt = db.prepare(
		`INSERT INTO sqs_message_events
       (queue_name, message_id, event_type, body_preview, sent_ts_ms, event_at_ms, queue_time_ms)
     VALUES (?, ?, 'received', ?, ?, ?, ?)`
	);
	const now = Date.now();
	for (const msg of messages) {
		const sentTs = Number(msg.attributes?.SentTimestamp);
		const queueTimeMs = Number.isFinite(sentTs) && sentTs > 0 ? now - sentTs : null;
		stmt.run(
			queueName,
			msg.messageId ?? null,
			msg.body ? msg.body.slice(0, BODY_PREVIEW_LEN) : null,
			Number.isFinite(sentTs) && sentTs > 0 ? sentTs : null,
			now,
			queueTimeMs
		);
	}
}

export function recordDeleted(queueName: string): void {
	db.prepare(
		`INSERT INTO sqs_message_events (queue_name, event_type, event_at_ms)
     VALUES (?, 'deleted', ?)`
	).run(queueName, Date.now());
}

type RawRow = {
	id: number;
	queue_name: string;
	message_id: string | null;
	event_type: string;
	body_preview: string | null;
	sent_ts_ms: number | null;
	event_at_ms: number;
	queue_time_ms: number | null;
};

export function getQueueHistory(queueName: string, limit = 200): SqsHistoryEvent[] {
	const rows = db
		.prepare(
			`SELECT id, queue_name, message_id, event_type, body_preview, sent_ts_ms, event_at_ms, queue_time_ms
       FROM sqs_message_events
       WHERE queue_name = ?
       ORDER BY event_at_ms DESC
       LIMIT ?`
		)
		.all(queueName, limit) as RawRow[];

	return rows.map((r) => ({
		id: r.id,
		queueName: r.queue_name,
		messageId: r.message_id,
		eventType: r.event_type as SqsHistoryEvent['eventType'],
		bodyPreview: r.body_preview,
		sentTsMs: r.sent_ts_ms,
		eventAtMs: r.event_at_ms,
		queueTimeMs: r.queue_time_ms
	}));
}

type StatsRow = {
	total_sent: number;
	total_received: number;
	total_deleted: number;
	avg_queue_time_ms: number | null;
	min_queue_time_ms: number | null;
	max_queue_time_ms: number | null;
};

export function getQueueStats(queueName: string): SqsQueueStats {
	const row = db
		.prepare(
			`SELECT
        SUM(CASE WHEN event_type = 'sent'     THEN 1 ELSE 0 END) AS total_sent,
        SUM(CASE WHEN event_type = 'received' THEN 1 ELSE 0 END) AS total_received,
        SUM(CASE WHEN event_type = 'deleted'  THEN 1 ELSE 0 END) AS total_deleted,
        AVG(CASE WHEN queue_time_ms IS NOT NULL THEN queue_time_ms END) AS avg_queue_time_ms,
        MIN(queue_time_ms) AS min_queue_time_ms,
        MAX(queue_time_ms) AS max_queue_time_ms
      FROM sqs_message_events
      WHERE queue_name = ?`
		)
		.get(queueName) as StatsRow;

	return {
		totalSent: row.total_sent ?? 0,
		totalReceived: row.total_received ?? 0,
		totalDeleted: row.total_deleted ?? 0,
		avgQueueTimeMs: row.avg_queue_time_ms,
		minQueueTimeMs: row.min_queue_time_ms,
		maxQueueTimeMs: row.max_queue_time_ms
	};
}
