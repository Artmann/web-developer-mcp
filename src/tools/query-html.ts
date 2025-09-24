import { BrowserManager } from '../browser/BrowserManager.js'

export async function queryHtmlHandler({ selector }: { selector: string }) {
  const browserManager = BrowserManager.getInstance()
  const page = browserManager.getPage()

  if (!page) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No page is currently loaded. Please navigate to a page first.'
        }
      ]
    }
  }

  try {
    const htmlElements = await page.$$eval(selector, (els) => {
      return els.map((el) => el.outerHTML)
    })

    if (htmlElements.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No elements found matching selector: ${selector}`
          }
        ]
      }
    }

    const htmlOutput = htmlElements.join('\n\n')

    return {
      content: [
        {
          type: 'text' as const,
          text: htmlOutput
        }
      ]
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error querying HTML: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    }
  }
}
