import {
	LambdaClient,
	ListFunctionsCommand,
	GetFunctionCommand,
	InvokeCommand,
	type FunctionConfiguration
} from '@aws-sdk/client-lambda';
import { makeClient, paginateAll } from './aws';
import type { LambdaFunctionSummary, LambdaFunctionDetail, LambdaInvokeResult } from '$lib/types/lambda';

const lambda = makeClient(LambdaClient);

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
	const functions = await paginateAll((token) =>
		lambda.send(new ListFunctionsCommand({ Marker: token })).then((res) => ({
			items: res.Functions ?? [],
			nextToken: res.NextMarker
		}))
	);
	return functions.map(mapSummary);
}

export async function getFunction(name: string): Promise<LambdaFunctionDetail> {
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
