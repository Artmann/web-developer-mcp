import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function clickHandler({ selector }: { selector: string }) {
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

    // Click the element and wait for potential navigation
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {
        // Ignore timeout - element might not trigger navigation
      }),
      page.click(selector)
    ])

    // Wait additional time for JavaScript execution
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return createSuccessResponse(
      `Successfully clicked element matching selector: ${selector}`
    )
  } catch (error) {
    return createErrorResponse(
      `Failed to click element with selector '${selector}': ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
