<script lang="ts">
	import StorageObjectBrowser from '$lib/components/StorageObjectBrowser.svelte';
	import { deleteGcpObject, getGcpObject, uploadGcpObject } from '$lib/floci/gcp';

	let { data } = $props();
</script>

<StorageObjectBrowser
	{data}
	rootHref="/gcp/storage"
	rootLabel="GCP Storage"
	resourceLabel="bucket"
	uploadObject={uploadGcpObject}
	getObject={getGcpObject}
	deleteObject={deleteGcpObject}
/>
