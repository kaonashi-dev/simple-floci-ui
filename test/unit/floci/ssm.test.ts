import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DeleteParameterCommand, DescribeParametersCommand, GetParameterCommand, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { deleteParameter, getParameter, listParameters, putParameter } from '$lib/floci/ssm';

const ssmMock = mockClient(SSMClient);

describe('ssm service', () => {
	beforeEach(() => ssmMock.reset());

	it('lists parameters across pages', async () => {
		ssmMock
			.on(DescribeParametersCommand)
			.resolvesOnce({ Parameters: [{ Name: '/app/a', Type: 'String', LastModifiedDate: new Date('2026-01-01T00:00:00Z'), Version: 1 }], NextToken: 'next' })
			.resolvesOnce({ Parameters: [{ Name: '/app/b', Type: 'SecureString' }] });

		await expect(listParameters()).resolves.toEqual([
			{ name: '/app/a', type: 'String', description: undefined, lastModifiedDate: '2026-01-01T00:00:00.000Z', version: 1 },
			{ name: '/app/b', type: 'SecureString', description: undefined, lastModifiedDate: undefined, version: undefined }
		]);
	});

	it('gets, puts, and deletes parameters', async () => {
		ssmMock.on(GetParameterCommand).resolves({ Parameter: { Name: '/app/a', Type: 'String', Value: 'value', ARN: 'arn', Version: 3 } });
		ssmMock.on(PutParameterCommand).resolves({});
		ssmMock.on(DeleteParameterCommand).resolves({});

		await expect(getParameter('/app/a')).resolves.toEqual({ name: '/app/a', type: 'String', value: 'value', arn: 'arn', lastModifiedDate: undefined, version: 3 });
		await putParameter('/app/a', 'next', 'SecureString', false, 'desc');
		await deleteParameter('/app/a');

		expect(ssmMock.commandCalls(GetParameterCommand)[0].args[0].input).toEqual({ Name: '/app/a', WithDecryption: true });
		expect(ssmMock.commandCalls(PutParameterCommand)[0].args[0].input).toEqual({ Name: '/app/a', Value: 'next', Type: 'SecureString', Description: 'desc', Overwrite: false });
		expect(ssmMock.commandCalls(DeleteParameterCommand)[0].args[0].input).toEqual({ Name: '/app/a' });
	});
});
