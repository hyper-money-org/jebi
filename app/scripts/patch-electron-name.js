// Patches the Electron binary in node_modules so dev mode shows jebi branding.
// Runs automatically after `npm install` via the postinstall script.
const { execSync } = require('child_process')
const { existsSync, copyFileSync } = require('fs')
const path = require('path')

const electronApp = path.join(__dirname, '../node_modules/electron/dist/Electron.app')
const plist = path.join(electronApp, 'Contents/Info.plist')

if (!existsSync(plist)) {
  console.log('[patch-electron] Electron bundle not found, skipping.')
  process.exit(0)
}

const buddy = '/usr/libexec/PlistBuddy'
if (!existsSync(buddy)) {
  console.log('[patch-electron] PlistBuddy not found (non-macOS?), skipping.')
  process.exit(0)
}

try {
  execSync(`${buddy} -c "Set :CFBundleName jebi" "${plist}"`)
  execSync(`${buddy} -c "Set :CFBundleDisplayName jebi" "${plist}"`)
  console.log('[patch-electron] Bundle name patched.')
} catch (e) {
  console.warn('[patch-electron] Failed to patch name:', e.message)
}

// Copy jebi icon over the Electron icon so the dock shows the correct icon.
const srcIcon = path.join(__dirname, '../build/icon.icns')
const destIcon = path.join(electronApp, 'Contents/Resources/electron.icns')
if (existsSync(srcIcon)) {
  try {
    copyFileSync(srcIcon, destIcon)
    console.log('[patch-electron] Icon patched.')
  } catch (e) {
    console.warn('[patch-electron] Failed to patch icon:', e.message)
  }
}

// Flush Launch Services cache so macOS picks up the new icon immediately.
try {
  execSync('/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f ' + electronApp, { stdio: 'ignore' })
} catch {}
