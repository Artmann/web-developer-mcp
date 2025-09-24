import {
  chromium,
  type Browser,
  type Page,
  type ConsoleMessage
} from 'playwright'

export class BrowserManager {
  private static instance: BrowserManager | null = null
  private browser: Browser | null = null
  private page: Page | null = null
  private consoleBuffer: string[] = []

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
  }

  getConsoleLogs(): string[] {
    return this.consoleBuffer
  }

  getPage(): Page | null {
    return this.page
  }

  async launch(): Promise<void> {
    if (this.browser) {
      return
    }

    try {
      console.error('Launching browser...')

      this.browser = await chromium.launch({
        headless: false,
        timeout: 5_000
      })

      console.error('Browser launched successfully')
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

    const context = await this.browser!.newContext()

    if (this.page) {
      await this.page.close()
    }

    this.page = await context.newPage()

    this.page.on('console', (msg: ConsoleMessage) => {
      this.consoleBuffer.push(`[${msg.type()}] ${msg.text()}`)
    })

    await this.page.goto(url)
  }
}
