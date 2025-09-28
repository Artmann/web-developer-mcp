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
          text: expect.stringContaining(
            "Failed to extract HTML with selector '###invalid':"
          )
        }
      ],
      isError: true
    })
  })
})
