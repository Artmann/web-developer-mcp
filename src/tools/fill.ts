import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function fillHandler({
  selector,
  value
}: {
  selector: string
  value: string
}) {
  try {
    const browserManager = BrowserManager.getInstance()

    // Wait for any ongoing navigation to complete
    await browserManager.waitForNavigationComplete()

    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    // Check if element exists
    const element = await page.$(selector)
    if (!element) {
      return createErrorResponse(
        `No element found matching selector: ${selector}`
      )
    }

    // Fill the input field
    await page.fill(selector, value)

    return createSuccessResponse(
      `Successfully filled element matching selector: ${selector}`
    )
  } catch (error) {
    return createErrorResponse(
      `Failed to fill element with selector '${selector}': ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
