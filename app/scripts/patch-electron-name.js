// Patches the Electron binary's Info.plist in node_modules so the macOS
// menu bar shows "jebi" instead of "Electron" during development.
// Runs automatically after `npm install` via the postinstall script.
const { execSync } = require('child_process')
const { existsSync } = require('fs')
const path = require('path')

const plist = path.join(
  __dirname,
  '../node_modules/electron/dist/Electron.app/Contents/Info.plist'
)

if (!existsSync(plist)) {
  console.log('[patch-electron-name] Electron bundle not found, skipping.')
  process.exit(0)
}

const buddy = '/usr/libexec/PlistBuddy'
if (!existsSync(buddy)) {
  console.log('[patch-electron-name] PlistBuddy not found (non-macOS?), skipping.')
  process.exit(0)
}

try {
  execSync(`${buddy} -c "Set :CFBundleName jebi" "${plist}"`)
  execSync(`${buddy} -c "Set :CFBundleDisplayName jebi" "${plist}"`)
  console.log('[patch-electron-name] Electron bundle renamed to jebi.')
} catch (e) {
  console.warn('[patch-electron-name] Failed to patch:', e.message)
}
