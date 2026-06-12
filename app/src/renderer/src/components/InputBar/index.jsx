import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import Prompt from "../Prompt";
import { useShellEditor, ghostSuggestionsEffect } from "./useShellEditor";


const InputBar = forwardRef(function InputBar(
  {
    onSubmit,
    onNavigateHistory,
    resetNavigation,
    getHistory,
    isNavigatingHistory,
    commandContext,
    onDismissExplanation,
    onSlashChange,
    aiSuggestions = [],
    onSuggestionPick,
    cwd,
    exitCode,
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
  },
  ref,
) {
  // callbacksRef keeps latest prop values accessible inside the CodeMirror
  // keybinding closures without rebuilding the EditorView when props change.
  const callbacksRef = useRef({});
  callbacksRef.current.onValueChange = (value) => {
    onSlashChange?.(value.startsWith('/') ? value.slice(1) : null);
  };
  callbacksRef.current.onSubmit = onSubmit;
  callbacksRef.current.onNavigateHistory = onNavigateHistory;
  callbacksRef.current.resetNavigation = resetNavigation;
  callbacksRef.current.getHistory = getHistory;
  callbacksRef.current.isNavigatingHistory = isNavigatingHistory;
  callbacksRef.current.commandContext = commandContext;
  callbacksRef.current.aiSuggestions = aiSuggestions;
  callbacksRef.current.onSuggestionPick = onSuggestionPick;
  callbacksRef.current.cwd = cwd;
  callbacksRef.current.onDismissExplanation = onDismissExplanation;

  const { editorContainerRef, viewRef } = useShellEditor(callbacksRef)

  useEffect(() => {
    viewRef.current?.dispatch({ effects: ghostSuggestionsEffect.of(aiSuggestions) })
  }, [aiSuggestions]);

  useImperativeHandle(ref, () => ({
    focus: () => viewRef.current?.focus(),
    setValue: (text) => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
      view.focus();
    },
  }));

  return (
    <div
      style={{
        marginTop: "2px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        background: 'color-mix(in srgb, #000 20%, var(--bg-surface))',
      }}
    >
      {/* Prompt row — pills + right-aligned suggestion chips */}
      <div>
        <Prompt
          cwd={cwd}
          aiSuggestions={aiSuggestions}
          onSuggestionPick={onSuggestionPick}
          gitData={gitData}
          onGitClick={onGitClick}
          nodeData={nodeData}
          onNodeClick={onNodeClick}
          goData={goData}
          onGoClick={onGoClick}
          pythonData={pythonData}
          onPythonClick={onPythonClick}
          dockerData={dockerData}
          onDockerClick={onDockerClick}
          k8sData={k8sData}
          onK8sClick={onK8sClick}
          rustData={rustData}
          onRustClick={onRustClick}
          phpData={phpData}
          onPhpClick={onPhpClick}
          javaData={javaData}
          onJavaClick={onJavaClick}
          kotlinData={kotlinData}
          onKotlinClick={onKotlinClick}
          haskellData={haskellData}
          onHaskellClick={onHaskellClick}
          cData={cData}
          onCClick={onCClick}
          condaData={condaData}
          onCondaClick={onCondaClick}
        />
      </div>

      {/* Editor row — ❯ glyph + CodeMirror */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "3px 14px 8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--font-size-mono)",
            color: "var(--tab-accent)",
            opacity: 0.85,
            paddingTop: "2px",
            flexShrink: 0,
            userSelect: "none",
            lineHeight: 1.5,
          }}
        >
          ❯
        </span>
        <div ref={editorContainerRef} style={{ flex: 1, minWidth: 0 }} />
      </div>
    </div>
  );
});

export default InputBar;
