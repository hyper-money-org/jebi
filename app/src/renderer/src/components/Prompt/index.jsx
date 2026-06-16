import { useState, useSyncExternalStore } from "react";

function SuggestionChip({ cmd, onPick, index }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative', flexShrink: 1, minWidth: 0, margin: 4 }}>
      <button
        tabIndex={-1}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onPick?.(cmd) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '1px 8px',
          borderRadius: 3,
          border: '1px solid color-mix(in srgb, var(--text-muted) 22%, transparent)',
          background: hovered
            ? 'color-mix(in srgb, var(--text-muted) 14%, var(--bg-elevated))'
            : 'var(--bg-elevated)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-mono)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          userSelect: 'none',
          minWidth: 0,
          maxWidth: 200,
          transition: 'background 0.1s',
        }}
      >
        {index != null && (
          <span style={{
            fontSize: 'var(--font-size-mono)',
            color: 'var(--text-muted)',
            opacity: 0.7,
            flexShrink: 0,
            fontWeight: 400,
          }}>⌘{index + 1}</span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {cmd}
        </span>
      </button>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 5,
          padding: '4px 8px',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-mono)',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {cmd}
        </div>
      )}
    </div>
  )
}
import { VscCopy, VscCheck, VscDebugRestart, VscWatch } from "react-icons/vsc";
import CwdSegment from "./CwdSegment";
import GitSegment from "./GitSegment";
import NodeSegment from "./NodeSegment";
import GoSegment from "./GoSegment";
import PythonSegment from "./PythonSegment";
import DockerSegment from "./DockerSegment";
import K8sSegment from "./K8sSegment";
import RustSegment from "./RustSegment";
import CSegment from "./CSegment";
import PhpSegment from "./PhpSegment";
import JavaSegment from "./JavaSegment";
import KotlinSegment from "./KotlinSegment";
import HaskellSegment from "./HaskellSegment";
import CondaSegment from "./CondaSegment";
import { MdAccessTimeFilled } from "react-icons/md";
import {
  getSegmentEnabled,
  subscribeSegmentPrefs,
  getSegmentPrefSnapshot,
} from "../../preferences/segments";
import {
  getPromptStyleId,
  subscribePromptStyle,
} from "../../preferences/promptStyles";
import { formatDuration } from "../../utils/formatDuration";

const SEP = (
  <span
    aria-hidden
    style={{
      color: "var(--text-secondary)",
      opacity: 0.5,
      flexShrink: 0,
      fontFamily: "var(--font-mono)",
      userSelect: "none",
      fontSize: "0.9em",
      paddingLeft: "2px",
      paddingRight: "2px",
    }}
  >
    │
  </span>
);

