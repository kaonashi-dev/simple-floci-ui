<script lang="ts">
	import StorageObjectBrowser from '$lib/components/StorageObjectBrowser.svelte';
	import {
		deleteAzureBlobObject,
		getAzureBlobObject,
		uploadAzureBlobObject
	} from '$lib/floci/azure';

	let { data } = $props();
</script>

<StorageObjectBrowser
	{data}
	rootHref="/azure/storage"
	rootLabel="Azure Blob"
	resourceLabel="container"
	uploadObject={uploadAzureBlobObject}
	getObject={getAzureBlobObject}
	deleteObject={deleteAzureBlobObject}
/>
