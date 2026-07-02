/**
 * Safe "Preview" for the storage browsers (S3 / Azure Blob / GCS).
 *
 * Preview opens an object's bytes in a new tab via a `blob:` URL. A blob URL
 * inherits THIS app's origin and `window.open()` is a top-level navigation, so
 * honoring the object's stored Content-Type verbatim would let an attacker-
 * uploaded `text/html` or `image/svg+xml` object execute script in our origin —
 * enough to read the cloud credentials kept in `localStorage`. We therefore only
 * render a Content-Type a browser cannot script from; everything else (unknown or
 * executable types) is downgraded to inert plain text.
 *
 * Note: `download` (via an `a[download]` element) is NOT affected — a forced
 * download saves the bytes to disk and never executes them, so it keeps the real
 * Content-Type. Only the inline-navigation preview path needs neutralizing.
 */

// Exact Content-Types a browser renders without executing script when opened as a
// top-level document. Deliberately excludes `image/svg+xml`, `text/html` and
// `application/xhtml+xml`, which can carry script.
const INLINE_SAFE_EXACT = new Set([
	'application/pdf',
	'application/json',
	'text/plain',
	'text/csv',
	'text/markdown'
]);

// Media families that are safe to render inline. `image/svg+xml` is handled as a
// special case below because SVG (unlike raster images) can execute script.
const INLINE_SAFE_PREFIXES = ['image/', 'audio/', 'video/'];

/**
 * Map an object's untrusted Content-Type to one that is safe to open inline.
 * Falls back to `text/plain` so unknown or executable types render as inert text.
 */
export function safePreviewContentType(contentType: string | null | undefined): string {
	const type = (contentType ?? '').split(';', 1)[0].trim().toLowerCase();
	if (type === 'image/svg+xml') return 'text/plain'; // SVG can carry <script>
	if (INLINE_SAFE_EXACT.has(type)) return type;
	if (INLINE_SAFE_PREFIXES.some((prefix) => type.startsWith(prefix))) return type;
	return 'text/plain';
}

/**
 * Open object bytes in a new tab for preview without letting untrusted content
 * script this app's origin. The stored Content-Type is neutralized via
 * {@link safePreviewContentType} before the blob is created.
 */
export function openObjectPreview(body: BlobPart, contentType: string | null | undefined): void {
	const blob = new Blob([body], { type: safePreviewContentType(contentType) });
	const url = URL.createObjectURL(blob);
	window.open(url, '_blank', 'noopener');
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
