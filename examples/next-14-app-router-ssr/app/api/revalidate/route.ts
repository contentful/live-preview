// route handler with secret and slug
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function getQSParamFromURL(key: string, url: string): string | null {
  if (!url) return '';
  const search = new URL(url).search;
  const urlParams = new URLSearchParams(search);
  return urlParams.get(key);
}

export async function GET(request: Request) {
  // Parse query string parameters
  const path = getQSParamFromURL('pathname', request.url);
  if (path) {
    revalidatePath(path);
    redirect(path);
  }
  return new Response('OK');
}
