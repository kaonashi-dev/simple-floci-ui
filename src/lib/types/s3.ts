export type S3BucketSummary = {
	name: string;
	creationDate?: string;
};

export type S3ObjectSummary = {
	key: string;
	name: string;
	type: 'folder' | 'file';
	size?: number;
	lastModified?: string;
};

export type S3ObjectListing = {
	bucket: string;
	prefix: string;
	folders: S3ObjectSummary[];
	files: S3ObjectSummary[];
};

export type S3DownloadedObject = {
	body: Uint8Array;
	contentType?: string;
	contentLength?: number;
};

export type S3ObjectMetadata = {
	key: string;
	contentType?: string;
	contentLength?: number;
	lastModified?: string;
	metadata?: Record<string, string>;
};
