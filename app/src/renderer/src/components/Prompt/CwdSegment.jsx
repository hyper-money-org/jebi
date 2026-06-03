import { useState } from "react";
import folderIcon from "../../assets/file-icons/folder.png";
import {
  neonGlassStyle,
  neonGlassHoverStyle,
  stopSegmentEvents,
} from "./segmentStyle";

export default function CwdSegment({
  cwd,
  exitCode = 0,
  rowHeight,
  iconSize,
  onClick,
  minimal,
}) {
  const [hovered, setHovered] = useState(false);
  const tint = "var(--prompt-cwd-tint)";
  const base = neonGlassStyle({ tint, onClick, minimal, accentBorder: true });
  const style = hovered ? { ...base, ...neonGlassHoverStyle(tint, minimal) } : base;

  const parts = buildParts(cwd);

  return (
    <button
      onClick={onClick}
      onMouseDown={stopSegmentEvents}
      onPointerDown={stopSegmentEvents}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={-1}
      title={cwd}
      style={style}
    >
      <img src={folderIcon} style={{ width: 14, height: 14, flexShrink: 0 }} alt="" />
      {parts.map((p, i) => (
        <span
          key={i}
          style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
        >
          {i > 0 && <span style={{ opacity: 0.45, fontSize: "0.8em" }}>›</span>}
          <span style={{ fontWeight: 700, fontSize: "1.05em" }}>
            {p}
          </span>
        </span>
      ))}
    </button>
  );
}

function buildParts(p) {
  if (!p) return ["~"];
  const home = p.match(/^\/Users\/[^/]+/);
  const rel = home ? "~" + p.slice(home[0].length) : p;
  const parts = rel.split("/").filter(Boolean);
  if (rel === "~" || parts.length === 0) return ["~"];
  const last4 = parts.slice(-4);
  return last4;
}
