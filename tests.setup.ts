import { beforeEach, afterEach } from 'vitest'
import { BrowserManager } from './src/browser/BrowserManager'

// Global test setup
beforeEach(async () => {
  // Ensure we're in headless mode for tests
  process.env.HEADLESS = 'true'
})

afterEach(async () => {
  // Clean up browser instances after each test
  const browserManager = BrowserManager.getInstance()
  await browserManager.close()
})
