export type CloudStorageResource = {
	id: string;
	name: string;
	type: 'bucket' | 'container';
	createdAt?: string | null;
	region?: string | null;
	metadata?: Record<string, unknown>;
};

export type CloudStorageObjectSummary = {
	key: string;
	name: string;
	type: 'folder' | 'file';
	size?: number | null;
	lastModified?: string | null;
	contentType?: string | null;
	metadata?: Record<string, unknown>;
};

export type CloudStorageObjectListing = {
	resource: string;
	prefix: string;
	folders: CloudStorageObjectSummary[];
	files: CloudStorageObjectSummary[];
};

export type CloudStorageDownloadedObject = {
	body: Uint8Array;
	contentType?: string | null;
	contentLength?: number | null;
};
