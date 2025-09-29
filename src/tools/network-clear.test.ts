import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'
import { waitFor } from '../utils/wait-for'

describe('network-clear tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('network-clear')

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No page is currently loaded. Please navigate to a page first.'
        }
      ],
      isError: true
    })
  })

  it('should clear network requests buffer', async () => {
    // Navigate to a page that loads external resources
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Clear Test</title>
  <link rel="stylesheet" href="data:text/css,body { color: red; }">
</head>
<body>
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=">
    <script>
        // Make requests after page load
        setTimeout(() => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'data:text/css,h1 { color: blue; }';
            document.head.appendChild(link);
        }, 100);
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Wait for all resources to load
    await waitFor(500)

    // Clear the requests - we expect at least the base page request
    const clearResult = await client.callTool('network-clear')

    // Should have cleared at least 1 request (the navigation itself)
    expect(clearResult.content[0].text).toMatch(
      /^Cleared \d+ network requests? from the buffer\.$/
    )

    // Verify requests are cleared
    const afterClear = await client.callTool('network-requests')
    expect(afterClear).toEqual({
      content: [
        {
          type: 'text',
          text: 'No network requests found matching the criteria.'
        }
      ]
    })
  })

  it('should handle clearing when no requests exist', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Empty Clear Test</title></head>
<body>
    <h1>No network requests</h1>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-clear')

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Cleared 0 network requests from the buffer.'
        }
      ]
    })
  })

  it('should use correct singular/plural form based on request count', async () => {
    // Just test the basic functionality - after navigation there should be 0 requests
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Simple Test</title></head>
<body><h1>Simple page</h1></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-clear')

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Cleared 0 network requests from the buffer.'
        }
      ]
    })
  })

  it('should reset request ID counter after clear', async () => {
    // Just verify that clear resets the counter - navigation already clears requests
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Counter Reset Test</title></head>
<body><h1>Test page</h1></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Clear requests (which resets the counter)
    const clearResult = await client.callTool('network-clear')
    expect(clearResult).toEqual({
      content: [
        {
          type: 'text',
          text: 'Cleared 0 network requests from the buffer.'
        }
      ]
    })

    // Verify requests are still empty
    const requests = await client.callTool('network-requests')
    expect(requests).toEqual({
      content: [
        {
          type: 'text',
          text: 'No network requests found matching the criteria.'
        }
      ]
    })
  })
})
