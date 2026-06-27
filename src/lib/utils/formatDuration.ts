/**
 * Human-friendly duration formatting for queue latency / time-in-queue values.
 * Returns an em dash for null so callers can render "no data" uniformly.
 */
export function formatDuration(ms: number | null | undefined): string {
	if (ms == null || !Number.isFinite(ms)) return '—';
	if (ms < 1) return '<1 ms';
	if (ms < 1000) return `${Math.round(ms)} ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
	if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)} min`;
	if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)} h`;
	return `${(ms / 86_400_000).toFixed(1)} d`;
}
