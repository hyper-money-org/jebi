export default function WaveSeparator() {
  return (
    <svg
      style={{
        flex: 1,
        height: "12px",
        overflow: "hidden",
        minWidth: 0,
        opacity: 0.4,
      }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="6" x2="3000" y2="6" stroke="var(--prompt-cwd-tint)" strokeWidth="1" />
    </svg>
  );
}
