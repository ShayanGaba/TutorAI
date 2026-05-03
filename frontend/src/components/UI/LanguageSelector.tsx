import { Globe } from "lucide-react";
import { LANGUAGES, type Language } from "../../types";

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguageSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <Globe size={14} style={{ color: "var(--text-muted)" }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Language)}
        className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {LANGUAGES.map((lang) => (
          <option
            key={lang}
            value={lang}
            style={{ background: "var(--bg-elevated)" }}
          >
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
