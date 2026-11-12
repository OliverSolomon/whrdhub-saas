import { createSign } from "node:crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BUCKETS, type BucketName } from "./neon";

/**
 * Keeps a second copy of every uploaded file in a Google Drive folder, so the
 * organisation is never again dependent on one storage provider for its files.
 *
 * Off until configured. Set, on the server only:
 *
 *   GOOGLE_BACKUP_CLIENT_EMAIL   the service account's address
 *   GOOGLE_BACKUP_PRIVATE_KEY    its private key (PEM; "\n" escapes are accepted)
 *   GOOGLE_BACKUP_FOLDER_ID      the Drive folder to copy into
 *
 * The folder must be in a Shared Drive with the service account added as a
 * Content manager: a service account has no storage of its own, so it cannot
 * own files in somebody's personal "My Drive".
 *
 * Public files only, unless GOOGLE_BACKUP_INCLUDE_PRIVATE=true. Report evidence
 * and mentor documents are private for a reason; copying them to a second
 * system is a decision to take deliberately, not a default.
 *
 * A failed copy never fails the upload. It is logged and the file stays where
 * it was put.
 */

const configured = () =>
  !!process.env.GOOGLE_BACKUP_CLIENT_EMAIL && !!process.env.GOOGLE_BACKUP_PRIVATE_KEY && !!process.env.GOOGLE_BACKUP_FOLDER_ID;

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

let held: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (held && held.exp - 60 > now) return held.token;
  const claims = {
    iss: process.env.GOOGLE_BACKUP_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify(claims))}`;
  const key = process.env.GOOGLE_BACKUP_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
  });
  if (!r.ok) throw new Error(`Google sign-in failed (${r.status})`);
  const body = (await r.json()) as { access_token: string; expires_in: number };
  held = { token: body.access_token, exp: now + body.expires_in };
  return body.access_token;
}

let s3: S3Client | null = null;

/** Copy one stored file to the Drive folder. Does nothing when backup is not configured. */
export async function backupUploadedFile(bucket: BucketName, key: string): Promise<void> {
  if (!configured()) return;
  if (!BUCKETS[bucket].public && process.env.GOOGLE_BACKUP_INCLUDE_PRIVATE !== "true") return;

  s3 ??= new S3Client({ forcePathStyle: true });
  const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body) throw new Error("stored file is empty");
  const bytes = await object.Body.transformToByteArray();
  const contentType = object.ContentType ?? "application/octet-stream";

  const token = await accessToken();
  // The full storage path is the file name, so the copy can be matched to the original at a glance.
  const start = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-type": contentType,
      "x-upload-content-length": String(bytes.byteLength),
    },
    body: JSON.stringify({ name: `${bucket}/${key}`, parents: [process.env.GOOGLE_BACKUP_FOLDER_ID] }),
  });
  const session = start.headers.get("location");
  if (!start.ok || !session) throw new Error(`Drive refused the copy (${start.status})`);

  const put = await fetch(session, {
    method: "PUT",
    headers: { "content-type": contentType, "content-length": String(bytes.byteLength) },
    body: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: contentType }),
  });
  if (!put.ok) throw new Error(`Drive copy failed (${put.status})`);
}
