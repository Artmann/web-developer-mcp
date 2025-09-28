# Contributing to WebDev MCP Server

Thank you for your interest in contributing to the WebDev MCP Server! This
document provides guidelines for developers who want to modify, extend, or
contribute to the project.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) runtime (latest version)
- Node.js compatible environment
- TypeScript knowledge
- Familiarity with Playwright for browser automation

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

### Available Commands

```bash
bun run start      # Start the MCP server
bun run typecheck  # Run TypeScript type checking
bun run format     # Format code with Prettier
bun run test       # Run the test suite
bun run test:ui    # Run tests with UI
```

## Project Architecture

### Project Structure

```
src/
├── index.ts                    # Entry point with error handling
├── server.ts                   # MCP server setup and tool registration
├── browser/
│   └── BrowserManager.ts      # Singleton browser management
├── tools/                     # Individual tool implementations
│   ├── navigate.ts            # Browser navigation
│   ├── reload.ts              # Page reloading
│   ├── console.ts             # Console output retrieval
│   ├── query-dom.ts           # DOM element inspection
│   ├── query-html.ts          # HTML extraction
│   ├── network-requests.ts    # Network request listing
│   ├── network-inspect.ts     # Network request inspection
│   └── network-clear.ts       # Network buffer clearing
└── testing/
    └── mcp-test-client.ts     # Test utilities
```

### Design Patterns

#### Browser Management

- **Singleton Pattern**: `BrowserManager` maintains a single browser instance
- **Single Page Model**: Replaces page on navigation rather than multiple tabs
- **Automatic Monitoring**: Captures console logs and network requests
  automatically
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals for clean browser
  closure

#### Tool Architecture

- **Modular Design**: Each tool is a separate module with focused responsibility
- **Consistent Interface**: All tools export a handler function with
  standardized return type
- **Error Handling**: Comprehensive error handling with descriptive user
  messages
- **Parameter Validation**: Input validation with helpful error messages

## Code Style Guidelines

### TypeScript Standards

- **Strict Type Checking**: Use TypeScript with strict mode enabled
- **Explicit Typing**: Prefer explicit types over `any`
- **Interface Organization**: Sort object properties and interface fields
  alphabetically
- **Literal Types**: Use `as const` for literal types to ensure proper MCP
  content typing

### Code Organization

- **Early Returns**: Use early returns to reduce nesting
- **Logical Separation**: Add blank lines between methods and logical sections
- **Alphabetical Sorting**: Sort imports, object properties, and interface
  fields alphabetically
- **Focused Functions**: Keep functions small and focused on single
  responsibilities

### Browser Context Guidelines

- **Browser Globals**: Use `globalThis as any` for browser globals in Playwright
  evaluation contexts
- **Simple Evaluations**: Keep `page.$$eval()` functions simple and focused
- **Type Safety**: Type DOM elements carefully to avoid TypeScript errors
- **Context Awareness**: Remember that evaluation functions run in browser
  context, not Node.js

## MCP Integration Standards

### Content Format

All tool responses must use the MCP-compatible content format:

```typescript
// Success response
return {
  content: [{ type: 'text' as const, text: 'response text' }]
}

// Error response
return {
  content: [{ type: 'text' as const, text: 'error message' }],
  isError: true
}
```

### Tool Registration

Tools must be registered in `src/server.ts` with:

- Clear, descriptive names
- Comprehensive descriptions
- Proper input schema with Zod validation
- Helpful parameter descriptions

## Adding New Tools

### Step-by-Step Process

1. **Create Tool File**: Add new file in `src/tools/` following naming
   convention
2. **Implement Handler**: Export async handler function with proper typing
3. **Add Error Handling**: Include comprehensive error handling and validation
4. **Register Tool**: Add to `src/server.ts` with proper schema and descriptions
5. **Write Tests**: Create test file in same directory with `.test.ts` suffix
6. **Update Documentation**: Add tool documentation to README.md
7. **Type Check**: Run `bun run typecheck` to verify integration

### Tool Template

```typescript
import { BrowserManager } from '../browser/BrowserManager'
import { createSuccessResponse, createErrorResponse } from '../response'

export async function myToolHandler({
  param1,
  param2
}: {
  param1: string
  param2?: number
}) {
  try {
    const browserManager = BrowserManager.getInstance()
    const page = browserManager.getPage()

    if (!page) {
      return createErrorResponse(
        'No page is currently loaded. Please navigate to a page first.'
      )
    }

    // Tool implementation here
    const result = await page.evaluate(() => {
      // Browser context code
      return 'result'
    })

    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse(
      `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
