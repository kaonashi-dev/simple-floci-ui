export type LambdaFunctionSummary = {
	name: string;
	arn: string;
	runtime?: string;
	handler?: string;
	state?: string;
	memorySizeMb?: number;
	timeoutSec?: number;
	lastModified?: string;
	description?: string;
};

export type LambdaFunctionDetail = LambdaFunctionSummary & {
	role?: string;
	codeSize?: number;
	environment?: Record<string, string>;
	layers?: string[];
};

export type LambdaInvokeResult = {
	statusCode?: number;
	payload?: string;
	logResult?: string;
	functionError?: string;
};
