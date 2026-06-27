import { describe, expect, it } from 'vitest';
import { pruneSnapshots } from '$lib/floci/sqs-snapshots';
import type { SqsDepthSnapshot } from '$lib/types/sqs';

function snap(tsMs: number): SqsDepthSnapshot {
	return { tsMs, visible: 0, notVisible: 0, delayed: 0 };
}

describe('sqs-snapshots', () => {
	describe('pruneSnapshots', () => {
		const snaps = [snap(100), snap(200), snap(300)];

		it('drops snapshots older than the max age', () => {
			expect(pruneSnapshots(snaps, 350, 200).map((s) => s.tsMs)).toEqual([200, 300]);
		});

		it('caps the total count, keeping the newest', () => {
			expect(pruneSnapshots(snaps, 350, 10_000, 2).map((s) => s.tsMs)).toEqual([200, 300]);
		});

		it('keeps everything when within limits', () => {
			expect(pruneSnapshots(snaps, 350, 10_000, 10)).toHaveLength(3);
		});
	});
});
