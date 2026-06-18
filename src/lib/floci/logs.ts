import {
	CloudWatchLogsClient,
	DescribeLogGroupsCommand,
	DescribeLogStreamsCommand,
	GetLogEventsCommand,
	FilterLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import { makeClient, paginateAll } from './aws';
import type { LogGroupSummary, LogStreamSummary, LogEvent } from '$lib/types/logs';

const cw = makeClient(CloudWatchLogsClient);

export async function listLogGroups(prefix?: string): Promise<LogGroupSummary[]> {
	const groups = await paginateAll((token) =>
		cw.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: prefix, nextToken: token })).then((res) => ({
			items: res.logGroups ?? [],
			nextToken: res.nextToken
		}))
	);
	return groups.map((g) => ({
		name: g.logGroupName!,
		arn: g.arn,
		retentionDays: g.retentionInDays,
		storedBytes: g.storedBytes != null ? Number(g.storedBytes) : undefined,
		creationTime: g.creationTime != null ? new Date(Number(g.creationTime)).toISOString() : undefined
	}));
}

export async function listLogStreams(groupName: string): Promise<LogStreamSummary[]> {
	const streams = [];
	let nextToken: string | undefined;
	do {
		const res = await cw.send(
			new DescribeLogStreamsCommand({
				logGroupName: groupName,
				orderBy: 'LastEventTime',
				descending: true,
				nextToken
			})
		);
		if (res.logStreams) streams.push(...res.logStreams);
		nextToken = res.nextToken;
		if (streams.length >= 100) break;
	} while (nextToken);
	return streams.map((s) => ({
		name: s.logStreamName!,
		arn: s.arn,
		lastEventTime:
			s.lastEventTimestamp != null ? new Date(Number(s.lastEventTimestamp)).toISOString() : undefined,
		storedBytes: s.storedBytes != null ? Number(s.storedBytes) : undefined,
		creationTime: s.creationTime != null ? new Date(Number(s.creationTime)).toISOString() : undefined
	}));
}

export async function getLogEvents(
	groupName: string,
	streamName: string,
	limit = 100
): Promise<LogEvent[]> {
	const res = await cw.send(
		new GetLogEventsCommand({
			logGroupName: groupName,
			logStreamName: streamName,
			limit,
			startFromHead: false
		})
	);
	return (res.events ?? [])
		.map((e) => ({
			timestamp: e.timestamp != null ? new Date(Number(e.timestamp)).toISOString() : undefined,
			message: e.message,
			ingestionTime: e.ingestionTime != null ? new Date(Number(e.ingestionTime)).toISOString() : undefined
		}))
		.reverse();
}

export async function filterLogEvents(
	groupName: string,
	pattern: string,
	limit = 100
): Promise<LogEvent[]> {
	const res = await cw.send(
		new FilterLogEventsCommand({
			logGroupName: groupName,
			filterPattern: pattern,
			limit
		})
	);
	return (res.events ?? []).map((e) => ({
		timestamp: e.timestamp != null ? new Date(Number(e.timestamp)).toISOString() : undefined,
		message: e.message
	}));
}
