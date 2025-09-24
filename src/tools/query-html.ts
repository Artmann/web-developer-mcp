import { BrowserManager } from '../browser/BrowserManager.js'
import { createSuccessResponse, createErrorResponse } from '../response.js'

export async function queryHtmlHandler({ selector }: { selector: string }) {
  try {
    const browserManager = BrowserManager.getInstance()
    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    const htmlElements = await page.$$eval(selector, (els) => {
      return els.map((el) => el.outerHTML)
    })

    if (htmlElements.length === 0) {
      return createSuccessResponse(
        `No elements found matching selector: ${selector}`
      )
    }

    const htmlOutput = htmlElements.join('\n\n')
    return createSuccessResponse(htmlOutput)
  } catch (error) {
    return createErrorResponse(
      `Failed to extract HTML with selector '${selector}': ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
