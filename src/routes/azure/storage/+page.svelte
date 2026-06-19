<script lang="ts">
	import StorageResourceList from '$lib/components/StorageResourceList.svelte';
	import { createAzureBlobContainer, deleteAzureBlobContainer } from '$lib/floci/azure';

	let { data } = $props();
</script>

<StorageResourceList
	{data}
	cloudName="Azure"
	serviceTitle="Blob Containers"
	subtitle="Browse containers and blobs in your local Floci-AZ runtime."
	rootHref="/azure/storage"
	resourceLabel="Container"
	namePlaceholder="my-container"
	createResource={createAzureBlobContainer}
	deleteResource={deleteAzureBlobContainer}
/>
