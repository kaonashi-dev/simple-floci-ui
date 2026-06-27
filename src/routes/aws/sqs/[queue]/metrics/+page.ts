export async function load({ params }) {
	const name = decodeURIComponent(params.queue);
	return { name, isFifo: name.endsWith('.fifo') };
}
