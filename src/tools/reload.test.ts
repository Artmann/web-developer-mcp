import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('browser-reload tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('browser-reload')

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

  it('should reload the current page', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reload Test</title>
</head>
<body>
    <h1>Original Page</h1>
    <script>
        console.log('Page loaded at: ' + new Date().toISOString());
    </script>
</body>
</html>`

    // Navigate to initial page
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Wait for initial page to load
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get initial console logs
    const initialConsole = await client.callTool('browser-console')
    expect(initialConsole.content[0].text).toContain('Page loaded at:')

    // Reload the page
    const result = await client.callTool('browser-reload')

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Page reloaded successfully'
        }
      ]
    })

    // Wait for reload to complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Console should have new log entry after reload
    const reloadedConsole = await client.callTool('browser-console')
    expect(reloadedConsole.content[0].text).toContain('Page loaded at:')
  })

  it('should maintain page content after reload', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Content Test</title>
</head>
<body>
    <h1 id="title">Test Title</h1>
    <p class="content">Test content that should persist</p>
</body>
</html>`

    // Navigate to page
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Query initial content
    const initialQuery = await client.callTool('extract-html', {
      selector: '#title'
    })
    expect(initialQuery).toEqual({
      content: [
        {
          type: 'text',
          text: '<h1 id="title">Test Title</h1>'
        }
      ]
    })

    // Reload the page
    const reloadResult = await client.callTool('browser-reload')
    expect(reloadResult).toEqual({
      content: [
        {
          type: 'text',
          text: 'Page reloaded successfully'
        }
      ]
    })

    // Query content after reload - should be the same
    const afterReloadQuery = await client.callTool('extract-html', {
      selector: '#title'
    })
    expect(afterReloadQuery).toEqual({
      content: [
        {
          type: 'text',
          text: '<h1 id="title">Test Title</h1>'
        }
      ]
    })
  })

  it('should clear console logs on reload', async () => {
    const htmlWithLogs = `<!DOCTYPE html>
<html lang="en">
<head><title>Console Reload Test</title></head>
<body>
    <h1>Page with console logs</h1>
    <script>
        console.log('Initial load');
        // Add a log after a delay to simulate dynamic content
        setTimeout(() => console.log('Delayed log'), 100);
    </script>
</body>
</html>`

    // Navigate to page
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlWithLogs).toString('base64')}`
    })

    // Wait for logs
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Check initial logs
    const beforeReload = await client.callTool('browser-console')
    expect(beforeReload.content[0].text).toContain('Initial load')
    expect(beforeReload.content[0].text).toContain('Delayed log')

    // Reload the page
    await client.callTool('browser-reload')

    // Wait for new logs
    await new Promise((resolve) => setTimeout(resolve, 200))

    // After reload, we should have fresh logs
    const afterReload = await client.callTool('browser-console')
    expect(afterReload.content[0].text).toContain('Initial load')
    expect(afterReload.content[0].text).toContain('Delayed log')
    // The logs should be new instances, not accumulated from before
  })
})
