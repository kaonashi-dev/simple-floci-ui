import { storage } from './storage';
import type { QueueStats, StoreInfo } from './storage';
import type { SqsHistoryEvent } from '$lib/types/sqs-history';
import type { SqsMessage } from '$lib/types/sqs';

const BODY_PREVIEW_LEN = 200;

export function recordSent(queueName: string, messageId: string | undefined, body: string): void {
	storage.insertEvent({
		queueName,
		messageId: messageId ?? null,
		eventType: 'sent',
		bodyPreview: body.slice(0, BODY_PREVIEW_LEN),
		sentTsMs: null,
		eventAtMs: Date.now(),
		queueTimeMs: null
	});
}

export function recordReceived(queueName: string, messages: SqsMessage[]): void {
	const now = Date.now();
	for (const msg of messages) {
		const sentTs = Number(msg.attributes?.SentTimestamp);
		const validSentTs = Number.isFinite(sentTs) && sentTs > 0;
		storage.insertEvent({
			queueName,
			messageId: msg.messageId ?? null,
			eventType: 'received',
			bodyPreview: msg.body ? msg.body.slice(0, BODY_PREVIEW_LEN) : null,
			sentTsMs: validSentTs ? sentTs : null,
			eventAtMs: now,
			queueTimeMs: validSentTs ? now - sentTs : null
		});
	}
}

export function recordDeleted(queueName: string): void {
	storage.insertEvent({
		queueName,
		messageId: null,
		eventType: 'deleted',
		bodyPreview: null,
		sentTsMs: null,
		eventAtMs: Date.now(),
		queueTimeMs: null
	});
}

export function getQueueHistory(queueName: string, limit = 200): SqsHistoryEvent[] {
	return storage.queryEvents(queueName, limit).map((e) => ({
		id: e.id,
		queueName: e.queueName,
		messageId: e.messageId,
		eventType: e.eventType,
		bodyPreview: e.bodyPreview,
		sentTsMs: e.sentTsMs,
		eventAtMs: e.eventAtMs,
		queueTimeMs: e.queueTimeMs
	}));
}

export function getQueueStats(queueName: string): QueueStats {
	return storage.statsForQueue(queueName);
}

export function resetDb(): void {
	storage.reset();
}

export function getDbStats(): StoreInfo {
	return storage.info();
}
