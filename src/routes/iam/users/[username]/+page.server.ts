import { getUserDetail } from '$lib/server/iam';

export async function load({ params }) {
  const username = decodeURIComponent(params.username);
  try {
    const detail = await getUserDetail(username);
    return { username, detail, error: null };
  } catch (e) {
    return { username, detail: null, error: String(e) };
  }
}
