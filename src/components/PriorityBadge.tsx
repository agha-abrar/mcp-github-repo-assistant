import { IssuePriority } from "@/types/analysis";

const STYLES: Record<IssuePriority, string> = {
  high: "bg-accent-danger/10 text-accent-danger border-accent-danger/30",
  medium: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
  low: "bg-accent-info/10 text-accent-info border-accent-info/30",
};

const LABEL: Record<IssuePriority, string> = {
  high: "HIGH",
  medium: "MED",
  low: "LOW",
};

export default function PriorityBadge({ priority }: { priority: IssuePriority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${STYLES[priority]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABEL[priority]}
    </span>
  );
}
