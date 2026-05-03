interface Props {
  text: string;
}

function estimateTokens(text: string): number {
  // ~4 chars per token (rough estimate)
  return Math.ceil(text.length / 4);
}

export function TokenCounter({ text }: Props) {
  const chars = text.length;
  const tokens = estimateTokens(text);
  if (chars === 0) return null;

  const pct = Math.min((tokens / 1024) * 100, 100);
  const color = pct > 80 ? "#EF4444" : pct > 60 ? "#F59E0B" : "#10B981";

  return (
    <div className="flex items-center gap-2 px-1">
      <div
        className="h-1 rounded-full overflow-hidden flex-1"
        style={{ background: "var(--border-default)", maxWidth: "60px" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        style={{
          color: "var(--text-muted)",
          fontSize: "11px",
          fontFamily: "monospace",
        }}
      >
        {chars}ch · ~{tokens}t
      </span>
    </div>
  );
}
