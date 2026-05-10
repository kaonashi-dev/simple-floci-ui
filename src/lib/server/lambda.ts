import {
	LambdaClient,
	ListFunctionsCommand,
	GetFunctionCommand,
	InvokeCommand,
	type FunctionConfiguration
} from '@aws-sdk/client-lambda';
import { awsConfig } from './aws';
import type { LambdaFunctionSummary, LambdaFunctionDetail, LambdaInvokeResult } from '$lib/types/lambda';

function client() {
	return new LambdaClient(awsConfig);
}

function mapSummary(fn: FunctionConfiguration): LambdaFunctionSummary {
	return {
		name: fn.FunctionName!,
		arn: fn.FunctionArn!,
		runtime: fn.Runtime,
		handler: fn.Handler,
		state: fn.State,
		memorySizeMb: fn.MemorySize,
		timeoutSec: fn.Timeout,
		lastModified: fn.LastModified,
		description: fn.Description
	};
}

export async function listFunctions(): Promise<LambdaFunctionSummary[]> {
	const lambda = client();
	const functions: FunctionConfiguration[] = [];
	let marker: string | undefined;

	do {
		const res = await lambda.send(new ListFunctionsCommand({ Marker: marker }));
		if (res.Functions) functions.push(...res.Functions);
		marker = res.NextMarker;
	} while (marker);

	return functions.map(mapSummary);
}

export async function getFunction(name: string): Promise<LambdaFunctionDetail> {
	const lambda = client();
	const res = await lambda.send(new GetFunctionCommand({ FunctionName: name }));
	const cfg = res.Configuration!;
	return {
		...mapSummary(cfg),
		role: cfg.Role,
		codeSize: cfg.CodeSize,
		environment: cfg.Environment?.Variables,
		layers: cfg.Layers?.map((l) => l.Arn ?? '') ?? []
	};
}

export async function invokeFunction(name: string, payload: string): Promise<LambdaInvokeResult> {
	const lambda = client();
	const res = await lambda.send(
		new InvokeCommand({
			FunctionName: name,
			Payload: new TextEncoder().encode(payload),
			LogType: 'Tail'
		})
	);

	const payloadStr = res.Payload ? new TextDecoder().decode(res.Payload) : undefined;
	const logResult = res.LogResult
		? Buffer.from(res.LogResult, 'base64').toString('utf-8')
		: undefined;

	return {
		statusCode: res.StatusCode,
		payload: payloadStr,
		logResult,
		functionError: res.FunctionError
	};
}
