export const ThinkingIndicator = () => {
  return (
    <div
      className="flex items-center gap-1.5 px-5 py-4 rounded-2xl rounded-tl-sm"
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderLeft: "3px solid #7C3AED",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "#7C3AED",
            animation: `thinking-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes thinking-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
