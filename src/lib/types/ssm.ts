export type SsmParameterSummary = {
	name: string;
	type: string;
	description?: string;
	lastModifiedDate?: string;
	version?: number;
};

export type SsmParameterDetail = SsmParameterSummary & {
	value?: string;
	arn?: string;
};
