import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function consoleHandler() {
  try {
    const browserManager = BrowserManager.getInstance()
    const consoleLogs = browserManager.getConsoleLogs()

    const text =
      consoleLogs.length > 0
        ? consoleLogs.join('\n')
        : 'No console logs available.'

    return createSuccessResponse(text)
  } catch (error) {
    return createErrorResponse(
      `Failed to retrieve console logs: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
