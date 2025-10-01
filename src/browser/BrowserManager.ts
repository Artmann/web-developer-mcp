import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type ConsoleMessage,
  type Request,
  type Response
} from 'playwright'
import { homedir, platform } from 'os'
import { join } from 'path'
import invariant from 'tiny-invariant'

import { waitFor } from '../utils/wait-for'

export interface BrowserConfig {
  browserType?: 'chrome' | 'chromium'
  headless?: boolean
  sessionType?: 'existing' | 'fresh'
  userDataDir?: string
}

export function createBrowserConfigFromEnv(): BrowserConfig {
  return {
    browserType:
      (process.env.BROWSER_TYPE as 'chrome' | 'chromium') ?? 'chrome',
    headless: process.env.HEADLESS === 'true',
    sessionType:
      (process.env.SESSION_TYPE as 'existing' | 'fresh') ?? 'existing',
    userDataDir: process.env.USER_DATA_DIR
  }
}

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
  private config: BrowserConfig
  private context: BrowserContext | null = null
  private page: Page | null = null
  private consoleBuffer: string[] = []
  private networkRequests: NetworkRequest[] = []
  private requestIdCounter: number = 0
  private isNavigating: boolean = false

  private constructor(config: BrowserConfig = {}) {
    this.config = config
  }

  static getInstance(config: BrowserConfig = {}): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager(config)
    }

    return BrowserManager.instance
  }

  async close(): Promise<void> {
    if (!this.browser && !this.context) {
      return
    }

    if (this.context) {
      await this.context.close()
      this.context = null
    }
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
    this.page = null
    this.consoleBuffer = []
    this.networkRequests = []
    this.isNavigating = false
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

  isNavigationInProgress(): boolean {
    return this.isNavigating
  }

  async waitForNavigationComplete(
    timeoutInMilliseconds: number = 10_000
  ): Promise<void> {
    const startTime = Date.now()
    while (this.isNavigating) {
      if (Date.now() - startTime > timeoutInMilliseconds) {
        throw new Error(
          `Navigation wait timeout reached after ${timeoutInMilliseconds}ms`
        )
      }
      await waitFor(100)
    }
  }

  clearNetworkRequests(): void {
    this.networkRequests = []
    this.requestIdCounter = 0
  }

  private getDefaultChromeUserDataDir(): string | null {
    const platformName = platform()

    if (platformName === 'darwin') {
      return join(
        homedir(),
        'Library',
        'Application Support',
        'Google',
        'Chrome'
      )
    }

    if (platformName === 'linux') {
      return join(homedir(), '.config', 'google-chrome')
    }

    if (platformName === 'win32') {
      return join(
        process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'),
        'Google',
        'Chrome',
        'User Data'
      )
    }

    return null
  }

  async launch(): Promise<void> {
    if (this.browser || this.context) {
      return
    }

    try {
      console.error('Launching browser...')

      const browserType = this.config.browserType ?? 'chrome'
      const sessionType = this.config.sessionType ?? 'existing'
      const isHeadless = this.config.headless ?? false

      if (sessionType === 'existing') {
        const userDataDir =
          this.config.userDataDir ?? this.getDefaultChromeUserDataDir()

        if (!userDataDir) {
          throw new Error(
            'Could not determine Chrome user data directory for this platform.'
          )
        }

        console.error(`Launching with persistent context: ${userDataDir}.`)

        this.context = await chromium.launchPersistentContext(userDataDir, {
          channel: browserType === 'chrome' ? 'chrome' : undefined,
          headless: isHeadless,
          timeout: 5_000
        })

        console.error(
          `Browser launched successfully with persistent context (headless: ${isHeadless}).`
        )
      } else {
        console.error('Launching fresh browser instance.')

        this.browser = await chromium.launch({
          channel: browserType === 'chrome' ? 'chrome' : undefined,
          headless: isHeadless,
          timeout: 5_000
        })

        console.error(`Browser launched successfully (headless: ${isHeadless})`)
      }
    } catch (error) {
      console.error('Error launching browser:', error)
      throw error
    }
  }

  async navigate(url: string): Promise<void> {
    console.error(`Navigating to: ${url}`)

    if (!this.browser && !this.context) {
      await this.launch()
    }

    this.isNavigating = true
    this.consoleBuffer = []
    this.networkRequests = []
    this.requestIdCounter = 0

    let context: BrowserContext

    if (this.context) {
      context = this.context
    } else {
      invariant(this.browser, 'A browser instance is required.')
      context = await this.browser.newContext()
    }

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

    try {
      await this.page.goto(url, { waitUntil: 'networkidle' })

      // Wait additional time for JavaScript execution and console logs
      await waitFor(1000)
    } finally {
      this.isNavigating = false
    }
  }
}
