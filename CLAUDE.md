# Claude Instructions for WebDev MCP Server

This is a Model Context Protocol (MCP) server for web development that provides
browser automation tools using Playwright.

## Development Guidelines

### Code Style & Organization

- Use TypeScript with strict type checking
- Follow alphabetical sorting for object properties and interface fields
- Use early returns to reduce nesting
- Add blank lines between methods and logical sections
- Prefer `as const` for literal types to ensure proper MCP content typing
- Use `globalThis as any` for browser globals in Playwright evaluation contexts

### Project Structure

```
src/
├── index.ts                    # Entry point with error handling
├── server.ts                   # MCP server setup and tool registration
├── browser/
│   └── BrowserManager.ts      # Singleton browser management
└── tools/
    ├── navigate.ts            # Browser navigation
    ├── console.ts             # Console output retrieval
    ├── query-dom.ts           # DOM element inspection
    └── query-html.ts          # HTML extraction
```

### Browser Management

- Uses singleton pattern for consistent browser state
- Single browser instance with single page (replaces page on navigation)
- Captures console logs automatically on page load
- Supports graceful shutdown via signal handlers
- **Navigation State Management**: Uses `isNavigating` state to coordinate
  timing between tools
- **Automatic Waiting**: Tools wait for navigation completion before executing
  to ensure dynamic content is captured

### Tool Development

- Each tool is a separate module exporting a handler function
- All handlers must return MCP-compatible content with `type: 'text' as const`
- Include proper error handling with descriptive messages
- Add parameter validation and helpful error messages for missing page state
- **Navigation-Dependent Tools**: Console, DOM query, and HTML extraction tools
  must call `waitForNavigationComplete()` before execution
- **Timing Considerations**: Allow additional time (1s) after navigation for
  JavaScript execution and dynamic content creation

### Commands Available

```bash
bun run start      # Start the MCP server
bun run typecheck  # Run TypeScript type checking
bun run format     # Format code with Prettier
```

### Testing & Validation

- Always run `bun run typecheck` after making changes
- Verify tool registration in `src/server.ts`
- Test browser functionality with real web pages

### Adding New Tools

1. Create new file in `src/tools/`
2. Export handler function with proper typing
3. Register tool in `src/server.ts` with clear name and description
4. Add documentation to README.md
5. **Consider navigation dependencies**: If tool depends on page content,
   implement navigation state management
6. Add comprehensive tests including delayed content scenarios
7. Run typecheck to verify integration

### MCP Content Types

All tool responses must use the MCP content format:

```typescript
return {
  content: [{ type: 'text' as const, text: 'response text' }]
}
```

### Navigation State Management Implementation

The browser management system includes sophisticated timing coordination to
handle asynchronous JavaScript execution:

#### Key Components:

- **`isNavigating` state**: Boolean flag tracking when navigation is in progress
- **`waitForNavigationComplete(timeoutInMilliseconds = 10_000)`**: Method that
  blocks until navigation completes or times out
- **Enhanced navigation flow**: Uses
  `page.goto(url, { waitUntil: 'networkidle' })` + 1s additional wait

#### Affected Tools:

- **Console tool**: Waits for navigation + 1s to capture delayed console logs
  from `setTimeout`
- **DOM query tools**: Wait for navigation completion to ensure dynamically
  created elements are present
- **HTML extraction tool**: Waits for navigation to capture dynamically
  generated HTML
- **Reload tool**: Uses navigation state management by calling `navigate()`
  instead of direct `page.reload()`

#### Implementation Pattern:

```typescript
// In tool handlers
const browserManager = BrowserManager.getInstance()
await browserManager.waitForNavigationComplete()
// Additional wait for JS execution if needed
await new Promise((resolve) => setTimeout(resolve, 1000))
```

### Browser Context Notes

- Code executed in `page.$$eval()` runs in browser context
- Use `globalThis` instead of `window` for browser APIs
- Type DOM elements carefully to avoid TypeScript errors
- Keep evaluation functions simple and focused

### Testing Guidelines

- Use "bun run test run" to run the tests in non interactive mode
- When asserting in tests, compare the entire object or array use `toEqual`. For
  example `expect(result).toEqual({ content: [...] })`
- When testing, avoid stringMatching or toContain or similar matchers. we prefer
  using toEqual and exact matches unless absolutely necessary
- **Dynamic Content Testing**: Always test tools with delayed JavaScript
  execution (setTimeout) to verify navigation state management works correctly
- **Test Coverage**: Include tests for immediate, short-delay (100-200ms), and
  longer-delay (200+ ms) content creation
