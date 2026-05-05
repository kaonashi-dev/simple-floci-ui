import {
	S3Client,
	ListBucketsCommand,
	CreateBucketCommand,
	DeleteBucketCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	GetBucketCorsCommand,
	PutBucketCorsCommand
} from '@aws-sdk/client-s3';
import { awsConfig } from './aws';
import type {
	S3BucketSummary,
	S3ObjectListing,
	S3ObjectSummary,
	S3DownloadedObject,
	S3ObjectMetadata
} from '$lib/types/s3';

function client() {
	return new S3Client(awsConfig);
}

export async function listBuckets(): Promise<S3BucketSummary[]> {
	const s3 = client();
	const res = await s3.send(new ListBucketsCommand({}));
	return (res.Buckets ?? []).map((b) => ({
		name: b.Name!,
		creationDate: b.CreationDate?.toISOString()
	}));
}

export async function createBucket(name: string): Promise<void> {
	const s3 = client();
	await s3.send(new CreateBucketCommand({ Bucket: name }));
}

export async function deleteBucket(name: string): Promise<void> {
	const s3 = client();
	await s3.send(new DeleteBucketCommand({ Bucket: name }));
}

export async function listObjects(bucket: string, prefix = ''): Promise<S3ObjectListing> {
	const s3 = client();
	const folders: S3ObjectSummary[] = [];
	const files: S3ObjectSummary[] = [];
	let continuationToken: string | undefined;

	do {
		const res = await s3.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix || undefined,
				Delimiter: '/',
				ContinuationToken: continuationToken
			})
		);

		for (const cp of res.CommonPrefixes ?? []) {
			const key = cp.Prefix!;
			folders.push({
				key,
				name: key.slice(prefix.length).replace(/\/$/, ''),
				type: 'folder'
			});
		}

		for (const obj of res.Contents ?? []) {
			if (obj.Key === prefix) continue; // skip the prefix itself
			files.push({
				key: obj.Key!,
				name: obj.Key!.slice(prefix.length),
				type: 'file',
				size: obj.Size,
				lastModified: obj.LastModified?.toISOString()
			});
		}

		continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
	} while (continuationToken);

	return { bucket, prefix, folders, files };
}

export async function uploadObject(
	bucket: string,
	key: string,
	body: Buffer | Uint8Array,
	contentType?: string
): Promise<void> {
	const s3 = client();
	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType
		})
	);
}

export async function getObject(bucket: string, key: string): Promise<S3DownloadedObject> {
	const s3 = client();
	const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
	const body = await res.Body!.transformToByteArray();
	return {
		body,
		contentType: res.ContentType,
		contentLength: res.ContentLength
	};
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
	const s3 = client();
	await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getBucketCors(bucket: string): Promise<boolean> {
	const s3 = client();
	try {
		await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
		return true;
	} catch {
		return false;
	}
}

export async function putBucketCorsAllowAll(bucket: string): Promise<void> {
	const s3 = client();
	await s3.send(
		new PutBucketCorsCommand({
			Bucket: bucket,
			CORSConfiguration: {
				CORSRules: [
					{
						AllowedHeaders: ['*'],
						AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
						AllowedOrigins: ['*'],
						ExposeHeaders: ['ETag'],
						MaxAgeSeconds: 3000
					}
				]
			}
		})
	);
}

export async function headObject(bucket: string, key: string): Promise<S3ObjectMetadata> {
	const s3 = client();
	const res = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
	return {
		key,
		contentType: res.ContentType,
		contentLength: res.ContentLength,
		lastModified: res.LastModified?.toISOString(),
		metadata: res.Metadata
	};
}
