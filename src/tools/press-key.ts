import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'
import { waitFor } from '../utils/wait-for'

type KeyAction = 'press' | 'down' | 'up'

export async function pressKeyHandler({
  key,
  action = 'press',
  durationMs
}: {
  key: string
  action?: KeyAction
  durationMs?: number
}) {
  try {
    if (durationMs !== undefined && action !== 'press') {
      return createErrorResponse(
        `The 'durationMs' parameter can only be used with action 'press'. It is not valid with action '${action}'.`
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

    if (action === 'down') {
      await page.keyboard.down(key)

      return createSuccessResponse(`Successfully sent keydown for key: ${key}`)
    }

    if (action === 'up') {
      await page.keyboard.up(key)

      return createSuccessResponse(`Successfully sent keyup for key: ${key}`)
    }

    if (durationMs !== undefined) {
      await page.keyboard.down(key)
      await waitFor(durationMs)
      await page.keyboard.up(key)

      return createSuccessResponse(
        `Successfully held key '${key}' down for ${durationMs}ms`
      )
    }

    await page.keyboard.press(key)

    return createSuccessResponse(`Successfully pressed key: ${key}`)
  } catch (error) {
    return createErrorResponse(
      `Failed to send key '${key}' (action: ${action}): ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
