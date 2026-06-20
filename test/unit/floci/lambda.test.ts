import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { GetFunctionCommand, InvokeCommand, LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { getFunction, invokeFunction, listFunctions } from '$lib/floci/lambda';

const lambdaMock = mockClient(LambdaClient);

describe('lambda service', () => {
	beforeEach(() => {
		lambdaMock.reset();
	});

	it('lists functions across pages', async () => {
		lambdaMock
			.on(ListFunctionsCommand)
			.resolvesOnce({ Functions: [{ FunctionName: 'fn-1', FunctionArn: 'arn-1', Runtime: 'nodejs20.x' }], NextMarker: 'next' })
			.resolvesOnce({ Functions: [{ FunctionName: 'fn-2', FunctionArn: 'arn-2', Handler: 'index.handler' }] });

		await expect(listFunctions()).resolves.toEqual([
			expect.objectContaining({ name: 'fn-1', arn: 'arn-1', runtime: 'nodejs20.x' }),
			expect.objectContaining({ name: 'fn-2', arn: 'arn-2', handler: 'index.handler' })
		]);
	});

	it('loads function details', async () => {
		lambdaMock.on(GetFunctionCommand).resolves({
			Configuration: {
				FunctionName: 'fn',
				FunctionArn: 'arn',
				Role: 'role',
				CodeSize: 123,
				Environment: { Variables: { NODE_ENV: 'test' } },
				Layers: [{ Arn: 'layer-1' }]
			}
		});

		await expect(getFunction('fn')).resolves.toEqual(
			expect.objectContaining({ name: 'fn', arn: 'arn', role: 'role', codeSize: 123, environment: { NODE_ENV: 'test' }, layers: ['layer-1'] })
		);
	});

	it('invokes functions and decodes payload and logs', async () => {
		lambdaMock.on(InvokeCommand).resolves({
			StatusCode: 200,
			Payload: new TextEncoder().encode('{"ok":true}') as never,
			LogResult: Buffer.from('log line').toString('base64'),
			FunctionError: 'Unhandled'
		});

		await expect(invokeFunction('fn', '{"hello":"world"}')).resolves.toEqual({
			statusCode: 200,
			payload: '{"ok":true}',
			logResult: 'log line',
			functionError: 'Unhandled'
		});
		expect(new TextDecoder().decode(lambdaMock.commandCalls(InvokeCommand)[0].args[0].input.Payload as Uint8Array)).toBe('{"hello":"world"}');
	});
});
