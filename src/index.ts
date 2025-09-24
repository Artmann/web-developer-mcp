import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { chromium, type Browser } from 'playwright'
import { z } from 'zod'

let browserInstance: Browser | null = null

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
