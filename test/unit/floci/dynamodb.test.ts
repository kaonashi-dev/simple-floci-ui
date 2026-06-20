import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DeleteTableCommand, DescribeTableCommand, DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { deleteTable, describeTable, listTables, scanTable } from '$lib/floci/dynamodb';

const ddbMock = mockClient(DynamoDBClient);
const docMock = mockClient(DynamoDBDocumentClient);

describe('dynamodb service', () => {
	beforeEach(() => {
		ddbMock.reset();
		docMock.reset();
	});

	it('lists tables across pages and tolerates describe failures', async () => {
		ddbMock
			.on(ListTablesCommand)
			.resolvesOnce({ TableNames: ['orders'], LastEvaluatedTableName: 'orders' })
			.resolvesOnce({ TableNames: ['broken'] });
		ddbMock.on(DescribeTableCommand, { TableName: 'orders' }).resolves({
			Table: {
				TableName: 'orders',
				TableStatus: 'ACTIVE',
				ItemCount: 5,
				CreationDateTime: new Date('2026-01-01T00:00:00Z'),
				BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' }
			}
		});
		ddbMock.on(DescribeTableCommand, { TableName: 'broken' }).rejects(new Error('missing'));

		await expect(listTables()).resolves.toEqual([
			{
				name: 'orders',
				status: 'ACTIVE',
				itemCount: 5,
				creationDate: '2026-01-01T00:00:00.000Z',
				billingMode: 'PAY_PER_REQUEST'
			},
			expect.objectContaining({ name: 'broken', enrichmentError: 'Error: missing' })
		]);
	});

	it('maps table detail schema', async () => {
		ddbMock.on(DescribeTableCommand).resolves({
			Table: {
				TableName: 'orders',
				TableStatus: 'ACTIVE',
				TableArn: 'arn',
				TableSizeBytes: 100,
				KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }],
				GlobalSecondaryIndexes: [{ IndexName: 'gsi', KeySchema: [{ AttributeName: 'gpk', KeyType: 'HASH' }], Projection: { ProjectionType: 'ALL' } }],
				LocalSecondaryIndexes: [{ IndexName: 'lsi', KeySchema: [{ AttributeName: 'sk', KeyType: 'RANGE' }], Projection: { ProjectionType: 'KEYS_ONLY' } }]
			}
		});

		await expect(describeTable('orders')).resolves.toEqual(
			expect.objectContaining({
				name: 'orders',
				arn: 'arn',
				sizeBytes: 100,
				keySchema: [{ attributeName: 'pk', keyType: 'HASH' }],
				gsis: [{ name: 'gsi', keySchema: [{ attributeName: 'gpk', keyType: 'HASH' }], projection: 'ALL' }],
				lsis: [{ name: 'lsi', keySchema: [{ attributeName: 'sk', keyType: 'RANGE' }], projection: 'KEYS_ONLY' }]
			})
		);
	});

	it('scans with filter and pagination options', async () => {
		docMock.on(ScanCommand).resolves({ Items: [{ pk: '1' }], Count: 1, ScannedCount: 2, LastEvaluatedKey: { pk: '2' } });

		await expect(
			scanTable('orders', { limit: 25, indexName: 'gsi', filter: { attribute: 'status', value: 'open' }, lastKey: { pk: '0' } })
		).resolves.toEqual({ items: [{ pk: '1' }], count: 1, scannedCount: 2, lastEvaluatedKey: { pk: '2' } });
		expect(docMock.commandCalls(ScanCommand)[0].args[0].input).toEqual({
			TableName: 'orders',
			Limit: 25,
			IndexName: 'gsi',
			ExclusiveStartKey: { pk: '0' },
			FilterExpression: 'contains(#a, :v)',
			ExpressionAttributeNames: { '#a': 'status' },
			ExpressionAttributeValues: { ':v': 'open' }
		});
	});

	it('deletes tables', async () => {
		ddbMock.on(DeleteTableCommand).resolves({});

		await deleteTable('orders');

		expect(ddbMock.commandCalls(DeleteTableCommand)[0].args[0].input).toEqual({ TableName: 'orders' });
	});
});
