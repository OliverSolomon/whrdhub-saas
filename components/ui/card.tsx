import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface rounded-2xl border border-line shadow-[0_1px_2px_rgba(28,21,34,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
