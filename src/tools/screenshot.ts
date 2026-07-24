import { BrowserManager } from '../browser/BrowserManager'
import { createErrorResponse, createImageResponse } from '../response'

export async function screenshotHandler({
  selector,
  fullPage
}: {
  selector?: string
  fullPage?: boolean
} = {}) {
  try {
    if (selector && fullPage) {
      return createErrorResponse(
        "The 'selector' and 'fullPage' parameters cannot be combined. Provide only one."
      )
    }

    const browserManager = BrowserManager.getInstance()

    // Wait for any ongoing navigation to complete
    await browserManager.waitForNavigationComplete()

    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    if (selector) {
      const element = await page.$(selector)

      if (!element) {
        return createErrorResponse(
          `No element found matching selector: ${selector}`
        )
      }

      const buffer = await page.locator(selector).screenshot({ type: 'png' })

      return createImageResponse(buffer)
    }

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: fullPage ?? false
    })

    return createImageResponse(buffer)
  } catch (error) {
    return createErrorResponse(
      `Failed to capture screenshot${selector ? ` of element matching selector '${selector}'` : ''}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
