// Lets browsers on this site's own addresses upload straight to Neon Object Storage.
// Run after creating the buckets, and again whenever the site gains a new address:
//
//   node --env-file=.env.local scripts/storage-cors.mjs https://whrdhub.org https://www.whrdhub.org
//
// Localhost is always included. Only buckets the browser uploads to are touched;
// mentor documents are handled by the server and stay closed to browsers.
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const origins = [...new Set(["http://localhost:3000", ...process.argv.slice(2)])];
const buckets = ["avatars", "media", "publications", "report-screenshots"];
const s3 = new S3Client({ forcePathStyle: true });

for (const Bucket of buckets) {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
  const check = await s3.send(new GetBucketCorsCommand({ Bucket }));
  console.log(Bucket.padEnd(20), "allows", check.CORSRules?.[0]?.AllowedOrigins?.join(", "));
}
