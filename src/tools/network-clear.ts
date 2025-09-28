import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function networkClearHandler() {
  try {
    const browserManager = BrowserManager.getInstance()
    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    const previousCount = browserManager.getNetworkRequests().length
    browserManager.clearNetworkRequests()

    return createSuccessResponse(
      `Cleared ${previousCount} network request${previousCount !== 1 ? 's' : ''} from the buffer.`
    )
  } catch (error) {
    return createErrorResponse(
      `Failed to clear network requests: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
