import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('extract-html tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('extract-html', {
      selector: 'div'
    })

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

  it('should extract HTML for matching elements', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>HTML Query Test</title>
</head>
<body>
    <div class="container">
        <h1>Title</h1>
        <p>Paragraph text</p>
    </div>
    <div class="sidebar">
        <ul>
            <li>Item 1</li>
            <li>Item 2</li>
        </ul>
    </div>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Query for div elements
    const result = await client.callTool('extract-html', {
      selector: 'div'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `<div class="container">
        <h1>Title</h1>
        <p>Paragraph text</p>
    </div>

<div class="sidebar">
        <ul>
            <li>Item 1</li>
            <li>Item 2</li>
        </ul>
    </div>`
        }
      ]
    })
  })

  it('should extract HTML for single element', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
    <h1 id="main-title" class="heading">Main Title</h1>
    <p>Some text</p>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('extract-html', {
      selector: '#main-title'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: '<h1 id="main-title" class="heading">Main Title</h1>'
        }
      ]
    })
  })

  it('should extract HTML for multiple list items', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>List Test</title></head>
<body>
    <ul>
        <li class="item">First</li>
        <li class="item">Second</li>
        <li class="item">Third</li>
    </ul>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('extract-html', {
      selector: '.item'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `<li class="item">First</li>

<li class="item">Second</li>

<li class="item">Third</li>`
        }
      ]
    })
  })

  it('should return message when no elements match selector', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Empty Test</title></head>
<body>
    <p>No matching elements</p>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('extract-html', {
      selector: '.non-existent'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No elements found matching selector: .non-existent'
        }
      ]
    })
  })

  it('should handle complex selectors', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Complex Selector Test</title></head>
<body>
    <form>
        <input type="text" name="username" value="john">
        <input type="password" name="password" value="secret">
        <input type="email" name="email" value="john@example.com">
        <button type="submit">Submit</button>
    </form>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('extract-html', {
      selector: 'input[type="text"], input[type="email"]'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `<input type="text" name="username" value="john">

<input type="email" name="email" value="john@example.com">`
        }
      ]
    })
  })

  it('should handle invalid selectors gracefully', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body><div>Test</div></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('extract-html', {
      selector: '###invalid'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.any(String)
        }
      ],
      isError: true
    })
  })

  it('should wait for navigation and extract dynamically created HTML elements', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dynamic HTML Test</title>
</head>
<body>
    <div id="dynamic-container">
        <h1>Initial heading</h1>
    </div>

    <script>
        // Add elements immediately
        const immediateSection = document.createElement('section');
        immediateSection.className = 'immediate-section';
        immediateSection.innerHTML = '<h2>Immediate section</h2><p>Immediate content</p>';
        document.getElementById('dynamic-container').appendChild(immediateSection);

        // Add elements after 180ms delay
        setTimeout(() => {
            const delayedArticle = document.createElement('article');
            delayedArticle.className = 'delayed-article';
            delayedArticle.id = 'article-180';
            delayedArticle.innerHTML = '<h3>Delayed article</h3><p>Content added after 180ms</p>';
            document.getElementById('dynamic-container').appendChild(delayedArticle);
        }, 180);

        // Add elements after 220ms delay
        setTimeout(() => {
            const veryDelayedAside = document.createElement('aside');
            veryDelayedAside.className = 'very-delayed-aside';
            veryDelayedAside.id = 'aside-220';
            veryDelayedAside.innerHTML = '<h4>Very delayed aside</h4><p>Content added after 220ms</p>';
            document.getElementById('dynamic-container').appendChild(veryDelayedAside);
        }, 220);
    </script>
</body>
</html>`

    // Navigate to page with dynamic content
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

    // Extract HTML for all article and aside elements
    const result = await client.callTool('extract-html', {
      selector: 'article, aside'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: '<article class="delayed-article" id="article-180"><h3>Delayed article</h3><p>Content added after 180ms</p></article>\n\n<aside class="very-delayed-aside" id="aside-220"><h4>Very delayed aside</h4><p>Content added after 220ms</p></aside>'
        }
      ]
    })
  })
})
