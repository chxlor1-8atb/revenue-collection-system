import { list, del, put } from '@vercel/blob';
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
  const cursor = searchParams.get('cursor') || undefined;

  try {
    const result = await list({ prefix, cursor, limit: 100 });
    const blobs = result.blobs.map(blob => ({
      pathname: blob.pathname,
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }));
    return NextResponse.json({ blobs, hasMore: result.hasMore, cursor: result.cursor });
  } catch (error) {
    console.error('Blob list error:', error);
    return NextResponse.json({ error: 'Failed to list blobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'line-slips';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${folder}/${Date.now()}-${cleanName}`;
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
    });

    return NextResponse.json({ success: true, blob });
  } catch (error: any) {
    console.error('Blob upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { mode, urls, days, prefix, cursor, offset = 0 } = body;
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
      // Delete files older than N days (Batched per prefix & cursor)
      const threshold = days || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - threshold);

      const result = await list({ prefix, cursor, limit: 300 }); // Process 300 files per batch
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
      return NextResponse.json({ success: true, deletedCount, hasMore: result.hasMore, cursor: result.cursor });

    } else if (mode === 'rejected') {
      // Find rejected/failed slip URLs from database (Batched)
      const rejectedMessages = await db.select({ imageUrl: lineMessages.imageUrl })
        .from(lineMessages)
        .where(
          eq(lineMessages.isVerified, false)
        )
        .limit(100)
        .offset(offset);
      
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
      
      const hasMore = rejectedMessages.length === 100;
      return NextResponse.json({ success: true, deletedCount, hasMore, nextOffset: offset + 100 });

    } else if (mode === 'orphaned') {
      // Find all blobs that are not recorded in transactions or lineMessages
      const allTxSlips = await db.select({ url: transactions.slipImageUrl }).from(transactions);
      const allLineSlips = await db.select({ url: lineMessages.imageUrl }).from(lineMessages);
      const validUrlSet = new Set([
        ...allTxSlips.map(t => t.url).filter(Boolean),
        ...allLineSlips.map(l => l.url).filter(Boolean)
      ]);

      const result = await list({ limit: 300 });
      for (const blob of result.blobs) {
        if (!validUrlSet.has(blob.url)) {
          try {
            await del(blob.url);
            deletedCount++;
          } catch (e) {
            console.error(`Failed to delete orphaned blob ${blob.url}:`, e);
          }
        }
      }
      return NextResponse.json({ success: true, deletedCount });

    } else {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Blob delete error:', error);
    return NextResponse.json({ error: 'Failed to delete blobs' }, { status: 500 });
  }
}
