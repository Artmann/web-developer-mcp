import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'
import { waitFor } from '../utils/wait-for'

export async function consoleHandler({
  filter,
  head,
  tail
}: {
  filter?: string
  head?: number
  tail?: number
} = {}) {
  try {
    const browserManager = BrowserManager.getInstance()

    // Wait for any ongoing navigation to complete
    await browserManager.waitForNavigationComplete()

    // Give JavaScript additional time to execute and generate logs
    await waitFor(1000)

    let consoleLogs = browserManager.getConsoleLogs()

    // Apply filter if provided
    if (filter) {
      consoleLogs = consoleLogs.filter((log) =>
        log.toLowerCase().includes(filter.toLowerCase())
      )
    }

    // Apply tail or head (tail takes precedence)
    if (tail !== undefined && tail > 0) {
      consoleLogs = consoleLogs.slice(-tail)
    } else if (head !== undefined && head > 0) {
      consoleLogs = consoleLogs.slice(0, head)
    }

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
