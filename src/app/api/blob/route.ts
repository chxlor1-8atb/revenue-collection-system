import { list, del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { lineMessages, transactions } from '@/lib/schema';
import { eq, or } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') || undefined;

  try {
    const result = await list({ prefix });
    const blobs = result.blobs.map(blob => ({
      pathname: blob.pathname,
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
    return NextResponse.json({ blobs, hasMore: result.hasMore });
  } catch (error) {
    console.error('Blob list error:', error);
    return NextResponse.json({ error: 'Failed to list blobs' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { mode, urls, days } = await request.json();
    let deletedCount = 0;

    if (mode === 'selected') {
      // Delete specific URLs
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
      }
      for (const url of urls) {
        try {
          await del(url);
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete ${url}:`, e);
        }
      }
    } else if (mode === 'old') {
      // Delete files older than N days
      const threshold = days || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - threshold);

      // List all blobs across all prefixes
      const prefixes = ['line-slips/', 'slips/', 'qr-codes/'];
      for (const prefix of prefixes) {
        let cursor: string | undefined;
        do {
          const result = await list({ prefix, cursor });
          for (const blob of result.blobs) {
            if (new Date(blob.uploadedAt) < cutoffDate) {
              try {
                await del(blob.url);
                deletedCount++;
              } catch (e) {
                console.error(`Failed to delete old blob ${blob.pathname}:`, e);
              }
            }
          }
          cursor = result.hasMore ? result.cursor : undefined;
        } while (cursor);
      }
    } else if (mode === 'rejected') {
      // Find rejected/failed slip URLs from database
      const rejectedMessages = await db.select({ imageUrl: lineMessages.imageUrl })
        .from(lineMessages)
        .where(
          eq(lineMessages.isVerified, false)
        );
      
      const rejectedUrls = rejectedMessages
        .map(m => m.imageUrl)
        .filter((url): url is string => !!url && url.startsWith('http'));

      for (const url of rejectedUrls) {
        try {
          await del(url);
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete rejected blob ${url}:`, e);
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Blob delete error:', error);
    return NextResponse.json({ error: 'Failed to delete blobs' }, { status: 500 });
  }
}
