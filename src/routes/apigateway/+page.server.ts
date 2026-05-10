import { listRestApis, listHttpApis } from '$lib/server/apigateway';

export async function load() {
  try {
    const [restApis, httpApis] = await Promise.all([listRestApis(), listHttpApis()]);
    return { restApis, httpApis, error: null };
  } catch (e) {
    return { restApis: [], httpApis: [], error: String(e) };
  }
}
