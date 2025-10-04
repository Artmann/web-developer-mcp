import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function networkRequestsHandler({
  filter,
  head,
  statusRange,
  tail
}: {
  filter?: string
  head?: number
  statusRange?: string
  tail?: number
} = {}) {
  try {
    const browserManager = BrowserManager.getInstance()
    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    let requests = browserManager.getNetworkRequests()

    // Apply URL filter if provided
    if (filter) {
      requests = requests.filter((req) => req.url.includes(filter))
    }

    // Apply status range filter if provided (e.g., "400-499", "500-599")
    if (statusRange) {
      const parts = statusRange.split('-').map(Number)

      if (parts.length === 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
        const minStatus = parts[0]!
        const maxStatus = parts[1]!
        requests = requests.filter(
          (req) =>
            req.status && req.status >= minStatus && req.status <= maxStatus
        )
      } else if (parts.length === 1 && !isNaN(parts[0]!)) {
        // Single status code
        const targetStatus = parts[0]!
        requests = requests.filter((req) => req.status === targetStatus)
      }
    }

    // Apply tail or head (tail takes precedence)
    if (tail !== undefined && tail > 0) {
      requests = requests.slice(-tail)
    } else if (head !== undefined && head > 0) {
      requests = requests.slice(0, head)
    }

    if (requests.length === 0) {
      return createSuccessResponse(
        'No network requests found matching the criteria.'
      )
    }

    // Format the output as a summary
    const summary = requests.map((req) => {
      const sizeStr = req.responseSize
        ? `${(req.responseSize / 1024).toFixed(1)}KB`
        : 'N/A'
      const durationStr = req.duration ? `${req.duration}ms` : 'N/A'
      const statusStr = req.error
        ? `ERROR: ${req.error}`
        : req.status
          ? `${req.status} ${req.statusText}`
          : 'Pending'

      return {
        id: req.id,
        method: req.method,
        url: req.url,
        status: statusStr,
        size: sizeStr,
        duration: durationStr,
        timestamp: req.timestamp
      }
    })

    const result = JSON.stringify(
      {
        count: summary.length,
        requests: summary
      },
      null,
      2
    )

    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse(
      `Failed to retrieve network requests: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
