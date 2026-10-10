// the reference track goes browser -> Blob directly; the token is only handed out to a valid license (clientPayload = {email, key})
import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { checkKey } from '@/lib/license';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const p = JSON.parse(clientPayload || '{}');
        if (!checkKey(p.key, p.email)) throw new Error('This license key does not match that e-mail.');
        return {
          allowedContentTypes: ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mpeg', 'audio/mp3', 'audio/aiff', 'audio/x-aiff', 'audio/mp4', 'audio/x-m4a', 'audio/flac', 'audio/x-flac', 'application/octet-stream'],
          maximumSizeInBytes: 120 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'upload failed' }, { status: 400 });
  }
}