export default function Prompt({
  command,
  cwd,
  exitCode,
  rowHeight,
  cellHeight,
  showSeparator = true,
  running = false,
  compact = false,
  onCopy,
  onReplay,
  onSave,
  startTime,
  duration,
  aiSuggestions = [],
  onSuggestionPick,
  gitData,
  onGitClick,
  nodeData,
  onNodeClick,
  goData,
  onGoClick,
  pythonData,
  onPythonClick,
  dockerData,
  onDockerClick,
  k8sData,
  onK8sClick,
  rustData,
  onRustClick,
  phpData,
  onPhpClick,
  javaData,
  onJavaClick,
  kotlinData,
  onKotlinClick,
  haskellData,
  onHaskellClick,
  cData,
  onCClick,
  condaData,
  onCondaClick,
}) {
  useSyncExternalStore(subscribeSegmentPrefs, getSegmentPrefSnapshot);
  const promptStyleId = useSyncExternalStore(
    subscribePromptStyle,
    getPromptStyleId,
  );
  const minimal = promptStyleId === "minimal";
  const seg = getSegmentEnabled;

  const [copied, setCopied] = useState(false);
  const [timeHovered, setTimeHovered] = useState(false);
  const commandLines = command ? command.split("\n") : [];

  const iconSize = 15;

  const rowStyle = rowHeight
    ? { minHeight: `${rowHeight}px`, alignItems: "start" }
    : { lineHeight: 1.4 };

  function handleCopy(e) {
    e.stopPropagation();
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleReplay(e) {
    e.stopPropagation();
    onReplay?.();
  }

  const segmentList = [];
  if (seg("cwd") && cwd) segmentList.push({ kind: "cwd" });
  if (seg("git") && gitData) segmentList.push({ kind: "git" });
  if (seg("rust") && rustData) segmentList.push({ kind: "rust" });
  if (seg("c") && cData) segmentList.push({ kind: "c" });
  if (seg("node") && nodeData) segmentList.push({ kind: "node" });
  if (seg("go") && goData) segmentList.push({ kind: "go" });
  if (seg("php") && phpData) segmentList.push({ kind: "php" });
  if (seg("java") && javaData) segmentList.push({ kind: "java" });
  if (seg("kotlin") && kotlinData) segmentList.push({ kind: "kotlin" });
  if (seg("haskell") && haskellData) segmentList.push({ kind: "haskell" });
  if (seg("python") && pythonData) segmentList.push({ kind: "python" });
  if (seg("docker") && dockerData) segmentList.push({ kind: "docker" });
  if (seg("k8s") && k8sData) segmentList.push({ kind: "k8s" });
  if (seg("conda") && condaData) segmentList.push({ kind: "conda" });

  const segProps = { rowHeight, iconSize, minimal };

  function renderSegment({ kind }, i) {
    const key = `${kind}-${i}`;
    if (kind === "cwd")
      return (
        <CwdSegment
          key={key}
          {...segProps}
          cwd={cwd}
          exitCode={exitCode}
          onClick={() => window.electron?.openPath(cwd)}
        />
      );
    if (kind === "git")
      return (
        <GitSegment
          key={key}
          {...segProps}
          branch={gitData.branch}
          dirty={gitData.dirty}
          ahead={gitData.ahead}
          behind={gitData.behind}
          staged={gitData.staged}
          modified={gitData.modified}
          untracked={gitData.untracked}
          onClick={onGitClick}
        />
      );
    if (kind === "node")
      return (
        <NodeSegment
          key={key}
          {...segProps}
          version={nodeData.version}
          packageManager={nodeData.packageManager}
          onClick={onNodeClick}
        />
      );
    if (kind === "go")
      return (
        <GoSegment
          key={key}
          {...segProps}
          version={goData.version}
          onClick={onGoClick}
        />
      );
    if (kind === "python")
      return (
        <PythonSegment
          key={key}
          {...segProps}
          version={pythonData.version}
          venv={pythonData.venv}
          onClick={onPythonClick}
        />
      );
    if (kind === "docker")
      return (
        <DockerSegment
          key={key}
          {...segProps}
          kind={dockerData.kind}
          onClick={onDockerClick}
        />
      );
    if (kind === "k8s")
      return (
        <K8sSegment
          key={key}
          {...segProps}
          context={k8sData.context}
          namespace={k8sData.namespace}
          onClick={onK8sClick}
        />
      );
    if (kind === "rust")
      return (
        <RustSegment
          key={key}
          {...segProps}
          version={rustData.version}
          onClick={onRustClick}
        />
      );
    if (kind === "c")
      return (
        <CSegment
          key={key}
          {...segProps}
          version={cData.version}
          onClick={onCClick}
        />
      );
    if (kind === "php")
      return (
        <PhpSegment
          key={key}
          {...segProps}
          version={phpData.version}
          onClick={onPhpClick}
        />
      );
    if (kind === "java")
      return (
        <JavaSegment
          key={key}
          {...segProps}
          version={javaData.version}
          onClick={onJavaClick}
        />
      );
    if (kind === "kotlin")
      return (
        <KotlinSegment
          key={key}
          {...segProps}
          version={kotlinData.version}
          onClick={onKotlinClick}
        />
      );
    if (kind === "haskell")
      return (
        <HaskellSegment
          key={key}
          {...segProps}
          version={haskellData.version}
          onClick={onHaskellClick}
        />
      );
    if (kind === "conda")
      return (
        <CondaSegment
          key={key}
          {...segProps}
          env={condaData.env}
          onClick={onCondaClick}
        />
      );
    return null;
  }

  const hasError = exitCode > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        marginTop: 1,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--font-size-mono)",
        userSelect: "none",
      }}
    >
      {
        <div
          style={{
            height: "2px",
            background: "var(--prompt-cwd-tint)",
            flexShrink: 0,
            opacity: running ? 0.45 : 0.2,
            transition: "opacity 0.25s ease",
          }}
        >
        </div>
      }
      <div
        style={{
          display: "flex",
          ...rowStyle,
        }}
      >
        {/* Segments with │ separators */}
        {segmentList.map((s, i) => (
          <span
            key={s.kind}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            {minimal && i > 0 && SEP}
            {renderSegment(s, i)}
          </span>
        ))}

        {/* Error pill — shown after segments when exitCode > 0 */}
        {hasError && (
          <span
            style={
              minimal
                ? {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    lineHeight: 1,
                    padding: "3px 6px",
                    color: "#f85149",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--font-size-mono)",
                    fontWeight: 600,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }
                : {
                    background: "color-mix(in srgb, #f85149 12%, transparent)",
                    color: "#f85149",
                    borderLeft: "4px solid #f85149",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    lineHeight: 1,
                    padding: "5px 10px",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--font-size-mono)",
                    fontWeight: 600,
                    cursor: "default",
                    transition: "background 0.15s ease, box-shadow 0.15s ease",
                    userSelect: "none",
                  }
            }
          >
            ✕ exit {exitCode}
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />


        {/* Timing — always visible but minimal; hover reveals full timestamp */}
        {duration != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              marginRight: 8,
              cursor: "pointer",
            }}
            onMouseEnter={() => setTimeHovered(true)}
            onMouseLeave={() => setTimeHovered(false)}
          >
            {timeHovered && startTime != null ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "2px 7px",
                  borderRadius: 3,
                  fontSize: `${iconSize - 1}px`,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  animation: "slideInRight 0.12s ease-out",
                }}
              >
                <MdAccessTimeFilled
                  size={iconSize - 1}
                  style={{ opacity: 0.6 }}
                />
                <span>
                  {new Date(startTime).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{formatDuration(duration)}</span>
              </span>
            ) : (
              <span
                style={{
                  fontSize: `${iconSize - 1}px`,
                  color: "var(--text-muted)",
                  opacity: 0.5,
                }}
              >
                {formatDuration(duration)}
              </span>
            )}
          </div>
        )}

        {/* Save as shortcut */}
        {onSave && !running && command && (
          <button
            onClick={onSave}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
            title="Save as shortcut"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 5,
              width: iconSize + 10,
              height: iconSize + 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              opacity: 0.5,
              flexShrink: 0,
              transition: "opacity 0.15s, color 0.15s",
              borderRadius: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 1;
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 0.5;
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
              <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z"/>
            </svg>
          </button>
        )}

        {/* Replay */}
        {onReplay && (
          <button
            onClick={handleReplay}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            title="Run again"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 5,
              width: iconSize + 10,
              height: iconSize + 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              opacity: 0.4,
              flexShrink: 0,
              transition: "opacity 0.15s, color 0.15s",
              borderRadius: 3,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 1;
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 0.4;
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <VscDebugRestart size={iconSize} />
          </button>
        )}

        {/* Copy */}
        {onCopy && (
          <button
            onClick={handleCopy}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            title="Copy command and output"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 5,
              width: iconSize + 10,
              height: iconSize + 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: copied ? "var(--accent)" : "var(--text-muted)",
              opacity: copied ? 1 : 0.4,
              flexShrink: 0,
              transition: "opacity 0.15s, color 0.15s",
              borderRadius: 3,
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.opacity = 1;
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.opacity = 0.4;
                e.currentTarget.style.color = "var(--text-muted)";
              }
            }}
          >
            {copied ? (
              <VscCheck size={iconSize} />
            ) : (
              <VscCopy size={iconSize} />
            )}
          </button>
        )}
      </div>

      {/* Command lines — xterm decoration only */}
      {(compact ? commandLines.slice(0, 1) : commandLines).map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "start",
            position: "relative",
            ...(cellHeight
              ? { minHeight: `${cellHeight}px`, alignItems: "center" }
              : { lineHeight: 1.4 }),
            overflow: compact ? "hidden" : "visible",
            paddingLeft: 25,
            paddingRight: 12,
            marginTop: -10,
          }}
        >
          {i === 0 && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 15,
                top: 1,
                width: 13,
                height: 15,
                borderLeft:
                  "2px dotted color-mix(in srgb, var(--prompt-cwd-tint) 30%, transparent)",
                borderBottom:
                  "2px dotted color-mix(in srgb, var(--prompt-cwd-tint) 30%, transparent)",
                borderBottomLeftRadius: 3,
                pointerEvents: "none",
              }}
            />
          )}
          <span
            style={{
              marginLeft: 10,
              color:
                "color-mix(in srgb, var(--prompt-cwd-tint) 70%, var(--text-primary))",
              ...(compact
                ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }
                : { wordBreak: 'break-all', whiteSpace: 'pre-wrap' }),
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}
