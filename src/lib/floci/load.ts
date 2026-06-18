export async function safeLoad<T>(
	fn: () => Promise<T>,
	fallback: T
): Promise<{ data: T; error: string | null }> {
	try {
		return { data: await fn(), error: null };
	} catch (e) {
		return { data: fallback, error: String(e) };
	}
}
