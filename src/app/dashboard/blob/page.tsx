export const dynamic = 'force-dynamic';

import { list } from '@vercel/blob';
import BlobClient, { BlobFile } from './BlobClient';

export default async function BlobManagementPage() {
  let initialBlobs: BlobFile[] = [];
  let initialCursor: string | null = null;
  let initialHasMore = false;

  try {
    const result = await list({ limit: 100 });
    initialBlobs = result.blobs.map(blob => ({
      pathname: blob.pathname,
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toISOString(),
    }));
    initialCursor = result.cursor || null;
    initialHasMore = result.hasMore || false;
  } catch (error) {
    console.error('Initial blob list error:', error);
  }

  return (
    <BlobClient 
      initialBlobs={initialBlobs}
      initialCursor={initialCursor}
      initialHasMore={initialHasMore}
    />
  );
}
