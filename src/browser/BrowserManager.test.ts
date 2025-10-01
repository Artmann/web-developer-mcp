import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BrowserManager } from './BrowserManager'

describe('BrowserManager', () => {
  let browserManager: BrowserManager

  beforeAll(() => {
    browserManager = BrowserManager.getInstance({
      browserType: 'chromium',
      headless: true,
      sessionType: 'fresh'
    })
  })

  afterAll(async () => {
    await browserManager.close()
  })

  describe('launch configuration', () => {
    it('should launch browser successfully', async () => {
      await browserManager.launch()
      expect(browserManager).toBeDefined()
    })
  })

  describe('navigation', () => {
    it('should navigate successfully', async () => {
      const htmlContent = `<!DOCTYPE html>
<html><body><h1>Test</h1></body></html>`

      const url = `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
      await browserManager.navigate(url)

      const page = browserManager.getPage()
      expect(page).not.toBeNull()
      expect(page?.url()).toBe(url)
    })

    it('should capture console logs', async () => {
      const htmlContent = `<!DOCTYPE html>
<html><body><script>console.log('Test message');</script></body></html>`

      const url = `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
      await browserManager.navigate(url)

      const logs = browserManager.getConsoleLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some((log) => log.includes('Test message'))).toBe(true)
    })

    it('should clear logs on new navigation', async () => {
      const url1 = `data:text/html;base64,${Buffer.from('<html><body><script>console.log("Page 1");</script></body></html>').toString('base64')}`
      const url2 = `data:text/html;base64,${Buffer.from('<html><body><script>console.log("Page 2");</script></body></html>').toString('base64')}`

      await browserManager.navigate(url1)
      const logs1 = browserManager.getConsoleLogs()
      expect(logs1.some((log) => log.includes('Page 1'))).toBe(true)

      await browserManager.navigate(url2)
      const logs2 = browserManager.getConsoleLogs()
      expect(logs2.some((log) => log.includes('Page 1'))).toBe(false)
      expect(logs2.some((log) => log.includes('Page 2'))).toBe(true)
    })
  })

  describe('network monitoring', () => {
    it('should track network requests', async () => {
      const url = `data:text/html;base64,${Buffer.from('<html><body><h1>Test</h1></body></html>').toString('base64')}`
      await browserManager.navigate(url)

      const requests = browserManager.getNetworkRequests()
      expect(Array.isArray(requests)).toBe(true)
      expect(requests.every((req) => req.id.startsWith('req_'))).toBe(true)
    })
  })
})
