import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('inspect-elements tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('inspect-elements', {
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

  it('should query DOM elements and return their properties', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DOM Query Test</title>
    <style>
        .test-class {
            color: rgb(255, 0, 0);
            background-color: rgb(0, 0, 255);
            font-size: 16px;
            font-weight: bold;
        }
        #test-id {
            position: absolute;
            top: 10px;
            left: 20px;
            width: 100px;
            height: 50px;
        }
    </style>
</head>
<body>
    <div id="test-id" class="test-class" data-custom="value">Test Element</div>
    <div class="test-class">Another Element</div>
    <button type="submit" disabled>Submit Button</button>
</body>
</html>`

    // Navigate to test page
    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Query for elements with class
    const result = await client.callTool('inspect-elements', {
      selector: '.test-class'
    })

    const parsed = JSON.parse(result.content[0].text)

    expect(parsed).toEqual({
      selector: '.test-class',
      count: 2,
      elements: expect.arrayContaining([
        expect.objectContaining({
          tagName: 'div',
          id: 'test-id',
          className: 'test-class',
          textContent: 'Test Element',
          attributes: expect.objectContaining({
            id: 'test-id',
            class: 'test-class',
            'data-custom': 'value'
          }),
          styles: expect.objectContaining({
            color: 'rgb(255, 0, 0)',
            backgroundColor: 'rgb(0, 0, 255)',
            fontSize: '16px',
            fontWeight: '700'
          })
        }),
        expect.objectContaining({
          tagName: 'div',
          className: 'test-class',
          textContent: 'Another Element'
        })
      ])
    })
  })

  it('should return message when no elements match selector', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Empty Page</title></head>
<body>
    <p>No matching elements here</p>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('inspect-elements', {
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

  it('should query button elements with attributes', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Button Test</title></head>
<body>
    <button type="submit" disabled>Submit</button>
    <button type="button" class="btn-primary">Click Me</button>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('inspect-elements', {
      selector: 'button'
    })

    const parsed = JSON.parse(result.content[0].text)

    expect(parsed).toEqual({
      selector: 'button',
      count: 2,
      elements: expect.arrayContaining([
        expect.objectContaining({
          tagName: 'button',
          textContent: 'Submit',
          attributes: expect.objectContaining({
            type: 'submit',
            disabled: ''
          })
        }),
        expect.objectContaining({
          tagName: 'button',
          textContent: 'Click Me',
          className: 'btn-primary',
          attributes: expect.objectContaining({
            type: 'button',
            class: 'btn-primary'
          })
        })
      ])
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

    const result = await client.callTool('inspect-elements', {
      selector: '###invalid'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining("Failed to query DOM elements with selector '###invalid':")
        }
      ],
      isError: true
    })
  })
})