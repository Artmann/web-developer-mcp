import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'
import { waitFor } from '../utils/wait-for'

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
    await waitFor(500)

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
    await waitFor(500)

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

    // Check initial logs
    const beforeReload = await client.callTool('browser-console')
    expect(beforeReload).toEqual({
      content: [
        {
          type: 'text',
          text: '[log] Initial load\n[log] Delayed log'
        }
      ]
    })

    // Reload the page
    await client.callTool('browser-reload')

    // After reload, we should have fresh logs
    const afterReload = await client.callTool('browser-console')
    expect(afterReload).toEqual({
      content: [
        {
          type: 'text',
          text: '[log] Initial load\n[log] Delayed log'
        }
      ]
    })
  })

  it('should properly manage navigation state during reload with delayed content', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reload Navigation State Test</title>
</head>
<body>
    <div id="static-content">
        <h1>Static content</h1>
    </div>
    <div id="dynamic-content"></div>

    <script>
        console.log('Page loading');

        // Add content immediately
        const immediateElement = document.createElement('p');
        immediateElement.textContent = 'Immediate element';
        immediateElement.className = 'immediate';
        document.getElementById('dynamic-content').appendChild(immediateElement);

        // Add content after 160ms
        setTimeout(() => {
            const delayedElement = document.createElement('p');
            delayedElement.textContent = 'Delayed element after 160ms';
            delayedElement.className = 'delayed-160';
            delayedElement.id = 'delayed-paragraph';
            document.getElementById('dynamic-content').appendChild(delayedElement);

            console.log('Delayed content added');
        }, 160);

        // Add content after 240ms
        setTimeout(() => {
            const veryDelayedElement = document.createElement('span');
            veryDelayedElement.textContent = 'Very delayed span after 240ms';
            veryDelayedElement.className = 'very-delayed-240';
            veryDelayedElement.id = 'very-delayed-span';
            document.getElementById('dynamic-content').appendChild(veryDelayedElement);

            console.log('Very delayed content added');
        }, 240);
    </script>
</body>
</html>`

    // Navigate to page initially
    const navigateResult = await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    expect(navigateResult).toEqual({
      content: [
        {
          type: 'text',
          text: expect.any(String)
        }
      ]
    })

    // Verify initial dynamic content is present
    const initialDomQuery = await client.callTool('inspect-elements', {
      selector: '#dynamic-content p, #dynamic-content span'
    })

    const initialParsed = JSON.parse(initialDomQuery.content[0].text)
    expect(initialParsed.count).toBe(3)

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

    // After reload, verify the same dynamic content is recreated
    const afterReloadDomQuery = await client.callTool('inspect-elements', {
      selector: '#dynamic-content p, #dynamic-content span'
    })

    const afterReloadParsed = JSON.parse(afterReloadDomQuery.content[0].text)
    expect(afterReloadParsed).toEqual({
      selector: '#dynamic-content p, #dynamic-content span',
      count: 3,
      elements: expect.arrayContaining([
        expect.objectContaining({
          tagName: 'p',
          className: 'immediate',
          textContent: 'Immediate element'
        }),
        expect.objectContaining({
          tagName: 'p',
          className: 'delayed-160',
          id: 'delayed-paragraph',
          textContent: 'Delayed element after 160ms'
        }),
        expect.objectContaining({
          tagName: 'span',
          className: 'very-delayed-240',
          id: 'very-delayed-span',
          textContent: 'Very delayed span after 240ms'
        })
      ])
    })

    // Verify console logs are also properly captured after reload
    const consoleResult = await client.callTool('browser-console')
    expect(consoleResult).toEqual({
      content: [
        {
          type: 'text',
          text: '[log] Page loading\n[log] Delayed content added\n[log] Very delayed content added'
        }
      ]
    })
  })
})
