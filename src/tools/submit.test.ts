import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('submit-form tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('submit-form', {
      selector: 'form'
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

  it('should submit a form element', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Form Submit Test</title>
</head>
<body>
    <form id="test-form">
        <input type="text" name="username" value="testuser" />
        <button type="submit">Submit</button>
    </form>
    <div id="result"></div>
    <script>
        document.getElementById('test-form').addEventListener('submit', (e) => {
            e.preventDefault();
            document.getElementById('result').textContent = 'Form submitted!';
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('submit-form', {
      selector: '#test-form'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully submitted form matching selector: #test-form'
        }
      ]
    })

    // Verify the form was submitted
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Form submitted!')
  })

  it('should return error when element not found', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body><div>No form here</div></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('submit-form', {
      selector: 'form'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No element found matching selector: form'
        }
      ],
      isError: true
    })
  })

  it('should return error when element is not a form', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body><div id="not-a-form">This is not a form</div></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('submit-form', {
      selector: '#not-a-form'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Element is not a form')
        }
      ],
      isError: true
    })
  })

  it('should submit form using name attribute selector', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Named Form Test</title>
</head>
<body>
    <form name="contact-form">
        <input type="text" name="email" value="test@example.com" />
        <button type="submit">Submit</button>
    </form>
    <div id="result"></div>
    <script>
        document.querySelector('form[name="contact-form"]').addEventListener('submit', (e) => {
            e.preventDefault();
            document.getElementById('result').textContent = 'Contact form submitted!';
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('submit-form', {
      selector: 'form[name="contact-form"]'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully submitted form matching selector: form[name="contact-form"]'
        }
      ]
    })

    // Verify the form was submitted
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Contact form submitted!')
  })

  it('should handle delayed form submission effects', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Delayed Submit Test</title>
</head>
<body>
    <form id="delayed-form">
        <input type="text" name="data" value="test" />
        <button type="submit">Submit</button>
    </form>
    <div id="result"></div>
    <script>
        document.getElementById('delayed-form').addEventListener('submit', (e) => {
            e.preventDefault();
            setTimeout(() => {
                document.getElementById('result').textContent = 'Processing complete!';
            }, 200);
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('submit-form', {
      selector: '#delayed-form'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully submitted form matching selector: #delayed-form'
        }
      ]
    })

    // Verify the delayed effect occurred
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Processing complete!')
  })

  it('should submit login form after filling fields', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login Form Test</title>
</head>
<body>
    <form id="login-form">
        <input type="text" id="username" name="username" />
        <input type="password" id="password" name="password" />
        <button type="submit">Login</button>
    </form>
    <div id="result"></div>
    <script>
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            document.getElementById('result').textContent = 'Logged in as ' + username;
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Fill the form fields
    await client.callTool('fill-input', {
      selector: '#username',
      value: 'testuser'
    })

    await client.callTool('fill-input', {
      selector: '#password',
      value: 'password123'
    })

    // Submit the form
    const result = await client.callTool('submit-form', {
      selector: '#login-form'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully submitted form matching selector: #login-form'
        }
      ]
    })

    // Verify the form submission used the filled values
    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('Logged in as testuser')
  })
})
