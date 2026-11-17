// Puts the Hub's public files back at the exact addresses they had before, and
// checks that every recorded address still works. The addresses are in print,
// so a file must go back to the same bucket and key. See data/file-links.md.
//
//   node --env-file=.env.local scripts/file-links.mjs check
//       Which recorded files are in storage, and which are still missing.
//
//   node --env-file=.env.local scripts/file-links.mjs check --live
//       Opens every recorded address on the live site instead.
//
//   node --env-file=.env.local scripts/file-links.mjs restore <folder>
//       Shows which file in <folder> would go to which address. Uploads nothing.
//
//   node --env-file=.env.local scripts/file-links.mjs restore <folder> --apply
//       Uploads them. Files already in storage are left alone unless --replace is given.
//
// Options for restore:
//   --map <file.json>   {"Name on disk.pdf": "publications/documents/<key>"} for files the names cannot match
//   --all               also files no publication uses any more (old versions and duplicates)
//   --replace           overwrite a file that is already in storage
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../data/file-links.json", import.meta.url)), "utf8"),
);

const args = process.argv.slice(2);
const command = args[0];
const has = (flag) => args.includes(flag);
const valueOf = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);

const TYPES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
// Same as cacheControlFor() in lib/storage/neon.ts for a public bucket.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const idOf = (f) => `${f.bucket}/${f.key}`;
const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;
const inUse = (f) => f.usedBy.length > 0;
const label = (f) => (inUse(f) ? f.usedBy.map((u) => `${u.as} of "${u.title}"`).join("; ") : "not used by any publication");

/** A name with the upload time, the extension, punctuation and case taken off, so "Kwale Policy Brief.pdf" finds "1793602252624-Kwale_Policy_Brief.pdf". */
const plain = (name) =>
  basename(name, extname(name))
    .replace(/^\d{10,}-/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

let client;
const s3 = () => (client ??= new S3Client({ forcePathStyle: true }));

async function stored(file) {
  try {
    const head = await s3().send(new HeadObjectCommand({ Bucket: file.bucket, Key: file.key }));
    return { bytes: head.ContentLength ?? 0 };
  } catch (e) {
    if (e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

async function check() {
  const live = has("--live");
  let missingInUse = 0;
  let missingOther = 0;
  for (const file of manifest.files) {
    let ok;
    if (live) {
      const res = await fetch(file.url, { method: "HEAD", redirect: "manual" });
      ok = res.status === 200 || res.status === 307;
    } else {
      ok = !!(await stored(file));
    }
    if (!ok && inUse(file)) missingInUse++;
    if (!ok && !inUse(file)) missingOther++;
    if (!ok || has("--verbose")) console.log(ok ? "ok      " : "MISSING ", live ? file.url : idOf(file), "|", label(file));
  }
  const total = manifest.files.length;
  console.log(
    `\n${total - missingInUse - missingOther} of ${total} recorded addresses work` +
      ` (${live ? "on the live site" : "in storage"}).` +
      ` Missing: ${missingInUse} used by a publication, ${missingOther} not used.`,
  );
  process.exitCode = missingInUse ? 1 : 0;
}

async function restore() {
  const folder = args[1];
  if (!folder || folder.startsWith("--")) throw new Error("Give the folder that holds the files: restore <folder>");
  const apply = has("--apply");
  const wanted = manifest.files.filter((f) => has("--all") || inUse(f));

  const local = walk(folder).filter((p) => statSync(p).isFile());
  const byName = new Map();
  const byPlain = new Map();
  for (const p of local) {
    byName.set(basename(p), p);
    const key = plain(p) + extname(p).toLowerCase();
    if (!byPlain.has(key)) byPlain.set(key, []);
    byPlain.get(key).push(p);
  }

  const mapFile = valueOf("--map");
  const mapped = new Map();
  if (mapFile) {
    for (const [name, target] of Object.entries(JSON.parse(readFileSync(mapFile, "utf8")))) {
      const path = local.find((p) => basename(p) === name || relative(folder, p).replaceAll("\\", "/") === name);
      if (!path) throw new Error(`--map names "${name}", which is not in ${folder}`);
      if (!manifest.files.some((f) => idOf(f) === target)) throw new Error(`--map points at "${target}", which is not a recorded address`);
      mapped.set(target, path);
    }
  }

  const used = new Set();
  let done = 0;
  let skipped = 0;
  const unmatched = [];

  for (const file of wanted) {
    const ext = extname(file.key).toLowerCase();
    const candidates = byPlain.get(plain(file.key) + ext) ?? [];
    let source = mapped.get(idOf(file)) ?? byName.get(basename(file.key));
    if (!source && candidates.length === 1) source = candidates[0];
    if (!source && candidates.length > 1) {
      console.log("UNCLEAR ", idOf(file), "| several files match:", candidates.map((c) => basename(c)).join(", "), "| name one with --map");
      unmatched.push(file);
      continue;
    }
    if (!source) {
      unmatched.push(file);
      continue;
    }
    used.add(source);

    const existing = await stored(file);
    if (existing && !has("--replace")) {
      console.log("PRESENT ", idOf(file), "| already in storage, left alone");
      skipped++;
      continue;
    }

    const bytes = statSync(source).size;
    const type = TYPES[extname(source).toLowerCase()];
    if (!type || extname(source).toLowerCase() !== ext) {
      console.log("WRONG TYPE", idOf(file), "| needs a", ext, "file, but", basename(source), "is not one");
      unmatched.push(file);
      continue;
    }
    const note = `${basename(source)} (${mb(bytes)}, was ${mb(file.bytes)}) -> ${file.url}`;
    if (!apply) {
      console.log("WOULD PUT", note);
      done++;
      continue;
    }
    await s3().send(
      new PutObjectCommand({
        Bucket: file.bucket,
        Key: file.key,
        Body: readFileSync(source),
        ContentType: type,
        CacheControl: CACHE_CONTROL,
      }),
    );
    const after = await stored(file);
    if (!after || after.bytes !== bytes) throw new Error(`Upload of ${idOf(file)} could not be confirmed`);
    console.log("PUT     ", note);
    done++;
  }

  if (unmatched.length) {
    console.log("\nNo file found for these addresses:");
    for (const file of unmatched) console.log("  ", idOf(file), "|", label(file));
  }
  const spare = local.filter((p) => !used.has(p));
  if (spare.length) {
    console.log("\nFiles in the folder that match no recorded address (not uploaded):");
    for (const p of spare) console.log("  ", relative(folder, p));
  }
  console.log(
    `\n${apply ? "Uploaded" : "Would upload"} ${done}, already present ${skipped}, no file for ${unmatched.length}` +
      ` of ${wanted.length} addresses.${apply ? "" : " Nothing was uploaded; add --apply to do it."}`,
  );
  process.exitCode = unmatched.length ? 1 : 0;
}

try {
  if (command === "check") await check();
  else if (command === "restore") await restore();
  else {
    console.log("Usage: file-links.mjs check [--live] [--verbose] | restore <folder> [--apply] [--map file.json] [--all] [--replace]");
    process.exitCode = 2;
  }
} catch (e) {
  console.error("Stopped:", e.message);
  process.exitCode = 2;
}
