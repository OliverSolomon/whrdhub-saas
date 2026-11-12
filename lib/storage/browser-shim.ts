/**
 * `.storage` for the browser, in the shape the app already used with Supabase
 * Storage. The browser holds no storage credentials: it asks this site's
 * /api/storage for permission, and for uploads receives a short-lived signed
 * URL to send the file straight to storage (so large files never pass through
 * the site's own servers).
 */

type Failure = { message: string };
const fail = (message: string) => ({ data: null, error: { message } as Failure });

async function ask<T>(body: Record<string, unknown>): Promise<{ data: T | null; error: Failure | null }> {
  try {
    const r = await fetch("/api/storage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const json = (await r.json().catch(() => ({}))) as { error?: string } & T;
    if (!r.ok) return { data: null, error: { message: json.error ?? "The file service refused that request." } };
    return { data: json, error: null };
  } catch {
    return { data: null, error: { message: "Could not reach the file service. Check your connection and try again." } };
  }
}

const encode = (key: string) => key.split("/").map(encodeURIComponent).join("/");

export function browserStorage() {
  return {
    from(bucket: string) {
      return {
        async upload(path: string, body: Blob | File, options?: { contentType?: string; upsert?: boolean }) {
          const contentType = options?.contentType || body.type || "application/octet-stream";
          const signed = await ask<{ url: string; key: string; headers: Record<string, string> }>({
            action: "upload-url",
            bucket,
            path,
            contentType,
            size: body.size,
          });
          if (signed.error || !signed.data) return fail(signed.error?.message ?? "Upload was refused.");
          try {
            const put = await fetch(signed.data.url, {
              method: "PUT",
              // Exactly what the URL was signed for; storage refuses the upload otherwise.
              headers: signed.data.headers,
              body,
            });
            if (!put.ok) return fail(`Upload failed (${put.status}).`);
          } catch {
            return fail("Upload failed. Check your connection and try again.");
          }
          // Lets the server keep its own copy elsewhere. Never blocks or fails the upload.
          void ask({ action: "uploaded", bucket, path: signed.data.key });
          return { data: { path: signed.data.key }, error: null };
        },

        /** Only meaningful for the public buckets; private files need createSignedUrls. */
        getPublicUrl(path: string) {
          return { data: { publicUrl: `/files/${bucket}/${encode(path.replace(/^\/+/, ""))}` } };
        },

        async remove(paths: string[]) {
          const res = await ask<{ ok: true }>({ action: "remove", bucket, paths });
          return res.error ? fail(res.error.message) : { data: [], error: null };
        },

        async list(prefix = "") {
          const res = await ask<{ files: { name: string }[] }>({ action: "list", bucket, prefix });
          return res.error ? fail(res.error.message) : { data: res.data?.files ?? [], error: null };
        },

        async createSignedUrls(paths: string[], expiresIn: number) {
          const res = await ask<{ urls: { path: string; signedUrl: string; error: string | null }[] }>({
            action: "signed-urls",
            bucket,
            paths,
            expiresIn,
          });
          return res.error ? fail(res.error.message) : { data: res.data?.urls ?? [], error: null };
        },
      };
    },
  };
}
