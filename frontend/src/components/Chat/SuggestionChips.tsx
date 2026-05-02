import type { AIMode } from '../../types';
import { MODES } from '../../types';

interface SuggestionChipsProps {
  mode: AIMode;
  onSelect: (text: string) => void;
}

export function SuggestionChips({ mode, onSelect }: SuggestionChipsProps) {
  const chips = MODES[mode].chips;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(chip.text)}
          className="text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 animate-fade-in-up"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            animationDelay: `${idx * 60}ms`,
            animationFillMode: 'both',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = 'var(--accent-primary)';
            el.style.background = 'var(--glass-bg-hover)';
            el.style.transform = 'scale(1.02)';
            el.style.boxShadow = '0 0 16px rgba(124,58,237,0.2)';
            el.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.borderColor = 'var(--border-default)';
            el.style.background = 'var(--glass-bg)';
            el.style.transform = 'scale(1)';
            el.style.boxShadow = 'none';
            el.style.color = 'var(--text-secondary)';
          }}
        >
          <span className="mr-2">{chip.emoji}</span>
          {chip.text}
        </button>
      ))}
    </div>
  );
}
