"use client";

import { useEffect, useState } from "react";

/**
 * Flat welcome greeting, styled like the Sauti Salama dashboard header: no card,
 * no border, no rounded background, just the greeting on the page. It starts a
 * touch larger, then after 30 seconds settles into a compact one-line header so
 * it quietly steps out of the way.
 */
export function WelcomeHeader({ name, message }: { name: string; message?: string }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCompact(true), 30_000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="transition-all duration-700 ease-out">
      <h1 className={"font-black tracking-tight text-ink transition-all duration-700 " + (compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl")}>
        Karibu, <span className="text-purple">{name}</span>
      </h1>
      <p className={"text-muted font-medium transition-all duration-700 " + (compact ? "text-sm" : "text-base mt-0.5")}>
        {message ?? "Here is what needs your attention across the movement today."}
      </p>
    </div>
  );
}
