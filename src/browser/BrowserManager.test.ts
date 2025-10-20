import { describe, it, expect, beforeEach } from 'vitest'
import { BrowserManager } from './BrowserManager'

describe('BrowserManager Persistence', () => {
  let browserManager: BrowserManager

  beforeEach(async () => {
    browserManager = BrowserManager.getInstance()
    // Ensure browser is closed before each test
    await browserManager.close()
  })

  it('should default to persistent mode', () => {
    expect(browserManager.isPersistentMode()).toBe(true)
  })

  it('should allow setting ephemeral mode', () => {
    browserManager.setPersistent(false)
    expect(browserManager.isPersistentMode()).toBe(false)
  })

  it('should allow setting persistent mode', () => {
    browserManager.setPersistent(false)
    browserManager.setPersistent(true)
    expect(browserManager.isPersistentMode()).toBe(true)
  })

  it('should throw error when trying to change persistence while browser is running', async () => {
    await browserManager.launch()

    expect(() => {
      browserManager.setPersistent(false)
    }).toThrow(
      'Cannot change persistence mode while browser is running. Call close() first.'
    )

    await browserManager.close()
  })

  it('should create instance with specified persistence mode', async () => {
    const ephemeralManager = await BrowserManager.createInstance(false)
    expect(ephemeralManager.isPersistentMode()).toBe(false)

    const persistentManager = await BrowserManager.createInstance(true)
    expect(persistentManager.isPersistentMode()).toBe(true)

    await ephemeralManager.close()
  })

  it('should close existing browser when changing persistence via createInstance', async () => {
    // Start with persistent mode
    const manager1 = await BrowserManager.createInstance(true)
    await manager1.launch()
    expect(manager1.isPersistentMode()).toBe(true)

    // Switch to ephemeral mode - should close existing browser
    const manager2 = await BrowserManager.createInstance(false)
    expect(manager2.isPersistentMode()).toBe(false)

    // Both should be the same instance (singleton)
    expect(manager1).toBe(manager2)

    await manager2.close()
  })
})
