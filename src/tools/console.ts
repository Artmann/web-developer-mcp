import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'
import { waitFor } from '../utils/wait-for'

export async function consoleHandler() {
  try {
    const browserManager = BrowserManager.getInstance()

    // Wait for any ongoing navigation to complete
    await browserManager.waitForNavigationComplete()

    // Give JavaScript additional time to execute and generate logs
    await waitFor(1000)

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
