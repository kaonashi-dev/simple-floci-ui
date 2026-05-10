import {
	SSMClient,
	DescribeParametersCommand,
	GetParameterCommand,
	PutParameterCommand,
	DeleteParameterCommand
} from '@aws-sdk/client-ssm';
import { awsConfig } from './aws';
import type { SsmParameterSummary, SsmParameterDetail } from '$lib/types/ssm';

function client() {
	return new SSMClient(awsConfig);
}

export async function listParameters(): Promise<SsmParameterSummary[]> {
	const ssm = client();
	const params = [];
	let nextToken: string | undefined;
	do {
		const res = await ssm.send(new DescribeParametersCommand({ NextToken: nextToken }));
		if (res.Parameters) params.push(...res.Parameters);
		nextToken = res.NextToken;
	} while (nextToken);
	return params.map((p) => ({
		name: p.Name!,
		type: p.Type!,
		description: p.Description,
		lastModifiedDate: p.LastModifiedDate?.toISOString(),
		version: p.Version != null ? Number(p.Version) : undefined
	}));
}

export async function getParameter(name: string): Promise<SsmParameterDetail> {
	const ssm = client();
	const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
	const p = res.Parameter!;
	return {
		name: p.Name!,
		type: p.Type!,
		value: p.Value,
		arn: p.ARN,
		lastModifiedDate: p.LastModifiedDate?.toISOString(),
		version: p.Version != null ? Number(p.Version) : undefined
	};
}

export async function putParameter(name: string, value: string, type: string, overwrite = true): Promise<void> {
	const ssm = client();
	await ssm.send(
		new PutParameterCommand({
			Name: name,
			Value: value,
			Type: type as 'String' | 'SecureString' | 'StringList',
			Overwrite: overwrite
		})
	);
}

export async function deleteParameter(name: string): Promise<void> {
	const ssm = client();
	await ssm.send(new DeleteParameterCommand({ Name: name }));
}
