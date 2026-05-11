import {
	DynamoDBClient,
	ListTablesCommand,
	DescribeTableCommand,
	DeleteTableCommand
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { makeClient, paginateAll } from './aws';
import type {
	DynamoTableSummary,
	DynamoTableDetail,
	DynamoScanResult
} from '$lib/types/dynamodb';

const ddb = makeClient(DynamoDBClient);
const doc = DynamoDBDocumentClient.from(ddb);

export async function listTables(): Promise<DynamoTableSummary[]> {
	const names = await paginateAll((token) =>
		ddb.send(new ListTablesCommand({ ExclusiveStartTableName: token })).then((res) => ({
			items: res.TableNames ?? [],
			nextToken: res.LastEvaluatedTableName
		}))
	);

	return Promise.all(
		names.map(async (name) => {
			try {
				const res = await ddb.send(new DescribeTableCommand({ TableName: name }));
				const t = res.Table!;
				return {
					name,
					status: t.TableStatus,
					itemCount: t.ItemCount != null ? Number(t.ItemCount) : undefined,
					creationDate: t.CreationDateTime?.toISOString(),
					billingMode: t.BillingModeSummary?.BillingMode ?? 'PROVISIONED'
				} satisfies DynamoTableSummary;
			} catch (e) {
				return { name, enrichmentError: String(e) } satisfies DynamoTableSummary;
			}
		})
	);
}

export async function describeTable(name: string): Promise<DynamoTableDetail> {
	const res = await ddb.send(new DescribeTableCommand({ TableName: name }));
	const t = res.Table!;

	return {
		name,
		status: t.TableStatus,
		arn: t.TableArn,
		itemCount: t.ItemCount != null ? Number(t.ItemCount) : undefined,
		creationDate: t.CreationDateTime?.toISOString(),
		billingMode: t.BillingModeSummary?.BillingMode ?? 'PROVISIONED',
		sizeBytes: t.TableSizeBytes != null ? Number(t.TableSizeBytes) : undefined,
		keySchema: (t.KeySchema ?? []).map((k) => ({
			attributeName: k.AttributeName!,
			keyType: k.KeyType!
		})),
		gsis: (t.GlobalSecondaryIndexes ?? []).map((i) => ({
			name: i.IndexName!,
			keySchema: (i.KeySchema ?? []).map((k) => ({ attributeName: k.AttributeName!, keyType: k.KeyType! })),
			projection: i.Projection?.ProjectionType
		})),
		lsis: (t.LocalSecondaryIndexes ?? []).map((i) => ({
			name: i.IndexName!,
			keySchema: (i.KeySchema ?? []).map((k) => ({ attributeName: k.AttributeName!, keyType: k.KeyType! })),
			projection: i.Projection?.ProjectionType
		}))
	};
}

export async function scanTable(name: string, limit = 50, lastKey?: Record<string, unknown>): Promise<DynamoScanResult> {
	const res = await doc.send(
		new ScanCommand({
			TableName: name,
			Limit: limit,
			ExclusiveStartKey: lastKey as Record<string, never> | undefined
		})
	);
	return {
		items: (res.Items ?? []) as Record<string, unknown>[],
		lastEvaluatedKey: res.LastEvaluatedKey as Record<string, unknown> | undefined,
		count: res.Count ?? 0
	};
}

export async function deleteTable(name: string): Promise<void> {
	await ddb.send(new DeleteTableCommand({ TableName: name }));
}
