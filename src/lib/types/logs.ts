export type LogGroupSummary = {
	name: string;
	arn?: string;
	retentionDays?: number;
	storedBytes?: number;
	creationTime?: string;
};

export type LogStreamSummary = {
	name: string;
	arn?: string;
	lastEventTime?: string;
	storedBytes?: number;
	creationTime?: string;
};

export type LogEvent = {
	timestamp?: string;
	message?: string;
	ingestionTime?: string;
};
