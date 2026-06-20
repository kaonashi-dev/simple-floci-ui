import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
	GetBucketCorsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	CreateBucketCommand,
	DeleteBucketCommand,
	DeleteObjectCommand,
	ListBucketsCommand,
	ListObjectsV2Command,
	PutBucketCorsCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { createBucket, deleteBucket, deleteObject, getBucketCors, getObject, headObject, listBuckets, listObjects, putBucketCorsAllowAll, uploadObject } from '$lib/floci/s3';

const s3Mock = mockClient(S3Client);

describe('s3 service', () => {
	beforeEach(() => {
		s3Mock.reset();
	});

	it('lists and mutates buckets', async () => {
		s3Mock.on(ListBucketsCommand).resolves({ Buckets: [{ Name: 'bucket', CreationDate: new Date('2026-01-01T00:00:00Z') }] });
		s3Mock.on(CreateBucketCommand).resolves({});
		s3Mock.on(DeleteBucketCommand).resolves({});

		await expect(listBuckets()).resolves.toEqual([{ name: 'bucket', creationDate: '2026-01-01T00:00:00.000Z' }]);
		await createBucket('bucket');
		await deleteBucket('bucket');

		expect(s3Mock.commandCalls(CreateBucketCommand)[0].args[0].input).toEqual({ Bucket: 'bucket' });
		expect(s3Mock.commandCalls(DeleteBucketCommand)[0].args[0].input).toEqual({ Bucket: 'bucket' });
	});

	it('lists folders and files across pages', async () => {
		s3Mock
			.on(ListObjectsV2Command)
			.resolvesOnce({
				CommonPrefixes: [{ Prefix: 'photos/2026/' }],
				Contents: [{ Key: 'photos/', Size: 0 }, { Key: 'photos/readme.txt', Size: 12, LastModified: new Date('2026-01-01T00:00:00Z') }],
				IsTruncated: true,
				NextContinuationToken: 'page-2'
			})
			.resolvesOnce({ Contents: [{ Key: 'photos/image.png', Size: 42 }], IsTruncated: false });

		await expect(listObjects('bucket', 'photos/')).resolves.toEqual({
			bucket: 'bucket',
			prefix: 'photos/',
			folders: [{ key: 'photos/2026/', name: '2026', type: 'folder' }],
			files: [
				{ key: 'photos/readme.txt', name: 'readme.txt', type: 'file', size: 12, lastModified: '2026-01-01T00:00:00.000Z' },
				{ key: 'photos/image.png', name: 'image.png', type: 'file', size: 42, lastModified: undefined }
			]
		});
		expect(s3Mock.commandCalls(ListObjectsV2Command).map((call) => call.args[0].input)).toEqual([
			expect.objectContaining({ Bucket: 'bucket', Prefix: 'photos/', ContinuationToken: undefined }),
			expect.objectContaining({ Bucket: 'bucket', Prefix: 'photos/', ContinuationToken: 'page-2' })
		]);
	});

	it('uploads and downloads objects', async () => {
		s3Mock.on(PutObjectCommand).resolves({});
		s3Mock.on(GetObjectCommand).resolves({
			Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } as never,
			ContentType: 'text/plain',
			ContentLength: 3
		});

		await uploadObject('bucket', 'key.txt', new Uint8Array([1]), 'text/plain');
		await expect(getObject('bucket', 'key.txt')).resolves.toEqual({
			body: new Uint8Array([1, 2, 3]),
			contentType: 'text/plain',
			contentLength: 3
		});

		expect(s3Mock.commandCalls(PutObjectCommand)[0].args[0].input).toEqual({
			Bucket: 'bucket',
			Key: 'key.txt',
			Body: new Uint8Array([1]),
			ContentType: 'text/plain'
		});
	});

	it('deletes objects', async () => {
		s3Mock.on(DeleteObjectCommand).resolves({});

		await deleteObject('bucket', 'key.txt');

		expect(s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input).toEqual({ Bucket: 'bucket', Key: 'key.txt' });
	});

	it('returns CORS availability and writes an allow-all CORS config', async () => {
		s3Mock.on(GetBucketCorsCommand).resolves({});
		await expect(getBucketCors('bucket')).resolves.toBe(true);

		s3Mock.reset();
		s3Mock.on(GetBucketCorsCommand).rejects(new Error('no cors'));
		await expect(getBucketCors('bucket')).resolves.toBe(false);

		s3Mock.on(PutBucketCorsCommand).resolves({});
		await putBucketCorsAllowAll('bucket');
		expect(s3Mock.commandCalls(PutBucketCorsCommand)[0].args[0].input).toEqual(
			expect.objectContaining({
				Bucket: 'bucket',
				CORSConfiguration: expect.objectContaining({
					CORSRules: [expect.objectContaining({ AllowedOrigins: ['*'] })]
				})
			})
		);
	});

	it('maps object metadata', async () => {
		s3Mock.on(HeadObjectCommand).resolves({
			ContentType: 'application/json',
			ContentLength: 10,
			LastModified: new Date('2026-01-02T00:00:00Z'),
			Metadata: { owner: 'dev' }
		});

		await expect(headObject('bucket', 'key.json')).resolves.toEqual({
			key: 'key.json',
			contentType: 'application/json',
			contentLength: 10,
			lastModified: '2026-01-02T00:00:00.000Z',
			metadata: { owner: 'dev' }
		});
	});
});
