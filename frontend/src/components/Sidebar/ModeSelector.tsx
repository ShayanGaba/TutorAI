import type { AIMode, ModeConfig } from "../../types";
import { MODES } from "../../types";

interface ModeSelectorProps {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const modes = Object.values(MODES) as ModeConfig[];

  return (
    <div className="px-3">
      <p
        className="px-2 mb-2 text-xs font-semibold tracking-widest uppercase"
        style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}
      >
        AI Mode
      </p>
      <div className="flex flex-col gap-1">
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          const { Icon } = mode;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className="w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200"
              style={{
                background: isActive ? "rgba(124,58,237,0.15)" : "transparent",
                borderLeft: isActive
                  ? "3px solid var(--accent-primary)"
                  : "3px solid transparent",
              }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: isActive
                      ? "rgba(124,58,237,0.25)"
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  <Icon
                    size={13}
                    style={{
                      color: isActive ? "#A78BFA" : "var(--text-muted)",
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-sm font-semibold leading-tight"
                    style={{
                      color: isActive
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {mode.name}
                  </div>
                  <div
                    className="text-xs mt-0.5 leading-tight truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {mode.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
