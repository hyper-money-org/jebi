import { THEMES } from './themes'
import { FONT_OPTIONS } from './fonts'
import { SEGMENT_DEFINITIONS } from './segments'

export const DEFAULT_PREFS = {
  themeId:            'default',
  customColors:       { ...THEMES['default'].colors },
  fontFamily:         FONT_OPTIONS[0].value,
  fontSize:           15,
  uiFontFamily:       'system-ui, sans-serif',
  uiFontSize:         13,
  promptStyleId:      'pill',
  aiExplainErrors:    true,
  aiDirectoryContext: true,
  aiCommandSuggestions: true,
  promptSegments:     Object.fromEntries(SEGMENT_DEFINITIONS.map(s => [s.id, s.defaultEnabled])),
}
