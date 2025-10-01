# Web Developer MCP Server

![NPM Version](https://img.shields.io/npm/v/web-developer-mcp)
[![CI](https://github.com/Artmann/web-developer-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Artmann/web-developer-mcp/actions/workflows/ci.yml)
[![Lint & Format](https://github.com/Artmann/web-developer-mcp/actions/workflows/lint.yml/badge.svg)](https://github.com/Artmann/web-developer-mcp/actions/workflows/lint.yml)
[![Cross-Platform Tests](https://github.com/Artmann/web-developer-mcp/actions/workflows/cross-platform.yml/badge.svg)](https://github.com/Artmann/web-developer-mcp/actions/workflows/cross-platform.yml)

A Model Context Protocol (MCP) server that provides web development tools for
coding AI assistants like **Claude Code**, **Cursor**, and other AI-powered
development environments. This server enables AI assistants to inspect web
pages, monitor network requests, extract HTML, analyze console output, and
examine DOM elements in real-time through a Playwright-powered browser.

Perfect for debugging web applications, testing UI components, analyzing API
behavior, and understanding page behavior during development.

## Why Use This?

When working with AI coding assistants, you often need to:

- Debug web applications and understand what's happening in the browser
- Analyze network requests and API responses
- Inspect DOM elements and their properties
- Monitor console logs and errors
- Extract HTML for testing or analysis

This MCP server provides your AI assistant with direct browser access to help
with these tasks.

## Features

- **Live Browser Integration**: Uses Playwright with a persistent browser
  session
- **Network Request Monitoring**: Capture and analyze HTTP requests/responses
- **Real-time Console Monitoring**: Captures console logs, errors, and warnings
  as they happen
- **DOM Inspection**: Deep analysis of elements including styles, positioning,
  and visibility
- **HTML Extraction**: Raw markup extraction similar to React Testing Library
  queries

## Installation

Add this server to your AI assistant's MCP configuration (see
[Configuration](#configuration) section below for specific setup instructions).

### From Source

```bash
git clone https://github.com/Artmann/web-developer-mcp.git
cd web-developer-mcp
bun install
```

## Usage

Start the MCP server:

```bash
bun start
```

The server will start and wait for MCP client connections from your AI
assistant.

## Configuration

### Environment Variables

The server can be configured with the following environment variables:

#### `BROWSER_TYPE` (default: `"chrome"`)

- `"chrome"` - Use system-installed Chrome
- `"chromium"` - Use Playwright's bundled Chromium

#### `SESSION_TYPE` (default: `"existing"`)

- `"existing"` - Reuse existing Chrome profile with cookies and session data
  (skips authentication flows). **Note:** Chrome must be closed before starting
  the server to use this mode, as Chrome locks the profile when running.
- `"fresh"` - Start with fresh session (no cookies, local storage, or session
  data)

#### `USER_DATA_DIR` (optional)

Custom path to Chrome user data directory. If not set, uses platform-specific
defaults:

- **macOS**: `~/Library/Application Support/Google/Chrome`
- **Linux**: `~/.config/google-chrome`
- **Windows**: `%LOCALAPPDATA%\Google\Chrome\User Data`

#### `HEADLESS` (default: `"false"`)

- `"true"` - Run browser in headless mode (no visible window)
- `"false"` - Run browser with visible window

### AI Assistant Configuration

Add this server to your AI assistant's MCP configuration:

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=web-developer-mcp&config=eyJjb21tYW5kIjoibnB4IC15IHdlYi1kZXZlbG9wZXItbWNwIn0%3D)

Or manually add to your MCP configuration file:

```json
{
  "web-developer-mcp": {
    "command": "npx",
    "args": ["web-developer-mcp"]
  }
}
```

### Claude Code

Add this server using the Claude Code CLI:

```bash
claude mcp add -s user web-developer-mcp npx web-developer-mcp
```

### Configuration Examples

#### Default Configuration (Existing Chrome Session)

By default, the server uses your existing Chrome profile, preserving all cookies
and session data. **Important:** Close Chrome before starting the server to use
your existing profile.

```bash
# Cursor/Claude Code will use default settings automatically
# BROWSER_TYPE=chrome, SESSION_TYPE=existing
# Make sure Chrome is closed first!
```

#### Fresh Chrome Session

Use Chrome but start with a clean session:

```bash
# Set environment variable before starting
SESSION_TYPE=fresh npx web-developer-mcp
```

Or in your MCP config:

```json
{
  "web-developer-mcp": {
    "command": "npx",
    "args": ["web-developer-mcp"],
    "env": {
      "SESSION_TYPE": "fresh"
    }
  }
}
```

#### Chromium with Fresh Session

Use Playwright's bundled Chromium instead of Chrome:

```bash
BROWSER_TYPE=chromium SESSION_TYPE=fresh npx web-developer-mcp
```

#### Custom Chrome Profile Path

Specify a custom Chrome profile directory:

```bash
USER_DATA_DIR="/path/to/custom/profile" npx web-developer-mcp
```

**Important Notes:**

- Chrome must be completely closed before starting the server with
  `SESSION_TYPE=existing`
- If Chrome is running, you'll see errors about the profile being locked
- To use the server while Chrome is open, use `SESSION_TYPE=fresh` instead

## Available Tools

### Browser Navigation

#### `browser-navigate`

Navigate the browser to a specific URL and start monitoring the page.

**Parameters:**

- `url` (string): The URL to navigate to

**Example use case:** Navigate to `http://localhost:3000` to debug your
development server

#### `browser-reload`

Reload the current page and refresh console logs.

**No parameters required**

**Use case:** Refresh the page after code changes or to clear current state

### Console Monitoring

#### `browser-console`

Retrieve all console messages (logs, errors, warnings) from the current page.

**No parameters required**

**Returns:** All console output captured since navigation, including:

- Console logs (`console.log`, `console.info`)
- Warnings (`console.warn`)
- Errors (`console.error`)
- JavaScript errors and exceptions

### DOM Analysis

#### `inspect-elements`

Get detailed information about DOM elements including styles, position,
visibility, and attributes.

**Parameters:**

- `selector` (string): CSS selector to query elements (e.g. `.button`,
  `#header`, `div[data-test]`)

**Returns:** JSON with element details including:

- Tag name, ID, class names
- All HTML attributes
- Position and dimensions (x, y, width, height)
- Computed styles (colors, fonts, display, visibility, etc.)
- Visibility status and accessibility properties

**Example use cases:**

- Debug CSS styling issues
- Verify element positioning
- Check if elements are visible to users
- Analyze accessibility attributes

#### `extract-html`

Extract raw HTML markup of elements for testing or analysis (similar to React
Testing Library queries).

**Parameters:**

- `selector` (string): CSS selector to extract HTML from (e.g. `.alert`,
  `[role=dialog]`)

**Returns:** Raw HTML markup of matching elements

**Example use cases:**

- Extract component HTML for testing
- Analyze rendered output
- Debug template rendering issues

### Network Request Monitoring

#### `network-requests`

List all network requests captured since page load with optional filtering.

**Parameters:**

- `filter` (string, optional): Filter requests by URL substring (e.g. `"api"`,
  `"/users"`)
- `statusRange` (string, optional): Filter by HTTP status code range (e.g.
  `"400-499"`, `"500-599"`) or single status (e.g. `"404"`)

**Returns:** JSON list of network requests with:

- Request ID, method, URL
- HTTP status code and status text
- Response size and duration
- Timestamp

**Example use cases:**

- Debug API integration issues
- Monitor failed requests (4xx, 5xx status codes)
- Analyze page load performance
- Verify API calls are being made correctly

#### `network-inspect`

Get detailed information about a specific network request including headers,
body, and response data.

**Parameters:**

- `id` (string, optional): Request ID from `network-requests` output
- `urlPattern` (string, optional): URL pattern to find the most recent matching
  request

**Returns:** Detailed request/response information including:

- Request and response headers
- Request and response body (parsed JSON when possible)
- HTTP status and timing information
- Error details for failed requests

**Example use cases:**

- Debug API request/response data
- Analyze request headers and authentication
- Inspect response payloads
- Troubleshoot failed network requests

#### `network-clear`

Clear the network request buffer to start fresh monitoring.

**No parameters required**

**Use case:** Clear request history to focus on new requests after page changes

## Common Use Cases

### Debugging a Web Application

1. Navigate to your app: `browser-navigate` → `http://localhost:3000`
2. Check console for errors: `browser-console`
3. Monitor API calls: `network-requests` with filter `"api"`
4. Inspect failed requests: `network-inspect` with specific request ID
5. Analyze UI elements: `inspect-elements` with CSS selector

### Testing UI Components

1. Navigate to component page
2. Extract component HTML: `extract-html` with component selector
3. Inspect element properties: `inspect-elements` for styling verification
4. Check console for warnings: `browser-console`

### API Integration Analysis

1. Navigate to page that makes API calls
2. Monitor all requests: `network-requests`
3. Filter for specific API endpoints: `network-requests` with URL filter
4. Inspect request/response details: `network-inspect`
5. Clear history and test again: `network-clear`

## Requirements

- [Bun](https://bun.sh/) runtime
- Node.js compatible environment
- AI assistant with MCP support (Claude Code, Cursor, etc.)

## Browser Behavior

- By default, uses system-installed Chrome with your existing profile (preserves
  authentication)
- Can be configured to use Chromium or fresh sessions via environment variables
- Maintains a single persistent browser session
- Automatically captures console logs and network requests
- Browser state persists between tool calls until restart
- Runs in visible mode by default (set `HEADLESS=true` for headless operation)
