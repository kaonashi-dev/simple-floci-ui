import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, FilterLogEventsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { filterLogEvents, getLogEvents, listLogGroups, listLogStreams } from '$lib/floci/logs';

const logsMock = mockClient(CloudWatchLogsClient);

describe('logs service', () => {
	beforeEach(() => logsMock.reset());

	it('lists log groups with timestamps and sizes', async () => {
		logsMock.on(DescribeLogGroupsCommand).resolves({
			logGroups: [{ logGroupName: '/aws/lambda/fn', arn: 'arn', retentionInDays: 7, storedBytes: 42, creationTime: Date.parse('2026-01-01T00:00:00Z') }]
		});

		await expect(listLogGroups('/aws')).resolves.toEqual([{ name: '/aws/lambda/fn', arn: 'arn', retentionDays: 7, storedBytes: 42, creationTime: '2026-01-01T00:00:00.000Z' }]);
		expect(logsMock.commandCalls(DescribeLogGroupsCommand)[0].args[0].input).toEqual({ logGroupNamePrefix: '/aws', nextToken: undefined });
	});

	it('lists at most 100 log streams', async () => {
		logsMock.on(DescribeLogStreamsCommand).resolves({
			logStreams: Array.from({ length: 101 }, (_, i) => ({ logStreamName: `stream-${i}`, lastEventTimestamp: i })),
			nextToken: 'ignored'
		});

		const streams = await listLogStreams('group');

		expect(streams).toHaveLength(101);
		expect(logsMock.commandCalls(DescribeLogStreamsCommand)).toHaveLength(1);
	});

	it('maps and reverses log events', async () => {
		logsMock.on(GetLogEventsCommand).resolves({
			events: [
				{ timestamp: 1, message: 'old', ingestionTime: 2 },
				{ timestamp: 3, message: 'new', ingestionTime: 4 }
			]
		});

		await expect(getLogEvents('group', 'stream', 2)).resolves.toEqual([
			{ timestamp: '1970-01-01T00:00:00.003Z', message: 'new', ingestionTime: '1970-01-01T00:00:00.004Z' },
			{ timestamp: '1970-01-01T00:00:00.001Z', message: 'old', ingestionTime: '1970-01-01T00:00:00.002Z' }
		]);
	});

	it('filters log events', async () => {
		logsMock.on(FilterLogEventsCommand).resolves({ events: [{ timestamp: 1, message: 'match' }] });

		await expect(filterLogEvents('group', 'ERROR', 10)).resolves.toEqual([{ timestamp: '1970-01-01T00:00:00.001Z', message: 'match' }]);
		expect(logsMock.commandCalls(FilterLogEventsCommand)[0].args[0].input).toEqual({ logGroupName: 'group', filterPattern: 'ERROR', limit: 10 });
	});
});
