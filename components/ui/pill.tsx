import { cn } from "@/lib/utils";

type Tone = "amber" | "green" | "red" | "slate" | "purple" | "cyan" | "magenta";

const tones: Record<Tone, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  slate: "bg-slate-50 text-slate-600 border-slate-200",
  purple: "bg-purple-050 text-purple-700 border-purple/20",
  cyan: "bg-cyan-050 text-cyan-700 border-cyan/30",
  magenta: "bg-magenta-050 text-magenta-700 border-magenta/20",
};

export function Pill({
  tone = "slate",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
