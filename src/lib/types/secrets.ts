export type SecretSummary = {
	name: string;
	arn: string;
	description?: string;
	lastChangedDate?: string;
	lastAccessedDate?: string;
};

export type SecretDetail = SecretSummary & {
	secretValue?: string;
};
