import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('browser-navigate tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should navigate to a valid URL', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
</head>
<body>
    <h1>Test Page</h1>
</body>
</html>`

    const url = `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    const result = await client.callTool('browser-navigate', { url })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Successfully navigated to ${url}`
        }
      ]
    })
  })

  it('should handle invalid URLs gracefully', async () => {
    const result = await client.callTool('browser-navigate', {
      url: 'not-a-valid-url'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Failed to navigate to not-a-valid-url:')
        }
      ],
      isError: true
    })
  })

  it('should navigate to different pages sequentially', async () => {
    const page1 = `<!DOCTYPE html>
<html lang="en">
<head><title>Page 1</title></head>
<body><h1>Page 1</h1></body>
</html>`

    const page2 = `<!DOCTYPE html>
<html lang="en">
<head><title>Page 2</title></head>
<body><h1>Page 2</h1></body>
</html>`

    const url1 = `data:text/html;base64,${Buffer.from(page1).toString('base64')}`
    const url2 = `data:text/html;base64,${Buffer.from(page2).toString('base64')}`

    // Navigate to first page
    const result1 = await client.callTool('browser-navigate', { url: url1 })
    expect(result1).toEqual({
      content: [
        {
          type: 'text',
          text: `Successfully navigated to ${url1}`
        }
      ]
    })

    // Navigate to second page
    const result2 = await client.callTool('browser-navigate', { url: url2 })
    expect(result2).toEqual({
      content: [
        {
          type: 'text',
          text: `Successfully navigated to ${url2}`
        }
      ]
    })

    // Verify we can query the second page
    const htmlResult = await client.callTool('extract-html', {
      selector: 'h1'
    })
    expect(htmlResult).toEqual({
      content: [
        {
          type: 'text',
          text: '<h1>Page 2</h1>'
        }
      ]
    })
  })
})