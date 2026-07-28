import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { StoryEditor } from "@/components/editor/story-editor";

export const metadata = { title: "Edit story — WHRD Hub" };

export default async function WriteStory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/dashboard/write/${id}`);

  const supabase = await createClient();
  const { data: blog } = await supabase
    .from("blogs")
    .select("id, author_id, title, excerpt, body, cover_image_url, status, review_notes")
    .eq("id", id)
    .maybeSingle();

  if (!blog || blog.author_id !== user.id) notFound();

  return (
    <StoryEditor
      id={blog.id as string}
      initial={{
        title: (blog.title as string) ?? "",
        excerpt: (blog.excerpt as string) ?? "",
        body: (blog.body as string) ?? "",
        cover: (blog.cover_image_url as string) ?? null,
        status: blog.status as string,
        reviewNotes: (blog.review_notes as string) ?? null,
      }}
    />
  );
}
