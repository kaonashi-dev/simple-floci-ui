export type DynamoTableSummary = {
	name: string;
	status?: string;
	itemCount?: number;
	creationDate?: string;
	billingMode?: string;
	enrichmentError?: string;
};

export type DynamoKeySchema = {
	attributeName: string;
	keyType: string;
};

export type DynamoIndex = {
	name: string;
	keySchema: DynamoKeySchema[];
	projection?: string;
};

export type DynamoTableDetail = DynamoTableSummary & {
	arn?: string;
	keySchema: DynamoKeySchema[];
	gsis: DynamoIndex[];
	lsis: DynamoIndex[];
	sizeBytes?: number;
};

export type DynamoItem = Record<string, unknown>;

export type DynamoScanResult = {
	items: DynamoItem[];
	lastEvaluatedKey?: Record<string, unknown>;
	count: number;
	scannedCount?: number;
};
