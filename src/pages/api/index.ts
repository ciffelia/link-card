import type { NextRequest } from 'next/server';
import { createLinkCardFromUrl } from '@/utils/createLinkCard';

export const config = {
  runtime: 'edge',
};

export const handler = async (req: NextRequest): Promise<Response> => {
  const urlText = req.nextUrl.searchParams.get('url');
  if (urlText === null) {
    return new Response(null, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    return new Response(null, { status: 400 });
  }

  const linkCard = await createLinkCardFromUrl(url);

  return new Response(JSON.stringify(linkCard), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=86400',
    },
  });
};

export default handler;
