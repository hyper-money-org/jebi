import { FONT_OPTIONS } from './fonts'

export const DEFAULT_PREFS = {
  themeId:            'midnight',
  fontFamily:         FONT_OPTIONS[0].value,
  fontSize:           15,
  uiFontFamily:       'system-ui, sans-serif',
  uiFontSize:         13,
  promptStyleId:      'pill',
  aiExplainErrors:    true,
  aiDirectoryContext: true,
  aiCommandSuggestions: true,
  terminalGrain: true,
  terminalGrainIntensity: 15,
}
