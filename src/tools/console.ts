import { BrowserManager } from '../browser/BrowserManager.js'

export async function consoleHandler() {
  const browserManager = BrowserManager.getInstance()
  const consoleLogs = browserManager.getConsoleLogs()

  return {
    content: [
      {
        type: 'text' as const,
        text:
          consoleLogs.length > 0
            ? consoleLogs.join('\n')
            : 'No console logs available.'
      }
    ]
  }
}
