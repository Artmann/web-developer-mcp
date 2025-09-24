import { BrowserManager } from '../browser/BrowserManager.js'

export async function navigateHandler({ url }: { url: string }) {
  const browserManager = BrowserManager.getInstance()
  await browserManager.navigate(url)

  return {
    content: [{ type: 'text' as const, text: `Navigated to ${url}.` }]
  }
}
