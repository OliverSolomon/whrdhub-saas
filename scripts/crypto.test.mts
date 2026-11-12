// Run: npm run test:crypto
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
process.env.DATA_ENCRYPTION_KEYS = `k1:${randomBytes(32).toString("base64")},k0:${randomBytes(32).toString("base64")}`;
process.env.BLIND_INDEX_KEY = randomBytes(32).toString("base64");
const { encryptString, decryptString, sealValue, openValue, isEncrypted, blindIndex } = await import("../lib/crypto.ts");
const { sealReport, openReport } = await import("../lib/report-crypto.ts");

const t = encryptString("hello", "a");
assert.ok(isEncrypted(t) && !t.includes("hello"));
assert.equal(decryptString(t, "a"), "hello");
assert.throws(() => decryptString(t, "b"), "wrong AAD must fail");
assert.notEqual(encryptString("hello", "a"), t, "fresh IV every time");
const bad = t.slice(0, -2) + (t.endsWith("AA") ? "BB" : "AA");
assert.throws(() => decryptString(bad, "a"), "tampering must fail");
assert.equal(sealValue("", "a"), null);
assert.deepEqual(openValue(sealValue([1, "x"], "a"), "a"), [1, "x"]);
assert.equal(openValue("plain legacy", "a"), "plain legacy");
assert.equal(blindIndex("+254 700 000 000"), blindIndex("+254700000000"));
assert.notEqual(blindIndex("+254700000001"), blindIndex("+254700000000"));

const id = "11111111-2222-3333-4444-555555555555";
const sealed = sealReport(id, {
  incident_types: ["x"], county: "Kitui", description: "She threatened me", contact_value: "+254700000000",
  latitude: -1.2, longitude: 36.8, tfgbv_screenshot_urls: ["a/b.png"], location_description: "Behind the market",
});
assert.equal(sealed.county, "Kitui", "classification stays readable");
for (const k of ["description", "contact_value", "location_description"]) assert.ok(isEncrypted(sealed[k]), k);
assert.equal(sealed.latitude, null); assert.equal(sealed.longitude, null);
assert.ok(isEncrypted(sealed.geo_enc));
assert.equal(typeof sealed.contact_hash, "string");
assert.ok(!JSON.stringify(sealed).includes("threatened") && !JSON.stringify(sealed).includes("0700000000") && !JSON.stringify(sealed).includes("-1.2"));
const opened = openReport({ id, ...sealed });
assert.equal(opened.description, "She threatened me");
assert.equal(opened.latitude, -1.2); assert.equal(opened.longitude, 36.8);
assert.deepEqual(opened.tfgbv_screenshot_urls, ["a/b.png"]);
// A value moved to another row must not decrypt.
const moved = openReport({ id: "99999999-2222-3333-4444-555555555555", ...sealed });
assert.equal(moved.description, "[could not be decrypted]");
// A plain legacy row is untouched.
assert.equal(openReport({ id, description: "old plain" }).description, "old plain");
console.log("crypto: all checks passed");
