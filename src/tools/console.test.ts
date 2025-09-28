import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('browser-console tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()

    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return no console logs message when no page is loaded', async () => {
    const result = await client.callTool('browser-console')

    expect(result.content).toEqual([
      {
        type: 'text',
        text: 'No console logs available.'
      }
    ])
  })

  it('should return console logs when page has logged messages', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Console Logs Test Page</title>
</head>
<body>
    <h1>Console Logs Test Page</h1>
    <p>This page logs normal messages to the console.</p>

    <script>
        console.log('This is a test log message');
        console.log('Another log message');
        console.info('This is an info message');
    </script>
</body>
</html>`

    // Navigate to page with console logs
    const navigateResult = await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    expect(navigateResult.content[0].text).toContain('Successfully navigated')

    // Wait a moment for console logs to be captured
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get console logs
    const result = await client.callTool('browser-console')

    expect(result.content[0].text).toContain('This is a test log message')
    expect(result.content[0].text).toContain('Another log message')
    expect(result.content[0].text).toContain('This is an info message')
  })

  it('should return console errors when page has error messages', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Console Errors Test Page</title>
</head>
<body>
    <h1>Console Errors Test Page</h1>
    <p>This page logs error messages to the console.</p>

    <script>
        console.error('This is a test error message');
        console.warn('This is a warning message');
        console.error('Another error message');
    </script>
</body>
</html>`

    // Navigate to page with console errors
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Wait a moment for console logs to be captured
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get console logs
    const result = await client.callTool('browser-console')

    expect(result.content[0].text).toContain('This is a test error message')
    expect(result.content[0].text).toContain('This is a warning message')
    expect(result.content[0].text).toContain('Another error message')
  })

  it('should return no console logs for empty page', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Empty Test Page</title>
</head>
<body>
    <h1>Empty Test Page</h1>
    <p>This page has no console output.</p>
</body>
</html>`

    // Navigate to empty page
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get console logs
    const result = await client.callTool('browser-console')

    expect(result.content).toEqual([
      {
        type: 'text',
        text: 'No console logs available.'
      }
    ])
  })

  it('should clear console logs when navigating to a new page', async () => {
    const htmlWithLogs = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Console Logs Test Page</title>
</head>
<body>
    <h1>Console Logs Test Page</h1>
    <p>This page logs normal messages to the console.</p>

    <script>
        console.log('This is a test log message');
        console.log('Another log message');
        console.info('This is an info message');
    </script>
</body>
</html>`

    const emptyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Empty Test Page</title>
</head>
<body>
    <h1>Empty Test Page</h1>
    <p>This page has no console output.</p>
</body>
</html>`

    // Navigate to page with console logs
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlWithLogs).toString('base64')}`
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verify we have logs
    const firstResult = await client.callTool('browser-console')
    expect(firstResult.content[0].text).toContain('This is a test log message')

    // Navigate to empty page
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(emptyHtml).toString('base64')}`
    })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Console should be cleared
    const secondResult = await client.callTool('browser-console')
    expect(secondResult.content).toEqual([
      {
        type: 'text',
        text: 'No console logs available.'
      }
    ])
  })
})
