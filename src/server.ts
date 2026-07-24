import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { clickHandler } from './tools/click'
import { consoleHandler } from './tools/console'
import { fillHandler } from './tools/fill'
import { navigateHandler } from './tools/navigate'
import { networkClearHandler } from './tools/network-clear'
import { networkInspectHandler } from './tools/network-inspect'
import { networkRequestsHandler } from './tools/network-requests'
import { pressKeyHandler } from './tools/press-key'
import { queryDomHandler } from './tools/query-dom'
import { queryHtmlHandler } from './tools/query-html'
import { reloadHandler } from './tools/reload'
import { screenshotHandler } from './tools/screenshot'
import { submitHandler } from './tools/submit'

export class Server {
  private mcpServer: McpServer

  constructor() {
    this.mcpServer = new McpServer({
      name: 'web-developer-mcp',
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
          'Retrieve all console messages (logs, errors, warnings) from the current page',
        inputSchema: {
          filter: z
            .string()
            .optional()
            .describe(
              'Filter console logs by text content (case-insensitive substring match)'
            ),
          head: z
            .number()
            .positive()
            .optional()
            .describe('Return only the first N console logs'),
          tail: z
            .number()
            .positive()
            .optional()
            .describe(
              'Return only the last N console logs (takes precedence over head if both provided)'
            )
        }
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
      'browser-screenshot',
      {
        title: 'Capture Screenshot',
        description:
          'Capture a PNG screenshot of the current page for visual verification of canvas, WebGL, layout, or animation state that DOM inspection cannot show. Captures the viewport by default, the full scrollable page with fullPage, or a single element with selector.',
        inputSchema: {
          selector: z
            .string()
            .optional()
            .describe(
              'CSS selector for a single element to screenshot (e.g. "canvas.game", "#chart"). Cannot be combined with fullPage=true.'
            ),
          fullPage: z
            .boolean()
            .optional()
            .describe(
              'Capture the full scrollable page instead of only the visible viewport. Defaults to false. Cannot be combined with selector.'
            )
        }
      },
      screenshotHandler
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
          head: z
            .number()
            .positive()
            .optional()
            .describe('Return only the first N network requests'),
          statusRange: z
            .string()
            .optional()
            .describe(
              'Filter by HTTP status code range (e.g. "400-499", "500-599") or single status (e.g. "404")'
            ),
          tail: z
            .number()
            .positive()
            .optional()
            .describe(
              'Return only the last N network requests (takes precedence over head if both provided)'
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

    this.mcpServer.registerTool(
      'click-element',
      {
        title: 'Click Element',
        description:
          'Click on an element (button, link, etc.) using a CSS selector',
        inputSchema: {
          selector: z
            .string()
            .describe(
              'CSS selector for the element to click (e.g. "button.submit", "#login-btn")'
            )
        }
      },
      clickHandler
    )

    this.mcpServer.registerTool(
      'fill-input',
      {
        title: 'Fill Input Field',
        description: 'Fill a form input field with text',
        inputSchema: {
          selector: z
            .string()
            .describe(
              'CSS selector for the input element (e.g. "input[name=email]", "#username")'
            ),
          value: z.string().describe('The text value to enter into the field')
        }
      },
      fillHandler
    )

    this.mcpServer.registerTool(
      'press-key',
      {
        title: 'Press Key',
        description:
          'Simulate keyboard input on the page: a full key press (keydown+keyup), an isolated keydown or keyup (to hold a key across multiple tool calls, e.g. holding two keys simultaneously), or a timed hold of a specific duration. Sends events to whichever element currently has focus (click an element first if needed).',
        inputSchema: {
          key: z
            .string()
            .describe(
              'Playwright key name to send, e.g. "a", "ArrowUp", "Escape", "Shift+A". Combo syntax ("+") is only supported with action "press", not "down"/"up".'
            ),
          action: z
            .enum(['press', 'down', 'up'])
            .optional()
            .describe(
              "Type of key event to send. 'press' (default) sends keydown+keyup. 'down' sends only keydown, leaving the key held until a matching 'up' call. 'up' sends only keyup."
            ),
          durationMs: z
            .number()
            .positive()
            .optional()
            .describe(
              "Hold the key down for this many milliseconds before releasing (only valid with action 'press' or when action is omitted; errors if combined with action 'down' or 'up')"
            )
        }
      },
      pressKeyHandler
    )

    this.mcpServer.registerTool(
      'submit-form',
      {
        title: 'Submit Form',
        description: 'Submit a form element',
        inputSchema: {
          selector: z
            .string()
            .describe(
              'CSS selector for the form element (e.g. "form#login", "form[name=contact]")'
            )
        }
      },
      submitHandler
    )
  }

  async start() {
    console.error('Starting MCP server...')

    const transport = new StdioServerTransport()

    await this.mcpServer.connect(transport)

    console.error('MCP server connected')
  }
}
