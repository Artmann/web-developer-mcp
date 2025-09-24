import { BrowserManager } from '../browser/BrowserManager.js'

interface DOMElement {
  attributes: Record<string, string>
  className: string | null
  id: string | null
  innerHTML: string
  isVisible: boolean
  position: {
    height: number
    width: number
    x: number
    y: number
  }
  styles: {
    backgroundColor: string
    color: string
    display: string
    fontSize: string
    fontWeight: string
    opacity: string
    position: string
    visibility: string
    zIndex: string
  }
  tagName: string
  textContent: string | null
}

export async function queryDomHandler({ selector }: { selector: string }) {
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
    const elements = await page.$$eval(selector, (els): DOMElement[] => {
      return els.map((el): DOMElement => {
        const computedStyle = (globalThis as any).getComputedStyle(el)
        const rect = el.getBoundingClientRect()

        return {
          attributes: Array.from(el.attributes).reduce(
            (acc: Record<string, string>, attr: any) => {
              acc[attr.name] = attr.value
              return acc
            },
            {}
          ),
          className: el.className || null,
          id: el.id || null,
          innerHTML: el.innerHTML.substring(0, 200),
          isVisible:
            rect.width > 0 &&
            rect.height > 0 &&
            computedStyle.visibility !== 'hidden' &&
            computedStyle.display !== 'none',
          position: {
            height: rect.height,
            width: rect.width,
            x: rect.x,
            y: rect.y
          },
          styles: {
            backgroundColor: computedStyle.backgroundColor,
            color: computedStyle.color,
            display: computedStyle.display,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight,
            opacity: computedStyle.opacity,
            position: computedStyle.position,
            visibility: computedStyle.visibility,
            zIndex: computedStyle.zIndex
          },
          tagName: el.tagName.toLowerCase(),
          textContent: el.textContent?.trim().substring(0, 100) || null
        }
      })
    })

    if (elements.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No elements found matching selector: ${selector}`
          }
        ]
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              selector,
              count: elements.length,
              elements: elements
            },
            null,
            2
          )
        }
      ]
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error querying DOM elements: ${error instanceof Error ? error.message : String(error)}`
        }
      ]
    }
  }
}
