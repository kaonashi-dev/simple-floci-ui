import { getRestApiResources, getRestApiStages } from '$lib/server/apigateway';

export async function load({ params }) {
  const id = decodeURIComponent(params.id);
  try {
    const [resources, stages] = await Promise.all([
      getRestApiResources(id),
      getRestApiStages(id)
    ]);
    return { id, resources, stages, error: null };
  } catch (e) {
    return { id, resources: [], stages: [], error: String(e) };
  }
}
