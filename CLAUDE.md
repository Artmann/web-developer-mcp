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

### Tool Development

- Each tool is a separate module exporting a handler function
- All handlers must return MCP-compatible content with `type: 'text' as const`
- Include proper error handling with descriptive messages
- Add parameter validation and helpful error messages for missing page state

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
5. Run typecheck to verify integration

### MCP Content Types

All tool responses must use the MCP content format:

```typescript
return {
  content: [{ type: 'text' as const, text: 'response text' }]
}
```

### Browser Context Notes

- Code executed in `page.$$eval()` runs in browser context
- Use `globalThis` instead of `window` for browser APIs
- Type DOM elements carefully to avoid TypeScript errors
- Keep evaluation functions simple and focused
