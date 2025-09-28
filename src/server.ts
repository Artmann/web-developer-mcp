import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { navigateHandler } from './tools/navigate'
import { reloadHandler } from './tools/reload'
import { consoleHandler } from './tools/console'
import { queryDomHandler } from './tools/query-dom'
import { queryHtmlHandler } from './tools/query-html'

export class Server {
  private mcpServer: McpServer

  constructor() {
    this.mcpServer = new McpServer({
      name: 'webdev-mcp',
      version: '1.0.0'
    })
    this.registerTools()
  }

  private registerTools() {
    this.mcpServer.registerTool(
      'browser-navigate',
      {
        title: 'Navigate Browser',
        description:
          'Navigate the browser to a specific URL and start monitoring the page',
        inputSchema: { url: z.string().describe('The URL to navigate to') }
      },
      navigateHandler
    )

    this.mcpServer.registerTool(
      'browser-reload',
      {
        title: 'Reload Page',
        description: 'Reload the current page and refresh console logs'
      },
      reloadHandler
    )

    this.mcpServer.registerTool(
      'browser-console',
      {
        title: 'Get Console Output',
        description:
          'Retrieve all console messages (logs, errors, warnings) from the current page'
      },
      consoleHandler
    )

    this.mcpServer.registerTool(
      'inspect-elements',
      {
        title: 'Inspect DOM Elements',
        description:
          'Get detailed information about DOM elements including styles, position, visibility, and attributes',
        inputSchema: {
          selector: z
            .string()
            .describe(
              'CSS selector to query elements (e.g. ".button", "#header", "div[data-test]")'
            )
        }
      },
      queryDomHandler
    )

    this.mcpServer.registerTool(
      'extract-html',
      {
        title: 'Extract HTML',
        description:
          'Extract raw HTML markup of elements for testing or analysis (similar to React Testing Library queries)',
        inputSchema: {
          selector: z
            .string()
            .describe(
              'CSS selector to extract HTML from (e.g. ".alert", "[role=dialog]")'
            )
        }
      },
      queryHtmlHandler
    )
  }

  async start() {
    console.error('Starting MCP server...')

    const transport = new StdioServerTransport()
    
    await this.mcpServer.connect(transport)
    
    console.error('MCP server connected')
  }
}
