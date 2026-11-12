import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  auth: true,
  // PostgREST-compatible API so the existing query code keeps working; it trusts Neon Auth tokens.
  dataApi: true,
  // Same five buckets the app used on Supabase Storage, with the same access.
  buckets: {
    avatars: { access: "public_read" },
    media: { access: "public_read" },
    publications: { access: "public_read" },
    "report-screenshots": {},
    "mentor-documents": {},
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
