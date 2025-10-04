import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('click-element tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('click-element', {
      selector: 'button'
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

  it('should click a button element', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Click Test</title>
</head>
<body>
    <button id="test-btn">Click Me</button>
    <div id="result"></div>
    <script>
        document.getElementById('test-btn').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Button clicked!';
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('click-element', {
      selector: '#test-btn'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully clicked element matching selector: #test-btn'
        }
      ]
    })

    // Verify the click had an effect
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Button clicked!')
  })

  it('should return error when element not found', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body><div>No button here</div></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('click-element', {
      selector: 'button'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No element found matching selector: button'
        }
      ],
      isError: true
    })
  })

  it('should click a link element', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Link Click Test</title>
</head>
<body>
    <a href="#" id="test-link">Click Link</a>
    <div id="result"></div>
    <script>
        document.getElementById('test-link').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('result').textContent = 'Link clicked!';
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('click-element', {
      selector: '#test-link'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully clicked element matching selector: #test-link'
        }
      ]
    })

    // Verify the click had an effect
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Link clicked!')
  })

  it('should handle clicks that trigger delayed JavaScript', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Delayed Click Test</title>
</head>
<body>
    <button id="delayed-btn">Click Me</button>
    <div id="result"></div>
    <script>
        document.getElementById('delayed-btn').addEventListener('click', () => {
            setTimeout(() => {
                document.getElementById('result').textContent = 'Delayed response!';
            }, 200);
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('click-element', {
      selector: '#delayed-btn'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully clicked element matching selector: #delayed-btn'
        }
      ]
    })

    // Verify the delayed effect occurred
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Delayed response!')
  })

  it('should click elements with class selectors', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Class Selector Test</title>
</head>
<body>
    <button class="submit-btn primary">Submit</button>
    <div id="result"></div>
    <script>
        document.querySelector('.submit-btn').addEventListener('click', () => {
            document.getElementById('result').textContent = 'Form submitted!';
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('click-element', {
      selector: '.submit-btn'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully clicked element matching selector: .submit-btn'
        }
      ]
    })

    // Verify the click had an effect
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Form submitted!')
  })
})
