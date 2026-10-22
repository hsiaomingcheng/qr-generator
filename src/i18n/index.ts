import { zhTW, type MessageKey } from './zh-TW'

export type { MessageKey }

// Only zh-TW for now; language detection and switching come in Phase 3.
export function t(key: MessageKey): string {
  return zhTW[key]
}
