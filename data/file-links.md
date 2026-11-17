# File addresses that must never change

Printed material (banners, leaflets, QR codes) carries the addresses of the Hub's
publications. Those addresses have to keep working whichever storage service holds
the files.

## The address

Every public file is reached at:

```
https://www.whrdhub.org/files/<bucket>/<key>
```

For example:

```
https://www.whrdhub.org/files/publications/documents/1793602252624-Kwale_Policy_Brief.pdf
```

The site serves `/files` itself (`app/files/[...path]/route.ts`) and fetches the file
from storage behind the scenes. The storage service never appears in the address, so
changing it later means changing `lib/storage/neon.ts` only. The address stays the same
as long as the file sits under the same bucket and key.

## The record

`data/file-links.json` lists all 49 public files the Hub had in storage on
17 November 2026: bucket, key, size, type, the address on the site, the old Supabase
address, and which publication uses it. 33 are in use (16 documents, 17 covers); 16 are
older versions and duplicates. Do not edit it by hand.

The publication rows in the database still hold the old Supabase form of each address.
That is deliberate. `lib/file-url.ts` turns it into the `/files/...` address when a page
is drawn, and it recognises the old host by name, so removing the Supabase settings
from the site does not break any link.

## Putting the files back

Put the files you have been sent in one folder (sub-folders are fine), then:

```
node --env-file=.env.local scripts/file-links.mjs restore <folder>
```

This uploads nothing. It shows which file would go to which address, which addresses
still have no file, and which files in the folder match nothing. Files are matched by
name, ignoring the upload time at the front, spaces, punctuation and capitals, so
`Kwale Policy Brief.pdf` goes to `documents/1793602252624-Kwale_Policy_Brief.pdf`.
A smaller, compressed copy of a document is fine as long as it is the same kind of file.

For a file whose name does not match, write a small JSON file and pass it with `--map`:

```json
{ "Strategic plan (final).pdf": "publications/documents/1787906725825-WHRD_Hub_Strategic_Plan_Final__11_.pdf" }
```

When the list looks right, add `--apply` to upload. Then confirm:

```
node --env-file=.env.local scripts/file-links.mjs check          # what is in storage
node --env-file=.env.local scripts/file-links.mjs check --live   # every address on the live site
```

Do not put these files back through the Hub's publication form: it gives each upload a
new name, and so a new address.

## Safeguards in the site

- The Hub never deletes a file whose address is in the record, even when its
  publication is edited or removed (`removeFromBucket` in `lib/storage.ts`).
- If a publication's document is replaced through the Hub, the old address redirects
  to the new file (`movedTo` in `lib/file-links.ts`).
- An address with no file behind it shows a page for visitors, not a storage error.

## What this cannot cover

An address on the old host, `https://gmfyxbvkcdlqvgotolim.supabase.co/storage/...`, is
served by Supabase, not by this site. If anything was printed with that form, it works
only while the Supabase project exists, holds the file under the same name, and is
within its usage limits. Keep that project until this has been checked against the
printed material.
