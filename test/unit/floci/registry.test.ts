import { describe, expect, it } from 'vitest';
import { SERVICES } from '$lib/floci/registry';

describe('service registry', () => {
	it('declares every dashboard service with a list function', () => {
		expect(SERVICES.map((service) => service.id)).toEqual([
			'sqs',
			's3',
			'cognito',
			'kms',
			'lambda',
			'dynamodb',
			'sns',
			'apigateway',
			'iam',
			'logs',
			'eventbridge',
			'secrets',
			'ssm',
			'azure-storage',
			'gcp-storage'
		]);
		expect(SERVICES.every((service) => typeof service.list === 'function')).toBe(true);
	});
});
