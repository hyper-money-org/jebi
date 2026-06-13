// Slash command registry.
//
// Adding a new command is a one-line change: append an entry below.
// Each entry is `{ id, title, description, section, run(ctx) }`.
//
// If the new command needs a capability the per-pane `commandContext` doesn't
// yet provide, add one method to the context builder in TerminalPane.
//
// Commands run in-app only — they never reach the shell and never enter
// shared command history.

export const ALL_COMMANDS = [
  {
    id: 'ask',
    title: 'Ask AI',
    description: 'Ask a question about your terminal session',
    section: 'Terminal',
    run: (ctx) => ctx.openAsk(),
  },
  {
    id: 'summarize',
    title: 'Summarize session',
    description: 'AI summary of your recent commands and activity',
    section: 'Terminal',
    run: (ctx) => ctx.summarize(),
  },
  {
    id: 'run',
    title: 'Run script',
    description: 'Run a project script (npm, make, go, cargo…)',
    section: 'Terminal',
    run: (ctx) => ctx.openRun(),
  },
  {
    id: 'history',
    title: 'History',
    description: 'Search and re-run past commands',
    section: 'Terminal',
    run: (ctx) => ctx.openHistory(),
  },
  {
    id: 'ls',
    title: 'List files',
    description: 'Browse files in the current directory',
    section: 'Terminal',
    run: (ctx) => ctx.openFileList(),
  },
  {
    id: 'ports',
    title: 'Ports',
    description: 'Show listening ports and processes',
    section: 'Terminal',
    run: (ctx) => ctx.openPorts(),
  },
  {
    id: 'logo',
    title: 'Logo',
    description: 'Show the spinning jebi cube',
    section: 'Terminal',
    run: async (ctx) => {
      const path = await window.electron.getLogoScriptPath()
      ctx.runCommand(`python3 "${path}"`)
    },
  },
  {
    id: 'clear',
    title: 'Clear',
    description: 'Clear the terminal scrollback buffer',
    section: 'Terminal',
    run: (ctx) => ctx.clearScrollback(),
  },
  {
    id: 'copy-output',
    title: 'Copy output',
    description: "Copy the last command's output",
    section: 'Terminal',
    run: (ctx) => ctx.copyLastOutput(),
  },
  {
    id: 'split-right',
    title: 'Split right',
    description: 'Open a new pane to the right',
    section: 'Workspace',
    run: (ctx) => ctx.splitPane('horizontal'),
  },
  {
    id: 'split-down',
    title: 'Split down',
    description: 'Open a new pane below',
    section: 'Workspace',
    run: (ctx) => ctx.splitPane('vertical'),
  },
  {
    id: 'close-pane',
    title: 'Close pane',
    description: 'Close the current pane',
    section: 'Workspace',
    run: (ctx) => ctx.closePane(),
  },
  {
    id: 'new-tab',
    title: 'New tab',
    description: 'Open a new terminal tab',
    section: 'Workspace',
    run: (ctx) => ctx.newTab(),
  },
  {
    id: 'toggle-tabs',
    title: 'Toggle tabs',
    description: 'Flip the tab bar between top and left',
    section: 'Workspace',
    run: (ctx) => ctx.toggleTabPosition(),
  },
]

const COMMANDS_BY_ID = new Map(ALL_COMMANDS.map((c) => [c.id, c]))

export function getCommand(id) {
  return COMMANDS_BY_ID.get(id) ?? null
}

// User-defined commands loaded from ~/.config/jebi/commands.json at startup.
let _userCommands = []

export function setUserCommands(rawList) {
  _userCommands = rawList
    .filter((c) => c.id && (c.command || Array.isArray(c.items) || c.itemsFrom))
    .map((c) => ({
      id: c.id,
      title: c.title ?? c.id,
      description: c.description ?? '',
      section: c.section ?? 'Custom',
      run: Array.isArray(c.items)
        ? (ctx) => ctx.openCustomList({ title: c.title ?? c.id, items: c.items })
        : c.itemsFrom
          ? (ctx) => ctx.openCustomList({
              title: c.title ?? c.id,
              itemsFrom: c.itemsFrom,
              onSelectTemplate: c.onSelect ?? '{label}',
            })
          : (ctx) => ctx.runCommand(c.command),
    }))
}

export function getUserCommands() {
  return _userCommands
}

// All commands: built-ins + user-defined.
function allCommands() {
  return [...ALL_COMMANDS, ..._userCommands]
}

// Case-insensitive startsWith filter on id and title. Empty prefix returns
// all commands in registry order.
export function filterByPrefix(prefix) {
  const commands = allCommands()
  if (!prefix) return commands
  const p = prefix.toLowerCase()
  return commands.filter(
    (c) => c.id.toLowerCase().startsWith(p) || c.title.toLowerCase().startsWith(p),
  )
}
