export type KmsKeySummary = {
	keyId: string;
	keyArn: string;
	aliases: string[];
	description?: string;
	keyState?: string;
	keyUsage?: string;
	keySpec?: string;
	creationDate?: string;
	rotationEnabled?: boolean;
};

export type KmsKeyDetail = KmsKeySummary & {
	enabled: boolean;
	deletionDate?: string;
	validTo?: string;
	origin?: string;
	customKeyStoreId?: string;
	multiRegion?: boolean;
};

export type KmsAlias = {
	name: string;
	targetKeyId?: string;
	creationDate?: string;
	lastUpdatedDate?: string;
};
