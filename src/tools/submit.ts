import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function submitHandler({ selector }: { selector: string }) {
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

    // Verify it's a form element
    const isForm = await page.locator(selector).evaluate((el: any) => {
      return el.tagName.toLowerCase() === 'form'
    })

    if (!isForm) {
      return createErrorResponse('Element is not a form')
    }

    // Submit the form by finding and clicking the submit button
    // or dispatching a submit event if no button found
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {
        // Ignore timeout - form might not trigger navigation
      }),
      page.locator(selector).evaluate((form: any) => {
        // Try to find and click a submit button
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]')
        if (submitButton) {
          submitButton.click()
        } else {
          // If no submit button, dispatch the submit event
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        }
      })
    ])

    // Wait additional time for JavaScript execution
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return createSuccessResponse(
      `Successfully submitted form matching selector: ${selector}`
    )
  } catch (error) {
    return createErrorResponse(
      `Failed to submit form with selector '${selector}': ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
