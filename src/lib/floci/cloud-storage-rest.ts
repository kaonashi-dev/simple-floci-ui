/**
 * Helpers shared by the browser-direct REST cloud-storage adapters
 * (`./azure` and `./gcp`). The two adapters speak different wire formats (Azure
 * XML, GCP JSON) but normalise into the same `CloudStorage*` shapes, and these
 * small transforms are identical across both — kept here so a fix lands once.
 */

/** Relativise an object key against the current prefix, dropping a trailing slash. */
export function objectName(key: string, prefix: string): string {
	const relative = key.startsWith(prefix) ? key.slice(prefix.length) : key;
	return relative.replace(/\/$/, '') || key;
}

/** Parse a possibly-missing numeric string into a finite number, else `null`. */
export function numberValue(value: string | null | undefined): number | null {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

/** Copy bytes into a standalone `ArrayBuffer` suitable for a `fetch` body. */
export function copyBytes(bytes: Uint8Array): ArrayBuffer {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
}

/** Read a response body as trimmed text (capped), swallowing read errors. */
export async function safeResponseText(res: Response): Promise<string> {
	try {
		return (await res.text()).trim().slice(0, 500);
	} catch {
		return '';
	}
}

/** Best-effort message from an unknown thrown value. */
export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
