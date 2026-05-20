import { Database } from 'bun:sqlite';
import { join } from 'node:path';

export const DB_PATH = process.env.FLOCI_DB_PATH ?? join(process.cwd(), 'floci.db');

const db = new Database(DB_PATH, { create: true });
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS sqs_message_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_name    TEXT    NOT NULL,
    message_id    TEXT,
    event_type    TEXT    NOT NULL,
    body_preview  TEXT,
    sent_ts_ms    INTEGER,
    event_at_ms   INTEGER NOT NULL,
    queue_time_ms INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_sqs_events_queue
    ON sqs_message_events(queue_name, event_at_ms DESC);
`);

export default db;
