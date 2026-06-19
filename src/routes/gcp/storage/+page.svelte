<script lang="ts">
	import StorageResourceList from '$lib/components/StorageResourceList.svelte';
	import { createGcpBucket, deleteGcpBucket } from '$lib/floci/gcp';

	let { data } = $props();
</script>

<StorageResourceList
	{data}
	cloudName="GCP"
	serviceTitle="Cloud Storage Buckets"
	subtitle="Browse buckets and objects in your local Floci-GCP runtime."
	rootHref="/gcp/storage"
	resourceLabel="Bucket"
	namePlaceholder="my-bucket"
	createResource={createGcpBucket}
	deleteResource={deleteGcpBucket}
/>
