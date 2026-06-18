# Custom Slash Commands

jebi lets you define your own slash commands that appear in the command palette when you type `/`. Commands can run a shell script directly, show a static pick-list, or generate a dynamic list from any shell command's output.

---

## Where to Define Commands

Custom commands are stored in `~/.config/jebi/commands.json`. You can edit them in **Preferences → Custom Slash Commands**, or open the file directly in any editor — jebi hot-reloads on save.

---

## Command Structure

Each command is a JSON object in a top-level array. Every command requires an `id` and exactly one action (`command`, `items`, or `itemsFrom`).

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier. Used to trigger the command (e.g. `/deploy`) |
| `title` | string | no | Display name in the palette. Defaults to `id` |
| `description` | string | no | Subtitle shown below the title in the palette |
| `section` | string | no | Group heading in the palette. Defaults to `"Custom"` |
| `command` | string | one of | Shell command to run directly |
| `items` | array | one of | Static list of `{ label, command }` pairs |
| `itemsFrom` | string | one of | Shell command whose output populates a dynamic list |
| `onSelect` | string | no | Template for dynamic lists. `{label}` is replaced with the selected item. Only valid with `itemsFrom` |

> **Note:** `id` cannot conflict with built-in commands: `ask`, `run`, `ls`, `ports`, `history`, `clear`, `copy-output`, `split-right`, `split-down`, `close-pane`, `new-tab`, `toggle-tabs`.

---

## Command Types

### 1. Direct Command

Runs a shell command immediately when selected.

```json
{
  "id": "deploy",
  "title": "Deploy",
  "description": "Deploy to production",
  "command": "npm run deploy"
}
```

---

### 2. Static List

Shows a pick-list with pre-defined options. Each item has a `label` (shown in the list) and a `command` (run when selected).

```json
{
  "id": "open-config",
  "title": "Open config file",
  "items": [
    { "label": ".env", "command": "nano .env" },
    { "label": ".gitignore", "command": "nano .gitignore" },
    { "label": "README.md", "command": "less README.md" }
  ]
}
```

---

### 3. Dynamic List

Runs a shell command and uses its output (one item per line) to populate the pick-list. Use `onSelect` to define what runs when an item is picked — `{label}` is replaced with the selected line.

```json
{
  "id": "checkout",
  "title": "Git checkout",
  "description": "Switch to a branch",
  "itemsFrom": "git branch --format='%(refname:short)'",
  "onSelect": "git checkout {label}"
}
```

---

## Examples

### Git

```json
[
  {
    "id": "checkout",
    "title": "Git checkout",
    "description": "Switch to a branch",
    "section": "Git",
    "itemsFrom": "git branch --format='%(refname:short)'",
    "onSelect": "git checkout {label}"
  },
  {
    "id": "branch-delete",
    "title": "Delete branch",
    "description": "Delete a local branch",
    "section": "Git",
    "itemsFrom": "git branch --format='%(refname:short)'",
    "onSelect": "git branch -d {label}"
  },
  {
    "id": "stash-apply",
    "title": "Apply stash",
    "description": "Apply a saved stash",
    "section": "Git",
    "itemsFrom": "git stash list --format='%gd: %s'",
    "onSelect": "git stash apply {label}"
  },
  {
    "id": "git-log",
    "title": "Git log",
    "description": "Pretty commit history",
    "section": "Git",
    "command": "git log --oneline --graph --decorate -20"
  }
]
```

### Docker

```json
[
  {
    "id": "docker-shell",
    "title": "Shell into container",
    "description": "Open a bash shell in a running container",
    "section": "Docker",
    "itemsFrom": "docker ps --format '{{.Names}}'",
    "onSelect": "docker exec -it {label} /bin/bash"
  },
  {
    "id": "docker-logs",
    "title": "Container logs",
    "description": "Tail logs from a running container",
    "section": "Docker",
    "itemsFrom": "docker ps --format '{{.Names}}'",
    "onSelect": "docker logs -f {label}"
  },
  {
    "id": "docker-stop",
    "title": "Stop container",
    "section": "Docker",
    "itemsFrom": "docker ps --format '{{.Names}}'",
    "onSelect": "docker stop {label}"
  }
]
```

### Node / npm

```json
[
  {
    "id": "npm-script",
    "title": "Run npm script",
    "description": "Pick a script from package.json",
    "section": "Node",
    "itemsFrom": "node -e \"const p=require('./package.json'); console.log(Object.keys(p.scripts||{}).join('\\n'))\"",
    "onSelect": "npm run {label}"
  },
  {
    "id": "nvm-use",
    "title": "Switch Node version",
    "section": "Node",
    "itemsFrom": "ls ~/.nvm/versions/node",
    "onSelect": "nvm use {label}"
  }
]
```

### System

```json
[
  {
    "id": "kill-port",
    "title": "Kill process on port",
    "description": "Free up a port",
    "section": "System",
    "items": [
      { "label": "3000", "command": "lsof -ti:3000 | xargs kill -9" },
      { "label": "4000", "command": "lsof -ti:4000 | xargs kill -9" },
      { "label": "5432 (Postgres)", "command": "lsof -ti:5432 | xargs kill -9" },
      { "label": "6379 (Redis)", "command": "lsof -ti:6379 | xargs kill -9" },
      { "label": "8080", "command": "lsof -ti:8080 | xargs kill -9" }
    ]
  },
  {
    "id": "myip",
    "title": "My IP addresses",
    "section": "System",
    "command": "echo \"Local: $(ipconfig getifaddr en0)\" && echo \"Public: $(curl -s ifconfig.me)\""
  },
  {
    "id": "disk",
    "title": "Disk usage",
    "section": "System",
    "command": "df -h | grep -v tmpfs"
  }
]
```

---

## Tips

- **`onSelect` defaults to `{label}`** — if you omit it, selecting an item runs the label text directly as a command. Useful when `itemsFrom` already outputs runnable commands.
- **Working directory** — dynamic `itemsFrom` commands run in the terminal's current working directory, so commands like `git branch` work relative to your project.
- **Hot-reload** — saving `commands.json` while jebi is open reloads your commands immediately. No restart needed.
- **Sections** — use the `section` field to group related commands under a heading in the palette (e.g. `"Git"`, `"Docker"`, `"Node"`).
