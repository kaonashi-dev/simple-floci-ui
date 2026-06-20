import { afterEach, vi } from 'vitest';

process.env.AWS_SDK_JS_NODE_VERSION_SUPPORT_WARNING_DISABLED = 'true';

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	vi.clearAllMocks();
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});
