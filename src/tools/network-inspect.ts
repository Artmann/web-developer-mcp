import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function networkInspectHandler({
  id,
  urlPattern
}: {
  id?: string
  urlPattern?: string
}) {
  try {
    const browserManager = BrowserManager.getInstance()
    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    const requests = browserManager.getNetworkRequests()

    if (requests.length === 0) {
      return createSuccessResponse('No network requests have been captured.')
    }

    // Find the request by ID or URL pattern
    let targetRequest = null

    if (id) {
      targetRequest = requests.find((req) => req.id === id)
    } else if (urlPattern) {
      // Find the most recent request matching the pattern
      targetRequest = requests
        .filter((req) => req.url.includes(urlPattern))
        .pop()
    } else {
      return createErrorResponse(
        'Please provide either an ID or URL pattern to inspect a request.'
      )
    }

    if (!targetRequest) {
      const identifier = id ? `ID ${id}` : `URL pattern "${urlPattern}"`
      return createErrorResponse(
        `No network request found matching ${identifier}.`
      )
    }

    // Format detailed output
    const details: any = {
      id: targetRequest.id,
      method: targetRequest.method,
      url: targetRequest.url,
      timestamp: targetRequest.timestamp
    }

    // Request details
    details.request = {
      headers: targetRequest.requestHeaders
    }

    if (targetRequest.requestBody) {
      // Try to parse JSON if possible
      try {
        details.request.body = JSON.parse(targetRequest.requestBody)
      } catch {
        details.request.body = targetRequest.requestBody
      }
    }

    // Response details
    if (targetRequest.status) {
      details.response = {
        status: targetRequest.status,
        statusText: targetRequest.statusText,
        headers: targetRequest.responseHeaders,
        size: targetRequest.responseSize
          ? `${(targetRequest.responseSize / 1024).toFixed(2)} KB`
          : undefined,
        duration: targetRequest.duration
          ? `${targetRequest.duration}ms`
          : undefined
      }

      if (targetRequest.responseBody) {
        // Try to parse JSON if possible
        try {
          details.response.body = JSON.parse(targetRequest.responseBody)
        } catch {
          // For HTML/XML/text, truncate if too long
          if (targetRequest.responseBody.length > 5000) {
            details.response.body =
              targetRequest.responseBody.substring(0, 5000) +
              '\n... (truncated, ' +
              targetRequest.responseBody.length +
              ' total characters)'
          } else {
            details.response.body = targetRequest.responseBody
          }
        }
      }
    } else if (targetRequest.error) {
      details.error = targetRequest.error
    } else {
      details.status = 'Pending (no response yet)'
    }

    const result = JSON.stringify(details, null, 2)

    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse(
      `Failed to inspect network request: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
