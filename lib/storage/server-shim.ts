import {
  isBucket,
  listObjects,
  publicPath,
  putObject,
  removeObjects,
  safeKey,
  signDownload,
} from "./neon";
import { backupUploadedFile } from "./google-backup";

/**
 * `.storage` for server code, in the shape the app already used with Supabase
 * Storage. It talks to Neon Object Storage directly with the server's own
 * credentials, so it enforces nothing by itself: the caller is trusted server
 * code and is responsible for checking who is asking.
 */

type Failure = { message: string };
const fail = (message: string) => ({ data: null, error: { message } as Failure });

async function bytesOf(body: Blob | ArrayBuffer | Uint8Array | Buffer | string): Promise<Uint8Array> {
  if (typeof body === "string") return new TextEncoder().encode(body);
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return new Uint8Array(await (body as Blob).arrayBuffer());
}

export function serverStorage() {
  return {
    from(bucket: string) {
      return {
        async upload(
          path: string,
          body: Blob | ArrayBuffer | Uint8Array | Buffer | string,
          options?: { contentType?: string; upsert?: boolean },
        ) {
          const key = safeKey(path);
          if (!isBucket(bucket) || !key) return fail("Invalid file location.");
          try {
            const type = options?.contentType || (body instanceof Blob ? body.type : "") || "application/octet-stream";
            await putObject(bucket, key, await bytesOf(body), type);
            // A second copy elsewhere; never allowed to fail the upload itself.
            await backupUploadedFile(bucket, key).catch((e) => console.error("[backup]", (e as Error).message));
            return { data: { path: key }, error: null };
          } catch (e) {
            return fail((e as Error).message);
          }
        },

        getPublicUrl(path: string) {
          const key = safeKey(path) ?? path;
          return { data: { publicUrl: isBucket(bucket) ? publicPath(bucket, key) : "" } };
        },

        async remove(paths: string[]) {
          if (!isBucket(bucket)) return fail("Invalid file location.");
          try {
            await removeObjects(bucket, paths.map(safeKey).filter((k): k is string => !!k));
            return { data: [], error: null };
          } catch (e) {
            return fail((e as Error).message);
          }
        },

        async list(prefix = "") {
          if (!isBucket(bucket)) return fail("Invalid file location.");
          try {
            return { data: await listObjects(bucket, prefix), error: null };
          } catch (e) {
            return fail((e as Error).message);
          }
        },

        /** Time-limited links to private files, one per path, in the same order. */
        async createSignedUrls(paths: string[], expiresIn: number) {
          if (!isBucket(bucket)) return fail("Invalid file location.");
          try {
            const data = await Promise.all(
              paths.map(async (path) => {
                const key = safeKey(path);
                if (!key) return { path, signedUrl: "", error: "Invalid file location." };
                return { path, signedUrl: await signDownload(bucket, key, expiresIn), error: null };
              }),
            );
            return { data, error: null };
          } catch (e) {
            return fail((e as Error).message);
          }
        },
      };
    },
  };
}
