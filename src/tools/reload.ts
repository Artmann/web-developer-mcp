import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function reloadHandler() {
  try {
    const browserManager = BrowserManager.getInstance()
    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    // Get the current URL to re-navigate to it with proper state management
    const currentUrl = page.url()
    await browserManager.navigate(currentUrl)

    return createSuccessResponse('Page reloaded successfully')
  } catch (error) {
    return createErrorResponse(
      `Failed to reload page: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
