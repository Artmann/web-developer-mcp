import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

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
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Clear Test</title></head>
<body>
    <script>
        fetch('https://httpbin.org/get');
        fetch('https://jsonplaceholder.typicode.com/users/1');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Wait for requests to complete
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Verify we have requests
    const beforeClear = await client.callTool('network-requests')
    const beforeData = JSON.parse(beforeClear.content[0].text)
    expect(beforeData.count).toBeGreaterThan(0)

    // Clear the requests
    const clearResult = await client.callTool('network-clear')
    expect(clearResult).toEqual({
      content: [
        {
          type: 'text',
          text: `Cleared ${beforeData.count} network requests from the buffer.`
        }
      ]
    })

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

  it('should use singular form for single request', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Single Request Test</title></head>
<body>
    <script>
        fetch('https://httpbin.org/get');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Clear any existing requests first to ensure we start clean
    await client.callTool('network-clear')

    // Make a single request
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const result = await client.callTool('network-clear')

    // Should use "request" (singular) when count is 1
    expect(result.content[0].text).toMatch(/Cleared \d+ network request from/)
  })

  it('should reset request ID counter after clear', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Counter Reset Test</title></head>
<body>
    <script>
        fetch('https://httpbin.org/get');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Clear requests
    await client.callTool('network-clear')

    // Make new request
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check that new request has reset ID
    const requests = await client.callTool('network-requests')
    const data = JSON.parse(requests.content[0].text)

    if (data.count > 0) {
      // First request after clear should have ID starting from 1 again
      expect(data.requests[0].id).toBe('req_1')
    }
  })
})
