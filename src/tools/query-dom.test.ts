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
          text: expect.any(String)
        }
      ],
      isError: true
    })
  })

  it('should wait for navigation and capture dynamically created DOM elements', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dynamic DOM Test</title>
</head>
<body>
    <div id="container">
        <p>Initial content</p>
    </div>

    <script>
        // Add elements immediately
        const immediateDiv = document.createElement('div');
        immediateDiv.className = 'immediate-element';
        immediateDiv.textContent = 'Immediate element';
        document.getElementById('container').appendChild(immediateDiv);

        // Add elements after 150ms delay
        setTimeout(() => {
            const delayedDiv = document.createElement('div');
            delayedDiv.className = 'delayed-element';
            delayedDiv.textContent = 'Delayed element after 150ms';
            delayedDiv.id = 'delayed-150';
            document.getElementById('container').appendChild(delayedDiv);
        }, 150);

        // Add elements after 250ms delay
        setTimeout(() => {
            const veryDelayedDiv = document.createElement('div');
            veryDelayedDiv.className = 'very-delayed-element';
            veryDelayedDiv.textContent = 'Very delayed element after 250ms';
            veryDelayedDiv.id = 'delayed-250';
            document.getElementById('container').appendChild(veryDelayedDiv);
        }, 250);
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

    // Query for all div elements - should include dynamically created ones
    const result = await client.callTool('inspect-elements', {
      selector: 'div'
    })

    const parsed = JSON.parse(result.content[0].text)

    expect(parsed).toEqual({
      selector: 'div',
      count: 4,
      elements: expect.arrayContaining([
        expect.objectContaining({
          tagName: 'div',
          id: 'container',
          textContent: expect.any(String)
        }),
        expect.objectContaining({
          tagName: 'div',
          className: 'immediate-element',
          textContent: 'Immediate element'
        }),
        expect.objectContaining({
          tagName: 'div',
          className: 'delayed-element',
          id: 'delayed-150',
          textContent: 'Delayed element after 150ms'
        }),
        expect.objectContaining({
          tagName: 'div',
          className: 'very-delayed-element',
          id: 'delayed-250',
          textContent: 'Very delayed element after 250ms'
        })
      ])
    })
  })
})
