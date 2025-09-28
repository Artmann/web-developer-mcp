import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { navigateHandler } from './tools/navigate'
import { reloadHandler } from './tools/reload'
import { consoleHandler } from './tools/console'
import { queryDomHandler } from './tools/query-dom'
import { queryHtmlHandler } from './tools/query-html'
import { networkRequestsHandler } from './tools/network-requests'
import { networkInspectHandler } from './tools/network-inspect'
import { networkClearHandler } from './tools/network-clear'

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

    this.mcpServer.registerTool(
      'network-requests',
      {
        title: 'List Network Requests',
        description:
          'List all network requests captured since page load with optional filtering by URL or status codes',
        inputSchema: {
          filter: z
            .string()
            .optional()
            .describe(
              'Filter requests by URL substring (e.g. "api", "/users")'
            ),
          statusRange: z
            .string()
            .optional()
            .describe(
              'Filter by HTTP status code range (e.g. "400-499", "500-599") or single status (e.g. "404")'
            )
        }
      },
      networkRequestsHandler
    )

    this.mcpServer.registerTool(
      'network-inspect',
      {
        title: 'Inspect Network Request',
        description:
          'Get detailed information about a specific network request including headers, body, and response data',
        inputSchema: {
          id: z
            .string()
            .optional()
            .describe('Request ID from network-requests output'),
          urlPattern: z
            .string()
            .optional()
            .describe('URL pattern to find the most recent matching request')
        }
      },
      networkInspectHandler
    )

    this.mcpServer.registerTool(
      'network-clear',
      {
        title: 'Clear Network Requests',
        description:
          'Clear the network request buffer to start fresh monitoring'
      },
      networkClearHandler
    )
  }

  async start() {
    console.error('Starting MCP server...')

    const transport = new StdioServerTransport()

    await this.mcpServer.connect(transport)

    console.error('MCP server connected')
  }
}
