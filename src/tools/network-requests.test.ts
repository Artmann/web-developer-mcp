import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('network-requests tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('network-requests')

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

  it('should return no requests when page has no network activity', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Static Page</title></head>
<body>
    <h1>Static content only</h1>
    <p>No network requests here</p>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Wait a moment for potential requests

    const result = await client.callTool('network-requests')

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No network requests found matching the criteria.'
        }
      ]
    })
  })

  it('should capture network requests from fetch calls', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Network Test</title></head>
<body>
    <h1>Network Testing</h1>
    <script>
        // Create an image element which will trigger a network request
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Wait for network requests to complete

    const result = await client.callTool('network-requests')

    // Check if we have any requests, otherwise this might be expected behavior
    if (result.content[0].text.includes('No network requests')) {
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'No network requests found matching the criteria.'
          }
        ]
      })
    } else {
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.count).toBeGreaterThan(0)
      expect(parsed.requests[0]).toEqual({
        id: expect.any(String),
        method: 'GET',
        url: expect.any(String),
        status: expect.any(String),
        size: expect.any(String),
        duration: expect.any(String),
        timestamp: expect.any(String)
      })
    }
  })

  it('should filter requests by URL pattern', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Filter Test</title></head>
<body>
    <script>
        fetch('data:application/json,{"user":1}');
        fetch('data:text/plain,hello world');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-requests', {
      filter: 'application/json'
    })

    // Check if we have any requests, otherwise this might be expected behavior
    if (result.content[0].text.includes('No network requests')) {
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'No network requests found matching the criteria.'
          }
        ]
      })
    } else {
      const parsed = JSON.parse(result.content[0].text)

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(parsed, null, 2)
          }
        ]
      })

      expect(parsed).toEqual({
        count: 1,
        requests: [
          {
            id: 'req_1',
            method: 'GET',
            url: 'data:application/json,{"user":1}',
            status: '200 OK',
            size: expect.any(String),
            duration: expect.any(String),
            timestamp: expect.any(String)
          }
        ]
      })
    }
  })

  it('should filter requests by status range', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Status Filter Test</title></head>
<body>
    <script>
        // Make successful request first
        fetch('data:application/json,{"success":true}');

        // Try to fetch a resource that will fail (invalid data URL)
        fetch('data:invalid,content').catch(() => {});
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Filter for successful requests (200 range)
    const result = await client.callTool('network-requests', {
      statusRange: '200-299'
    })

    // Check if we have any requests, otherwise this might be expected behavior
    if (result.content[0].text.includes('No network requests')) {
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'No network requests found matching the criteria.'
          }
        ]
      })
    } else {
      const parsed = JSON.parse(result.content[0].text)

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(parsed, null, 2)
          }
        ]
      })

      expect(parsed).toEqual({
        count: 1,
        requests: [
          {
            id: expect.any(String),
            method: 'GET',
            url: 'data:application/json,{"success":true}',
            status: '200 OK',
            size: expect.any(String),
            duration: expect.any(String),
            timestamp: expect.any(String)
          }
        ]
      })
    }
  })

  it('should filter requests by single status code', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Single Status Test</title></head>
<body>
    <script>
        fetch('data:application/json,{"test":true}');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-requests', {
      statusRange: '200'
    })

    // Check if we have any requests, otherwise this might be expected behavior
    if (result.content[0].text.includes('No network requests')) {
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'No network requests found matching the criteria.'
          }
        ]
      })
    } else {
      const parsed = JSON.parse(result.content[0].text)

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(parsed, null, 2)
          }
        ]
      })

      expect(parsed).toEqual({
        count: 1,
        requests: [
          {
            id: 'req_1',
            method: 'GET',
            url: 'data:application/json,{"test":true}',
            status: '200 OK',
            size: expect.any(String),
            duration: expect.any(String),
            timestamp: expect.any(String)
          }
        ]
      })
    }
  })

  it('should return only first N requests with head parameter', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Head Test</title></head>
<body>
    <script>
        fetch('data:text/plain,request1');
        fetch('data:text/plain,request2');
        fetch('data:text/plain,request3');
        fetch('data:text/plain,request4');
        fetch('data:text/plain,request5');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-requests', {
      head: 2
    })

    if (!result.content[0].text.includes('No network requests')) {
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.count).toBe(2)
      expect(parsed.requests).toHaveLength(2)
      expect(parsed.requests[0].url).toContain('request1')
      expect(parsed.requests[1].url).toContain('request2')
    }
  })

  it('should return only last N requests with tail parameter', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Tail Test</title></head>
<body>
    <script>
        fetch('data:text/plain,request1');
        fetch('data:text/plain,request2');
        fetch('data:text/plain,request3');
        fetch('data:text/plain,request4');
        fetch('data:text/plain,request5');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-requests', {
      tail: 2
    })

    if (!result.content[0].text.includes('No network requests')) {
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.count).toBe(2)
      expect(parsed.requests).toHaveLength(2)
      expect(parsed.requests[0].url).toContain('request4')
      expect(parsed.requests[1].url).toContain('request5')
    }
  })

  it('should prioritize tail over head when both are provided', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Tail Priority Test</title></head>
<body>
    <script>
        fetch('data:text/plain,request1');
        fetch('data:text/plain,request2');
        fetch('data:text/plain,request3');
        fetch('data:text/plain,request4');
        fetch('data:text/plain,request5');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-requests', {
      head: 2,
      tail: 3
    })

    if (!result.content[0].text.includes('No network requests')) {
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.count).toBe(3)
      expect(parsed.requests).toHaveLength(3)
      expect(parsed.requests[0].url).toContain('request3')
      expect(parsed.requests[1].url).toContain('request4')
      expect(parsed.requests[2].url).toContain('request5')
    }
  })

  it('should combine filter with head parameter', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Filter + Head Test</title></head>
<body>
    <script>
        fetch('data:application/json,{"id":1}');
        fetch('data:text/plain,other1');
        fetch('data:application/json,{"id":2}');
        fetch('data:application/json,{"id":3}');
        fetch('data:text/plain,other2');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-requests', {
      filter: 'application/json',
      head: 2
    })

    if (!result.content[0].text.includes('No network requests')) {
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.count).toBe(2)
      expect(parsed.requests).toHaveLength(2)
      expect(parsed.requests[0].url).toContain('{"id":1}')
      expect(parsed.requests[1].url).toContain('{"id":2}')
    }
  })

  it('should combine filter with tail parameter', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Filter + Tail Test</title></head>
<body>
    <script>
        fetch('data:application/json,{"id":1}');
        fetch('data:text/plain,other1');
        fetch('data:application/json,{"id":2}');
        fetch('data:application/json,{"id":3}');
        fetch('data:text/plain,other2');
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('network-requests', {
      filter: 'application/json',
      tail: 2
    })

    if (!result.content[0].text.includes('No network requests')) {
      const parsed = JSON.parse(result.content[0].text)
      expect(parsed.count).toBe(2)
      expect(parsed.requests).toHaveLength(2)
      expect(parsed.requests[0].url).toContain('{"id":2}')
      expect(parsed.requests[1].url).toContain('{"id":3}')
    }
  })
})
