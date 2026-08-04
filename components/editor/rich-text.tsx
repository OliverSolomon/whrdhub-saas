"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, Quote, List, ListOrdered,
  Link2, Link2Off, ImagePlus, Undo2, Redo2, Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * TipTap-powered rich text editor (ProseMirror). Emits HTML. Sticky toolbar,
 * headings, lists, quotes, links, and drag/upload images to Supabase Storage.
 * Best-practice setup for the Next.js App Router: immediatelyRender is false so
 * server and client markup match.
 */
export function RichText({
  value,
  onChange,
  placeholder = "Write your story. Use the toolbar for headings, quotes, lists, links, and images.",
  minHeight = 320,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const [, force] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl border border-line" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "prose-editor focus:outline-none", style: `min-height:${minHeight}px` },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Reflect toolbar active states on every selection/content change.
  useEffect(() => {
    if (!editor) return;
    const bump = () => force((n) => n + 1);
    editor.on("transaction", bump);
    editor.on("selectionUpdate", bump);
    return () => {
      editor.off("transaction", bump);
      editor.off("selectionUpdate", bump);
    };
  }, [editor]);

  // Sync in controlled value changes (e.g. loading a different story).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return <div className="rounded-xl border border-line bg-surface" style={{ minHeight: minHeight + 48 }} />;
  }

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); window.alert("Please sign in to upload images."); return; }
    const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${user.id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
    if (!error) {
      const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
      editor.chain().focus().setImage({ src: pub.publicUrl, alt: file.name }).run();
    } else {
      window.alert(error.message);
    }
    setUploading(false);
  };

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <Toolbar editor={editor} onLink={setLink} onImage={() => fileRef.current?.click()} uploading={uploading} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
      <EditorContent editor={editor} className="px-4 py-3 text-[15px] leading-relaxed text-ink" />
    </div>
  );
}

function Btn({ on, disabled, onClick, title, children }: { on?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} aria-label={title} aria-pressed={on} disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "w-9 h-9 grid place-items-center rounded-lg transition-colors disabled:opacity-40",
        on ? "bg-purple text-white" : "text-ink/70 hover:bg-purple-050 hover:text-purple-700",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onLink, onImage, uploading }: { editor: Editor; onLink: () => void; onImage: () => void; uploading: boolean }) {
  const Divider = () => <span className="w-px h-6 bg-line mx-0.5" />;
  return (
    <div className="sticky top-0 z-10 flex items-center gap-0.5 border-b border-line px-2 py-1.5 flex-wrap bg-paper/95 backdrop-blur">
      <Btn title="Bold" on={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
      <Btn title="Italic" on={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
      <Btn title="Strikethrough" on={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Btn>
      <Divider />
      <Btn title="Heading" on={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
      <Btn title="Subheading" on={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
      <Btn title="Quote" on={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
      <Divider />
      <Btn title="Bullet list" on={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
      <Btn title="Numbered list" on={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
      <Divider />
      <Btn title="Add link" on={editor.isActive("link")} onClick={onLink}><Link2 className="w-4 h-4" /></Btn>
      <Btn title="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Link2Off className="w-4 h-4" /></Btn>
      <Btn title="Insert image" onClick={onImage}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}</Btn>
      <Divider />
      <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></Btn>
      <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></Btn>
    </div>
  );
}

/** Words + estimated read time for a plain-text or HTML string. */
export function readingStats(html: string): { words: number; minutes: number } {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}
