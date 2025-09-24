# WebDev MCP Server

A Model Context Protocol (MCP) server that provides web development tools
through a Playwright-powered browser. This server allows AI assistants to
inspect web pages, extract HTML, monitor console output, and analyze DOM
elements in real-time.

Perfect for debugging web applications, testing UI components, and analyzing
page behavior during development.

## Features

- **Live Browser Integration**: Uses Playwright with a persistent browser
  session
- **Real-time Monitoring**: Captures console logs, errors, and warnings as they
  happen
- **DOM Inspection**: Deep analysis of elements including styles, positioning,
  and visibility
- **HTML Extraction**: Raw markup extraction similar to React Testing Library
  queries

## Available Tools

### `browser-navigate`

Navigate the browser to a specific URL and start monitoring the page.

**Parameters:**

- `url` (string): The URL to navigate to

**Example:** Navigate to `http://localhost:3000`

### `browser-reload`

Reload the current page and refresh console logs.

**No parameters required**

**Use case:** Refresh the page after code changes or to clear current state

### `browser-console`

Retrieve all console messages (logs, errors, warnings) from the current page.

**No parameters required**

**Returns:** All console output captured since navigation

### `inspect-elements`

Get detailed information about DOM elements including styles, position,
visibility, and attributes.

**Parameters:**

- `selector` (string): CSS selector to query elements (e.g. ".button",
  "#header", "div[data-test]")

**Returns:** JSON with element details including:

- Tag name, ID, class names
- All HTML attributes
- Position and dimensions
- Computed styles (colors, fonts, display, etc.)
- Visibility status

### `extract-html`

Extract raw HTML markup of elements for testing or analysis (similar to React
Testing Library queries).

**Parameters:**

- `selector` (string): CSS selector to extract HTML from (e.g. ".alert",
  "[role=dialog]")

**Returns:** Raw HTML markup of matching elements

## Installation

```bash
bun install
```

## Usage

Start the MCP server:

```bash
bun start
```

Or run with development monitoring:

```bash
bun run src/index.ts
```

## Development

Type checking:

```bash
bun run typecheck
```

Format code:

```bash
bun run format
```

## Architecture

- `src/index.ts` - Entry point with error handling and graceful shutdown
- `src/server.ts` - MCP server setup and tool registration
- `src/browser/BrowserManager.ts` - Singleton browser management with Playwright
- `src/tools/` - Individual tool implementations

Built with TypeScript, Playwright, and the MCP SDK.
