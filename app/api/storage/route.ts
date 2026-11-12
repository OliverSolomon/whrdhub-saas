import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  BUCKETS,
  isBucket,
  listObjects,
  removeObjects,
  safeKey,
  signDownload,
  signUpload,
  type BucketName,
} from "@/lib/storage/neon";
import { backupUploadedFile } from "@/lib/storage/google-backup";

/**
 * The gatekeeper for files uploaded from the browser.
 *
 * Storage itself only knows "has a valid signature or not", so who may put
 * what where is decided here, before anything is signed. These are the same
 * rules the old storage policies enforced:
 *
 *   avatars, media       your own folder only (the first path segment is your user id)
 *   publications         Hub administrators only
 *   report-screenshots   write to your own folder; read your own, or any if you triage reports
 *   mentor-documents     never from the browser (the server handles these)
 *
 * Public buckets are read through /files, not through here.
 */

const deny = (message: string, status = 403) => NextResponse.json({ error: message }, { status });

type Db = Awaited<ReturnType<typeof createClient>>;

async function isHubAdmin(db: Db, userId: string): Promise<boolean> {
  const { data } = await db.from("profiles").select("is_hub_admin").eq("id", userId).maybeSingle();
  return !!data?.is_hub_admin;
}

async function canTriage(db: Db): Promise<boolean> {
  const { data } = await db.rpc("can_triage_reports");
  return data === true;
}

const ownFolder = (key: string, userId: string) => key.split("/")[0] === userId;

async function mayWrite(db: Db, userId: string, bucket: BucketName, key: string): Promise<boolean> {
  switch (bucket) {
    case "avatars":
    case "media":
    case "report-screenshots":
      return ownFolder(key, userId);
    case "publications":
      return isHubAdmin(db, userId);
    default:
      return false;
  }
}

async function mayDelete(db: Db, userId: string, bucket: BucketName, key: string): Promise<boolean> {
  switch (bucket) {
    case "avatars":
    case "media":
      return ownFolder(key, userId);
    case "publications":
      return isHubAdmin(db, userId);
    default:
      return false; // evidence is never deleted from the browser
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return deny("Bad request.", 400);
  }

  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return deny("Please sign in first.", 401);

  const bucket = String(body.bucket ?? "");
  if (!isBucket(bucket)) return deny("Unknown file location.", 400);

  switch (body.action) {
    case "upload-url": {
      const key = safeKey(String(body.path ?? ""));
      const size = Number(body.size);
      const contentType = String(body.contentType ?? "application/octet-stream").slice(0, 120);
      if (!key) return deny("Invalid file name.", 400);
      if (!Number.isFinite(size) || size <= 0) return deny("Empty file.", 400);
      const limit = BUCKETS[bucket].maxMb * 1024 * 1024;
      if (size > limit) return deny(`That file is too large. The limit here is ${BUCKETS[bucket].maxMb} MB.`, 413);
      if (!(await mayWrite(db, user.id, bucket, key))) return deny("You cannot upload there.");
      return NextResponse.json({ ...(await signUpload(bucket, key, contentType, size)), key });
    }

    case "uploaded": {
      // Called by the browser once its upload has finished, so a copy can be kept elsewhere.
      const key = safeKey(String(body.path ?? ""));
      if (!key || !(await mayWrite(db, user.id, bucket, key))) return deny("Not allowed.");
      await backupUploadedFile(bucket, key).catch((e) => console.error("[backup]", (e as Error).message));
      return NextResponse.json({ ok: true });
    }

    case "remove": {
      const keys = (Array.isArray(body.paths) ? body.paths : []).map((p) => safeKey(String(p)));
      if (!keys.length || keys.some((k) => !k)) return deny("Invalid file name.", 400);
      for (const key of keys as string[]) {
        if (!(await mayDelete(db, user.id, bucket, key))) return deny("You cannot delete that.");
      }
      await removeObjects(bucket, keys as string[]);
      return NextResponse.json({ ok: true });
    }

    case "list": {
      // Only your own folder, and only where you may write.
      const prefix = String(body.prefix ?? "").replace(/^\/+|\/+$/g, "");
      if (!prefix || !ownFolder(prefix, user.id) || !["avatars", "media"].includes(bucket)) {
        return deny("You cannot list that.");
      }
      return NextResponse.json({ files: await listObjects(bucket, prefix) });
    }

    case "signed-urls": {
      if (bucket !== "report-screenshots") return deny("Not available for this location.");
      const keys = (Array.isArray(body.paths) ? body.paths : []).slice(0, 50).map((p) => safeKey(String(p)));
      if (keys.some((k) => !k)) return deny("Invalid file name.", 400);
      const all = (keys as string[]).every((k) => ownFolder(k, user.id)) || (await canTriage(db));
      if (!all) return deny("You cannot open those files.");
      const expiresIn = Number(body.expiresIn) || 600;
      const urls = await Promise.all(
        (keys as string[]).map(async (path) => ({ path, signedUrl: await signDownload(bucket, path, expiresIn), error: null })),
      );
      return NextResponse.json({ urls });
    }

    default:
      return deny("Unknown request.", 400);
  }
}
