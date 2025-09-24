import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function navigateHandler({ url }: { url: string }) {
  try {
    const browserManager = BrowserManager.getInstance()
    await browserManager.navigate(url)

    return createSuccessResponse(`Successfully navigated to ${url}`)
  } catch (error) {
    return createErrorResponse(
      `Failed to navigate to ${url}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
