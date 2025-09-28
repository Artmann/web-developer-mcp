import {
  chromium,
  type Browser,
  type Page,
  type ConsoleMessage,
  type Request,
  type Response
} from 'playwright'

export interface NetworkRequest {
  id: string
  method: string
  url: string
  requestHeaders: Record<string, string>
  requestBody?: string
  status?: number
  statusText?: string
  responseHeaders?: Record<string, string>
  responseBody?: string
  responseSize?: number
  duration?: number
  timestamp: string
  error?: string
}

export class BrowserManager {
  private static instance: BrowserManager | null = null
  private browser: Browser | null = null
  private page: Page | null = null
  private consoleBuffer: string[] = []
  private networkRequests: NetworkRequest[] = []
  private requestIdCounter: number = 0

  private constructor() {}

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager()
    }

    return BrowserManager.instance
  }

  async close(): Promise<void> {
    if (!this.browser) {
      return
    }

    await this.browser.close()
    this.browser = null
    this.page = null
    this.consoleBuffer = []
    this.networkRequests = []
  }

  getConsoleLogs(): string[] {
    return this.consoleBuffer
  }

  getPage(): Page | null {
    return this.page
  }

  getNetworkRequests(): NetworkRequest[] {
    return this.networkRequests
  }

  clearNetworkRequests(): void {
    this.networkRequests = []
    this.requestIdCounter = 0
  }

  async launch(): Promise<void> {
    if (this.browser) {
      return
    }

    try {
      console.error('Launching browser...')

      const isHeadless = process.env.HEADLESS === 'true'

      this.browser = await chromium.launch({
        headless: isHeadless,
        timeout: 5_000
      })

      console.error(`Browser launched successfully (headless: ${isHeadless})`)
    } catch (error) {
      console.error('Error launching browser:', error)
      throw error
    }
  }

  async navigate(url: string): Promise<void> {
    console.error(`Navigating to: ${url}`)

    if (!this.browser) {
      await this.launch()
    }

    this.consoleBuffer = []
    this.networkRequests = []
    this.requestIdCounter = 0

    const context = await this.browser!.newContext()

    if (this.page) {
      await this.page.close()
    }

    this.page = await context.newPage()

    this.page.on('console', (msg: ConsoleMessage) => {
      this.consoleBuffer.push(`[${msg.type()}] ${msg.text()}`)
    })

    // Set up network monitoring
    const requestMap = new Map<
      string,
      { startTime: number; networkRequest: NetworkRequest }
    >()

    this.page.on('request', (request: Request) => {
      const id = `req_${++this.requestIdCounter}`
      const networkRequest: NetworkRequest = {
        id,
        method: request.method(),
        url: request.url(),
        requestHeaders: request.headers(),
        timestamp: new Date().toISOString()
      }

      // Try to get request body if it's a POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(request.method())) {
        const postData = request.postData()
        if (postData) {
          networkRequest.requestBody = postData
        }
      }

      requestMap.set(request.url() + request.method(), {
        startTime: Date.now(),
        networkRequest
      })
      this.networkRequests.push(networkRequest)
    })

    this.page.on('response', async (response: Response) => {
      const key = response.url() + response.request().method()
      const requestData = requestMap.get(key)

      if (requestData) {
        const { startTime, networkRequest } = requestData
        networkRequest.status = response.status()
        networkRequest.statusText = response.statusText()
        networkRequest.responseHeaders = response.headers()
        networkRequest.duration = Date.now() - startTime

        // Try to get response body for text-based responses
        try {
          const contentType = response.headers()['content-type'] || ''
          if (
            contentType.includes('json') ||
            contentType.includes('text') ||
            contentType.includes('html') ||
            contentType.includes('xml')
          ) {
            const body = await response.text()
            networkRequest.responseBody = body
            networkRequest.responseSize = Buffer.byteLength(body, 'utf8')
          } else {
            // For binary content, just record the size
            const buffer = await response.body()
            networkRequest.responseSize = buffer.length
          }
        } catch (error) {
          // Response body might not be available for some requests
          console.error('Failed to get response body:', error)
        }
      }
    })

    this.page.on('requestfailed', (request: Request) => {
      const key = request.url() + request.method()
      const requestData = requestMap.get(key)

      if (requestData) {
        const { networkRequest } = requestData
        networkRequest.error = request.failure()?.errorText || 'Request failed'
      }
    })

    await this.page.goto(url)
  }
}
