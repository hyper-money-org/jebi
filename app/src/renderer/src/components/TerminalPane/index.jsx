import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useTerminal } from "../../hooks/useTerminal";
import { useSharedHistory } from "../../hooks/useSharedHistory";
import { setPaneInfo } from "../../hooks/usePaneInfo";
import { usePreferences } from "../../hooks/usePreferences";
import { registerCopy, unregisterCopy } from "../../hooks/paneCopyRegistry";
import { registerFocus, unregisterFocus } from "../../hooks/paneFocusRegistry";
import OutputArea from "../OutputArea";
import InputBar from "../InputBar";
import ExplanationPanel from "../ExplanationPanel";

export default function TerminalPane({
  paneId,
  isActive,
  isVisible,
  tabAccent,
  initialCwd,
  onFocus,
  onSplitRight,
  onSplitDown,
  onClose,
  onNewTab,
  onToggleTabPosition,
}) {
  // callbacksRef holds all event handlers as a stable ref object instead of
  // passing them as props or state. xterm.js and CodeMirror both live outside
  // the React render cycle — they hold long-lived references to these handlers.
  // If we passed fresh closures each render, they would capture stale state.
  // By writing to callbacksRef.current on every render, handlers always see
  // the latest values without causing extra renders or requiring re-registration.
  const callbacksRef = useRef({});
  const { prefs } = usePreferences();
  const { sendInput, sendRaw, sendResize, sendAIAppend, sendAsk } = useTerminal(paneId, callbacksRef, initialCwd);
  const {
    push: pushHistory,
    navigate: navigateHistory,
    getAll: getHistory,
    isNavigating: isNavigatingHistory,
    resetNavigation,
  } = useSharedHistory();
  const [running, setRunning] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const interactiveRef = useRef(false);
  const [fileListOpen, setFileListOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [portsOpen, setPortsOpen] = useState(false);
  const [customList, setCustomList] = useState(null); // { title, items } | null
  const [previewFile, setPreviewFile] = useState(null); // file path | null
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [hasCommands, setHasCommands] = useState(false)
  const [askOpen, setAskOpen] = useState(false);
  const [askMessages, setAskMessages] = useState([]); // [{ role, content, streaming?, error? }]
  const [banner, setBanner] = useState(null); // { text: string, type: 'error'|'info'|'warning'|'suggestion' }
  const [cwd, setCwd] = useState("");
  const [exitCode, setExitCode] = useState(0);
  const [gitData, setGitData] = useState(null);
  const [nodeData, setNodeData] = useState(null);
  const [goData, setGoData] = useState(null);
  const [pythonData, setPythonData] = useState(null);
  const [dockerData, setDockerData] = useState(null);
  const [k8sData, setK8sData] = useState(null);
  const [rustData, setRustData] = useState(null);
  const [phpData, setPhpData] = useState(null);
  const [javaData, setJavaData] = useState(null);
  const [kotlinData, setKotlinData] = useState(null);
  const [haskellData, setHaskellData] = useState(null);
  const [cData, setCData] = useState(null);
  const [condaData, setCondaData] = useState(null);
  const inputBarRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    registerCopy(paneId, () => callbacksRef.current.copySelection?.())
    return () => unregisterCopy(paneId)
  }, [paneId])

  useEffect(() => {
    registerFocus(paneId, () => inputBarRef.current?.focus())
    return () => unregisterFocus(paneId)
  }, [paneId])
  // pendingCommandRef holds the command that was just submitted but whose exit
  // code hasn't arrived yet. The OSC 9001 exit-code signal fires asynchronously
  // after the prompt re-appears, so we can't rely on React state to correlate
  // which command finished. On exit_code=0 we push this to history; on any
  // code we clear it so we never add stale commands on the next success.
  const pendingCommandRef = useRef(null);

  runningRef.current = running;

  callbacksRef.current.isRunning = () => runningRef.current;
  callbacksRef.current.isInteractive = () => interactiveRef.current;
  callbacksRef.current.focusInput = () => inputBarRef.current?.focus();
  callbacksRef.current.onInteractiveEnter = () => {
    setInteractive(true);
    interactiveRef.current = true;
  };
  callbacksRef.current.onInteractiveExit = () => {
    setInteractive(false);
    interactiveRef.current = false;
  };

  callbacksRef.current.onCwd = (value) => {
    // The shell hook fires cwd before every prompt — not just after `cd`.
    // Only treat it as a directory change when the value actually differs
    // from the previous cwd; otherwise we'd wipe lastCommand on every prompt
    // and the tab icon/title would revert to the folder after every command.
    const changed = callbacksRef.current.currentCwd !== value;
    setCwd(value);
    if (changed) {
      // Reset all context-aware segments on directory change; detectors re-populate for the new dir.
      setGitData(null);
      setNodeData(null);
      setGoData(null);
      setPythonData(null);
      setDockerData(null);
      setK8sData(null);
      setRustData(null);
      setPhpData(null);
      setJavaData(null);
      setKotlinData(null);
      setHaskellData(null);
      setCData(null);
    }
    callbacksRef.current.currentCwd = value;
    callbacksRef.current.onCwdDecoration?.(value);
    // Clear lastCommand only when cwd actually changes, so `cd foo` lands on
    // a folder-named tab but `docker ps` keeps the docker icon after it exits.
    setPaneInfo(paneId, changed ? { cwd: value, lastCommand: null } : { cwd: value });
  };

  // exit_code arrives before every prompt — signals command done and captures exit status.
  callbacksRef.current.onExitCode = (value) => {
    const code = Number(value);
    setExitCode(code);
    callbacksRef.current.currentExitCode = code;
    callbacksRef.current.onExitCodeDecoration?.(code);
    if (pendingCommandRef.current)
      pushHistory(pendingCommandRef.current, code);
    if (code === 0) setBanner(null);
    pendingCommandRef.current = null;
    setRunning(false);
    setInteractive(false);
    interactiveRef.current = false;
    setPaneInfo(paneId, { runningCommand: null });
    setTimeout(() => {
      inputBarRef.current?.focus();
      // Send the just-completed command + output to the backend for AI suggestion.
      const entry = callbacksRef.current.getLastEntry?.();
      if (entry && prefs.aiCommandSuggestions !== false) {
        setAiSuggestions([]);
        sendAIAppend(entry);
      }
    }, 0);
  };

  callbacksRef.current.onAISuggestion = (cmds) => {
    setAiSuggestions(cmds);
  };
  callbacksRef.current.onAISuggestError = () => { setAiSuggestions([]); };
  callbacksRef.current.onAIBannerStart = (type) => {
    if (type === 'error' && !prefs.aiExplainErrors) return;
    if (type === 'info'  && !prefs.aiDirectoryContext) return;
    setBanner({ text: '', type });
  };
  callbacksRef.current.onAIBannerToken = (token) => setBanner(prev => prev ? { ...prev, text: prev.text + token } : null);
  callbacksRef.current.onAIBannerCancel = () => setBanner(null);
  callbacksRef.current.onDismissExplanation = () => setBanner(null);

  callbacksRef.current.onGit = (data) => {
    setGitData(data);
    callbacksRef.current.onGitDecoration?.(data);
  };

  callbacksRef.current.onNode = (data) => {
    setNodeData(data);
    callbacksRef.current.onNodeDecoration?.(data);
  };

  callbacksRef.current.onGo = (data) => {
    setGoData(data);
    callbacksRef.current.onGoDecoration?.(data);
  };

  callbacksRef.current.onPython = (data) => {
    setPythonData(data);
    callbacksRef.current.onPythonDecoration?.(data);
  };

  callbacksRef.current.onDocker = (data) => {
    setDockerData(data);
    callbacksRef.current.onDockerDecoration?.(data);
  };

  callbacksRef.current.onK8s = (data) => {
    setK8sData(data);
    callbacksRef.current.onK8sDecoration?.(data);
  };

  callbacksRef.current.onRust    = (data) => { setRustData(data);    callbacksRef.current.onRustDecoration?.(data); };
  callbacksRef.current.onPhp     = (data) => { setPhpData(data);     callbacksRef.current.onPhpDecoration?.(data); };
  callbacksRef.current.onJava    = (data) => { setJavaData(data);    callbacksRef.current.onJavaDecoration?.(data); };
  callbacksRef.current.onKotlin  = (data) => { setKotlinData(data);  callbacksRef.current.onKotlinDecoration?.(data); };
  callbacksRef.current.onHaskell = (data) => { setHaskellData(data); callbacksRef.current.onHaskellDecoration?.(data); };
  callbacksRef.current.onC       = (data) => { setCData(data);       callbacksRef.current.onCDecoration?.(data); };
  callbacksRef.current.onConda   = (data) => { setCondaData(data);   callbacksRef.current.onCondaDecoration?.(data); };

  const clearScreen = useCallback(() => {
    setBanner(null);
    setAiSuggestions([]);
    setHasCommands(false);
    callbacksRef.current.clearScreen?.();
    setTimeout(() => inputBarRef.current?.focus(), 0);
  }, []);

  const handleSubmit = useCallback(
    (command) => {
      setBanner(null);
      setAiSuggestions([]);
      const trimmed = command.trim();
      setHasCommands(true);
      if (trimmed === 'clear') {
        clearScreen();
        return;
      }
      pendingCommandRef.current = trimmed;
      setRunning(true);
      runningRef.current = true;
      // Navigation commands (cd/pushd/popd) shouldn't become the tab title —
      // onCwd will clear lastCommand and the folder fallback takes over.
      const firstTok = trimmed.split(/\s+/)[0];
      const isNav = firstTok === "cd" || firstTok === "pushd" || firstTok === "popd";
      setPaneInfo(
        paneId,
        isNav
          ? { runningCommand: trimmed }
          : { runningCommand: trimmed, lastCommand: trimmed },
      );

      requestAnimationFrame(() => {
        sendInput(command);
        callbacksRef.current.focusTerm?.();
      });
    },
    [sendInput, paneId, clearScreen],
  );

  function handleMouseDown() {
    if (!interactiveRef.current) setTimeout(() => inputBarRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!isActive) return;
    const onKeyDown = (e) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        clearScreen();
      }
      if (e.metaKey && e.key === 'r') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, clearScreen]);

  // Per-pane slash command context. Each method is a thin adapter over
  // existing pane / app callbacks. Terminal-level methods (clearScrollback,
  // copyLastOutput) are resolved from callbacksRef at call time because
  // OutputArea attaches them after xterm boots.
  const commandContext = useMemo(
    () => ({
      paneId,
      splitPane: (direction) =>
        direction === "vertical" ? onSplitDown?.() : onSplitRight?.(),
      closePane: () => onClose?.(),
      newTab: () => onNewTab?.(),
      toggleTabPosition: () => onToggleTabPosition?.(),
      runCommand: (cmd) => handleSubmit(cmd),
      openCustomList: (data) => setCustomList(
        data.itemsFrom ? { ...data, cwd: callbacksRef.current.currentCwd ?? '' } : data
      ),
      openFileList: () => setFileListOpen(true),
      openHistory: () => setHistoryOpen(true),
      openRun: () => setRunOpen(true),
      openPorts: () => setPortsOpen(true),
      openAsk: () => { setAskMessages([]); setAskOpen(true) },
      clearScrollback: () => callbacksRef.current.clearScrollback?.(),
      copyLastOutput: () => callbacksRef.current.copyLastOutput?.(),
    }),
    [paneId, onSplitRight, onSplitDown, onClose, onNewTab, onToggleTabPosition],
  );

  callbacksRef.current.fileListOpen = fileListOpen || historyOpen || runOpen || slashOpen || portsOpen || !!customList || !!previewFile || askOpen;

  callbacksRef.current.onAskChunk = (token) => {
    setAskMessages((prev) => {
      const msgs = [...prev]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant' && last.streaming) {
        msgs[msgs.length - 1] = { ...last, content: last.content + token }
      }
      return msgs
    })
  }
  callbacksRef.current.onAskDone = () => {
    setAskMessages((prev) => {
      const msgs = [...prev]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant' && last.streaming) {
        msgs[msgs.length - 1] = { ...last, streaming: false }
      }
      return msgs
    })
  }
  callbacksRef.current.onAskError = (err) => {
    setAskMessages((prev) => {
      const msgs = [...prev]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant' && last.streaming) {
        msgs[msgs.length - 1] = { role: 'assistant', content: err || 'AI not available', error: true }
      } else {
        msgs.push({ role: 'assistant', content: err || 'AI not available', error: true })
      }
      return msgs
    })
  }

  const handleFileListSelect = useCallback((entry) => {
    setFileListOpen(false)
    const q = (s) => `'${s.replace(/'/g, "'\\''")}'`
    const target = entry.fullPath ?? entry.name
    handleSubmit(`cd ${q(target)}`)
  }, [handleSubmit])

  const pickSuggestion = useCallback((i) => {
    if (!isActive || aiSuggestions.length <= i) return
    const cmd = aiSuggestions[i]
    setAiSuggestions([])
    handleSubmit(cmd)
  }, [isActive, aiSuggestions, handleSubmit])

  useKeyboardShortcuts({
    'Meta+1': () => pickSuggestion(0),
    'Meta+2': () => pickSuggestion(1),
    'Meta+3': () => pickSuggestion(2),
  })

  const handleFilePreview = useCallback((entry) => {
    setFileListOpen(false)
    setPreviewFile(entry.fullPath ?? entry.name)
  }, [])

  const handleHistorySelect = useCallback((command) => {
    setHistoryOpen(false)
    setTimeout(() => { inputBarRef.current?.setValue(command); inputBarRef.current?.focus() }, 0)
  }, [])

  const handleRunSelect = useCallback((command) => {
    setRunOpen(false)
    handleSubmit(command)
  }, [handleSubmit])

  const handleCustomListSelect = useCallback((item) => {
    setCustomList(null)
    handleSubmit(item.command)
  }, [handleSubmit])

  const handlePortsSelect = useCallback((entry) => {
    setPortsOpen(false)
    handleSubmit(`lsof -p ${entry.pid}`)
  }, [handleSubmit])

  const handlePortsKill = useCallback((entry) => {
    setPortsOpen(false)
    handleSubmit(`kill ${entry.pid}`)
  }, [handleSubmit])

  const handleSlashChange = useCallback((query) => {
    if (query === null) {
      setSlashOpen(false)
      setSlashQuery('')
    } else {
      setSlashOpen(true)
      setSlashQuery(query)
    }
  }, [])

  const handleSlashSelect = useCallback((cmd) => {
    setSlashOpen(false)
    setSlashQuery('')
    setTimeout(() => {
      inputBarRef.current?.setValue('')
      inputBarRef.current?.focus()
    }, 0)
    cmd.run(commandContext)
  }, [commandContext])

  const handleSlashClose = useCallback(() => {
    setSlashOpen(false)
    setSlashQuery('')
    setTimeout(() => {
      inputBarRef.current?.setValue('')
      inputBarRef.current?.focus()
    }, 0)
  }, [])

  return (
    <div
      className="flex-1 min-h-0 flex flex-col overflow-hidden"
      style={tabAccent ? { '--accent': tabAccent, '--prompt-cwd-tint': tabAccent } : undefined}
      onClick={onFocus}
      onMouseDown={handleMouseDown}
    >
      <OutputArea
        callbacksRef={callbacksRef}
        sendRaw={sendRaw}
        sendResize={sendResize}
        onReplay={handleSubmit}
        isActive={isActive}
        isVisible={isVisible}
        tabAccent={tabAccent}
        fileListOpen={fileListOpen}
        fileListCwd={cwd}
        onFileListSelect={handleFileListSelect}
        onFileListPreview={handleFilePreview}
        onFileListClose={() => setFileListOpen(false)}
        previewFile={previewFile}
        onPreviewClose={() => setPreviewFile(null)}
        historyOpen={historyOpen}
        history={getHistory()}
        onHistorySelect={handleHistorySelect}
        onHistoryClose={() => setHistoryOpen(false)}
        runOpen={runOpen}
        runCwd={cwd}
        onRunSelect={handleRunSelect}
        onRunClose={() => setRunOpen(false)}
        slashOpen={slashOpen}
        slashQuery={slashQuery}
        onSlashSelect={handleSlashSelect}
        onSlashClose={handleSlashClose}
        portsOpen={portsOpen}
        onPortsSelect={handlePortsSelect}
        onPortsKill={handlePortsKill}
        onPortsClose={() => setPortsOpen(false)}
        customList={customList}
        onCustomListSelect={handleCustomListSelect}
        onCustomListClose={() => setCustomList(null)}
        hasCommands={hasCommands}
        askOpen={askOpen}
        askMessages={askMessages}
        onAskSend={(history, query) => {
          setAskMessages((prev) => [
            ...prev,
            { role: 'user', content: query },
            { role: 'assistant', content: '', streaming: true },
          ])
          sendAsk(history, query)
        }}
        onAskClose={() => { setAskOpen(false); setTimeout(() => inputBarRef.current?.focus(), 0) }}
      />

      {banner?.text && (
        <ExplanationPanel
          text={banner.text}
          type={banner.type}
          onDismiss={() => setBanner(null)}
        />
      )}
      {!running && !fileListOpen && !historyOpen && !runOpen && !portsOpen && !customList && !previewFile && !askOpen && (
        <InputBar
          ref={inputBarRef}
          onSubmit={handleSubmit}
          onSlashChange={handleSlashChange}
          aiSuggestions={aiSuggestions}
          onSuggestionPick={(cmd) => { setAiSuggestions([]); handleSubmit(cmd); }}
          onNavigateHistory={navigateHistory}
          resetNavigation={resetNavigation}
          getHistory={getHistory}
          isNavigatingHistory={isNavigatingHistory}
          commandContext={commandContext}
          onDismissExplanation={() => setBanner(null)}
          cwd={cwd}
          exitCode={exitCode}
          gitData={gitData}
          onGitClick={() => handleSubmit("git status")}
          nodeData={nodeData}
          onNodeClick={() =>
            handleSubmit(`${nodeData?.packageManager ?? "npm"} run`)
          }
          goData={goData}
          onGoClick={() => handleSubmit("go version")}
          pythonData={pythonData}
          onPythonClick={() => handleSubmit("python3 --version")}
          dockerData={dockerData}
          onDockerClick={() =>
            handleSubmit(dockerData?.kind === "compose" ? "docker compose ps" : "docker ps")
          }
          k8sData={k8sData}
          onK8sClick={() => handleSubmit("kubectl get pods")}
          rustData={rustData}
          onRustClick={() => handleSubmit("cargo --version")}
          phpData={phpData}
          onPhpClick={() => handleSubmit("php --version")}
          javaData={javaData}
          onJavaClick={() => handleSubmit("java --version")}
          kotlinData={kotlinData}
          onKotlinClick={() => handleSubmit("kotlinc -version")}
          haskellData={haskellData}
          onHaskellClick={() => handleSubmit("ghc --version")}
          cData={cData}
          onCClick={() => handleSubmit("gcc --version")}
          condaData={condaData}
          onCondaClick={() => handleSubmit("conda info")}
        />
      )}
    </div>
  );
}