```

### Registration Template

```typescript
this.mcpServer.registerTool(
  'my-tool',
  {
    title: 'My Tool Title',
    description: 'Clear description of what the tool does and when to use it',
    inputSchema: {
      param1: z.string().describe('Description of required parameter'),
      param2: z
        .number()
        .optional()
        .describe('Description of optional parameter')
    }
  },
  myToolHandler
)
```

## Testing Guidelines

### Test Structure

- **Test Files**: Co-locate tests with source files using `.test.ts` suffix
- **Test Client**: Use `MCPTestClient` for integration testing
- **Comprehensive Coverage**: Test success cases, error cases, and edge cases
- **Realistic Scenarios**: Use realistic HTML content and scenarios

### Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MCPTestClient } from '../testing/mcp-test-client'

describe('my-tool tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should handle successful case', async () => {
    // Test implementation
  })

  it('should handle error case', async () => {
    // Error test implementation
  })
})
```

### Running Tests

```bash
# Run all tests
bun run test

# Run tests with UI
bun run test:ui

# Run specific test file
bun test src/tools/my-tool.test.ts
```

## Development Workflow

### Before Making Changes

1. **Understand Architecture**: Review existing code to understand patterns
2. **Check Issues**: Look for related issues or discussions
3. **Plan Changes**: Consider impact on existing functionality

### During Development

1. **Follow Code Style**: Adhere to established patterns and conventions
2. **Write Tests**: Add comprehensive tests for new functionality
3. **Type Check**: Regularly run `bun run typecheck` to catch type issues
4. **Test Manually**: Test with real web pages and scenarios

### Before Submitting

1. **Run Full Test Suite**: Ensure all tests pass with `bun run test`
2. **Type Check**: Verify no TypeScript errors with `bun run typecheck`
3. **Format Code**: Run `bun run format` to ensure consistent formatting
4. **Update Documentation**: Update README.md if adding/changing tools
5. **Manual Testing**: Test the MCP server with real AI assistant integration
6. **CI Checks**: Ensure all GitHub Actions workflows will pass (they run
   automatically on PR)

## Browser Management Details

### BrowserManager Singleton

The `BrowserManager` class maintains global browser state:

```typescript
// Get the singleton instance
const browserManager = BrowserManager.getInstance()

// Access the current page (may be null)
const page = browserManager.getPage()

// Get captured console logs
const logs = browserManager.getConsoleLogs()

// Get captured network requests
const requests = browserManager.getNetworkRequests()
```

### Page Lifecycle

- **Navigation**: New navigation replaces current page content
- **State Persistence**: Browser state persists between tool calls
- **Monitoring**: Console logs and network requests captured automatically
- **Cleanup**: Browser closes gracefully on process termination

### Network Request Monitoring

The browser automatically captures:

- All HTTP/HTTPS requests
- Request/response headers
- Request/response bodies
- Status codes and timing
- Error information for failed requests

## Common Patterns

### Error Handling

```typescript
try {
  // Tool logic
  return createSuccessResponse(result)
} catch (error) {
  return createErrorResponse(
    `Tool-specific error message: ${error instanceof Error ? error.message : String(error)}`
  )
}
```

### Page State Validation

```typescript
const page = browserManager.getPage()
if (!page) {
  return createErrorResponse(
    'No page is currently loaded. Please navigate to a page first.'
  )
}
```

### Browser Context Evaluation

```typescript
const result = await page.evaluate(() => {
  // This code runs in browser context
  // Use globalThis instead of window
  return (globalThis as any).someGlobalVariable
})
```

## Release Process

1. **Version Update**: Update version in `package.json`
2. **Changelog**: Document changes and new features
3. **Final Testing**: Complete testing across different scenarios
4. **Documentation**: Ensure README.md is up to date
5. **Tag Release**: Create git tag for version

## Getting Help

- **Issues**: Check existing issues for similar problems
- **Code Review**: Look at existing tools for patterns and examples
- **Testing**: Use the test suite as examples for writing new tests
- **Architecture**: Reference this document and the CLAUDE.md file for
  guidelines

## CI/CD Workflows

The project uses GitHub Actions for automated testing and quality assurance:

### Workflow Overview

- **`ci.yml`**: Main CI pipeline that runs on every push and PR
  - Runs TypeScript type checking
  - Executes full test suite with Playwright
  - Checks code formatting

- **`lint.yml`**: Code quality checks
  - Verifies code formatting with Prettier
  - Runs TypeScript type checking

- **`cross-platform.yml`**: Multi-OS compatibility testing
  - Tests on Ubuntu, Windows, and macOS
  - Ensures cross-platform functionality

- **`release.yml`**: Automated release creation
  - Triggers on version tags (e.g., `v1.0.0`)
  - Runs full test suite before release
  - Creates GitHub releases with changelog

### Local CI Simulation

Run the same checks locally before pushing:

```bash
# Run the full CI pipeline locally
bun run typecheck  # Type checking
bun run test       # Test suite
bun run format     # Code formatting
```

### Workflow Status

Check workflow status badges in the README to see current build health.

## Performance Considerations

- **Browser Resource Usage**: Monitor memory usage during long sessions
- **Network Request Storage**: Large numbers of requests may consume memory
- **Page Evaluation**: Keep browser evaluation functions lightweight
- **Concurrent Usage**: Design for single AI assistant usage, not concurrent
  access
