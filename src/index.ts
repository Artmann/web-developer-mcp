import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { chromium, type Browser, type Page } from 'playwright'
import { z } from 'zod'

let browserInstance: Browser | null = null
let currentPage: Page | null = null

async function getBrowserInstance(): Promise<Browser> {
  if (!browserInstance) {
    try {
      console.error('Launching browser...')

      browserInstance = await chromium.launch({
        headless: false,
        timeout: 5_000
      })

      console.error('Browser launched successfully')
    } catch (error) {
      console.error('Error launching browser:', error)

      throw error
    }
  }

  return browserInstance
}

let consoleBuffer: string[] = []

async function visitPage(url: string) {
  console.error(`Visiting page: ${url}`)

  consoleBuffer = []

  const browser = await getBrowserInstance()
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg) => {
    consoleBuffer.push(`[${msg.type()}] ${msg.text()}`)
  })

  await page.goto(url)
  currentPage = page
}

async function main() {
  console.error('Starting MCP server...')

  const server = new McpServer({
    name: 'demo-server',
    version: '1.0.0'
  })

  server.registerTool(
    'navigate-to-page',
    {
      title: 'Navigate to Page',
      description: 'Navigate to a specific page',
      inputSchema: { url: z.string() }
    },
    async ({ url }) => {
      await visitPage(url)

      return {
        content: [{ type: 'text', text: `Navigated to ${url}.` }]
      }
    }
  )

  server.registerTool(
    'read-console-logs',
    {
      title: 'Read Console Logs',
      description: 'Read console logs from the current page'
    },
    async () => {
      return {
        content: [
          {
            type: 'text',
            text:
              consoleBuffer && consoleBuffer.length > 0
                ? consoleBuffer.join('\n')
                : 'No console logs available.'
          }
        ]
      }
    }
  )

  server.registerTool(
    'query-dom-elements',
    {
      title: 'Query DOM Elements',
      description: 'Query DOM elements using a CSS selector',
      inputSchema: { selector: z.string() }
    },
    async ({ selector }) => {
      if (!currentPage) {
        return {
          content: [{ type: 'text', text: 'No page is currently loaded. Please navigate to a page first.' }]
        }
      }

      try {
        const elements = await currentPage.$$eval(selector, (els) => {
          return els.map(el => {
            const computedStyle = window.getComputedStyle(el)
            const rect = el.getBoundingClientRect()
            
            return {
              tagName: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className || null,
              textContent: el.textContent?.trim().substring(0, 100) || null,
              innerHTML: el.innerHTML.substring(0, 200),
              attributes: Array.from(el.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value
                return acc
              }, {} as Record<string, string>),
              position: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
              },
              styles: {
                display: computedStyle.display,
                position: computedStyle.position,
                color: computedStyle.color,
                backgroundColor: computedStyle.backgroundColor,
                fontSize: computedStyle.fontSize,
                fontWeight: computedStyle.fontWeight,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                zIndex: computedStyle.zIndex
              },
              isVisible: rect.width > 0 && rect.height > 0 && computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none'
            }
          })
        })

        if (elements.length === 0) {
          return {
            content: [{ type: 'text', text: `No elements found matching selector: ${selector}` }]
          }
        }

        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              selector,
              count: elements.length,
              elements: elements
            }, null, 2)
          }]
        }
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error querying DOM elements: ${error instanceof Error ? error.message : String(error)}` 
          }]
        }
      }
    }
  )

  server.registerTool(
    'query-html',
    {
      title: 'Query HTML',
      description: 'Get the raw HTML of elements matching a CSS selector',
      inputSchema: { selector: z.string() }
    },
    async ({ selector }) => {
      if (!currentPage) {
        return {
          content: [{ type: 'text', text: 'No page is currently loaded. Please navigate to a page first.' }]
        }
      }

      try {
        const htmlElements = await currentPage.$$eval(selector, (els) => {
          return els.map(el => el.outerHTML)
        })

        if (htmlElements.length === 0) {
          return {
            content: [{ type: 'text', text: `No elements found matching selector: ${selector}` }]
          }
        }

        const htmlOutput = htmlElements.join('\n\n')

        return {
          content: [{ 
            type: 'text', 
            text: htmlOutput
          }]
        }
      } catch (error) {
        return {
          content: [{ 
            type: 'text', 
            text: `Error querying HTML: ${error instanceof Error ? error.message : String(error)}` 
          }]
        }
      }
    }
  )

  const transport = new StdioServerTransport()

  await server.connect(transport)
}

main().catch((error) => {
  console.error(error)

  process.exit(1)
})
// .finally(async () => {
//   console.error('Shutting down the browser.')
//   const browser = await getBrowserInstance()

//   if (browser) {
//     await browser.close()
//   }
// })
