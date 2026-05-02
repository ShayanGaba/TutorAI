import { Avatar } from '../UI/Avatar';

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-fade-slide-right">
      <Avatar type="ai" />
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
        style={{
          background: 'var(--ai-bubble)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-default)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: '4px 18px 18px 18px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-bounce-dot rounded-full"
            style={{
              width: '7px',
              height: '7px',
              background: 'var(--accent-primary)',
              display: 'inline-block',
              animationDelay: `${i * 0.2}s`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
    </div>
  );
}
