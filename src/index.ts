import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { chromium, type Browser } from 'playwright'
import { z } from 'zod'

let browserInstance: Browser | null = null

async function getBrowserInstance(): Promise<Browser> {
  if (!browserInstance) {
    try {
      console.log('Launching browser...')

      browserInstance = await chromium.launch({
        headless: false,
        timeout: 2_000
      })

      console.log('Browser launched successfully')
    } catch (error) {
      console.error('Error launching browser:', error)

      throw error
    }
  }

  return browserInstance
}

async function visitPage(url: string) {
  console.log(`Visiting page: ${url}`)
  const browser = await getBrowserInstance()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(url)
}

async function main() {
  console.log('Starting MCP server...')
  await visitPage('https://example.com')

  // const server = new McpServer({
  //   name: 'demo-server',
  //   version: '1.0.0'
  // })

  // server.registerTool(
  //   'navigate-to-page',
  //   {
  //     title: 'Navigate to Page',
  //     description: 'Navigate to a specific page',
  //     inputSchema: { url: z.string() }
  //   },
  //   async ({ url }) => {
  //     await visitPage(url)

  //     return {
  //       content: [{ type: 'text', text: `Navigated to ${url}.` }]
  //     }
  //   }
  // )

  // const transport = new StdioServerTransport()

  //await server.connect(transport)
}

main()
  .catch((error) => {
    console.error(error)

    process.exit(1)
  })
  .finally(async () => {
    const browser = await getBrowserInstance()

    if (browser) {
      await browser.close()
    }
  })
