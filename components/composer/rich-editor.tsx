"use client";

import { useRef, useEffect } from "react";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link2, Quote } from "lucide-react";

/**
 * Lightweight WYSIWYG editor. Stores HTML. Good enough for blog authoring
 * without pulling in a heavy editor dependency; swap for TipTap later if needed.
 */
export function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const btn = (onClick: () => void, Icon: typeof Bold, label: string) => (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); onClick(); }} title={label} aria-label={label}
      className="w-9 h-9 grid place-items-center rounded-lg text-ink/70 hover:bg-purple-050 hover:text-purple-700">
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="flex items-center gap-0.5 border-b border-line px-2 py-1.5 flex-wrap bg-paper">
        {btn(() => exec("bold"), Bold, "Bold")}
        {btn(() => exec("italic"), Italic, "Italic")}
        {btn(() => exec("formatBlock", "<h2>"), Heading2, "Heading")}
        {btn(() => exec("formatBlock", "<h3>"), Heading3, "Subheading")}
        {btn(() => exec("formatBlock", "<blockquote>"), Quote, "Quote")}
        {btn(() => exec("insertUnorderedList"), List, "Bullet list")}
        {btn(() => exec("insertOrderedList"), ListOrdered, "Numbered list")}
        {btn(() => { const url = prompt("Link URL"); if (url) exec("createLink", url); }, Link2, "Link")}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder || "Write your story…"}
        className="prose-editor min-h-[280px] px-4 py-3 text-[15px] leading-relaxed text-ink focus:outline-none"
      />
    </div>
  );
}
