import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('fill-input tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('fill-input', {
      selector: 'input',
      value: 'test'
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

  it('should fill a text input field', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Fill Input Test</title>
</head>
<body>
    <form>
        <input type="text" id="username" name="username" />
    </form>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('fill-input', {
      selector: '#username',
      value: 'testuser'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: #username'
        }
      ]
    })

    // Verify the command succeeded
    expect(result.content[0].text).toContain('Successfully filled')
  })

  it('should return error when element not found', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body><div>No input here</div></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('fill-input', {
      selector: 'input',
      value: 'test'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No element found matching selector: input'
        }
      ],
      isError: true
    })
  })

  it('should fill a password input field', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Password Input Test</title>
</head>
<body>
    <form>
        <input type="password" id="password" name="password" />
    </form>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('fill-input', {
      selector: '#password',
      value: 'secret123'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: #password'
        }
      ]
    })

    // Verify the command succeeded - actual value verification would require additional tooling
    expect(result.content[0].text).toContain('Successfully filled')
  })

  it('should fill a textarea element', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Textarea Test</title>
</head>
<body>
    <form>
        <textarea id="message" name="message"></textarea>
    </form>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('fill-input', {
      selector: '#message',
      value: 'This is a test message'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: #message'
        }
      ]
    })

    // Verify the command succeeded
    expect(result.content[0].text).toContain('Successfully filled')
  })

  it('should fill input using name attribute selector', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Name Selector Test</title>
</head>
<body>
    <form>
        <input type="email" name="email" />
    </form>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('fill-input', {
      selector: 'input[name=email]',
      value: 'test@example.com'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: input[name=email]'
        }
      ]
    })

    // Verify the command succeeded
    expect(result.content[0].text).toContain('Successfully filled')
  })

  it('should replace existing value when filling', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Replace Value Test</title>
</head>
<body>
    <form>
        <input type="text" id="username" name="username" value="oldvalue" />
    </form>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('fill-input', {
      selector: '#username',
      value: 'newvalue'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: #username'
        }
      ]
    })

    // Verify the command succeeded
    expect(result.content[0].text).toContain('Successfully filled')
  })

  it('should fill multiple form fields', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Multiple Fields Test</title>
</head>
<body>
    <form id="contact-form">
        <input type="text" id="name" name="name" />
        <input type="email" id="email" name="email" />
        <textarea id="message" name="message"></textarea>
    </form>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    // Fill name field
    const nameResult = await client.callTool('fill-input', {
      selector: '#name',
      value: 'John Doe'
    })

    expect(nameResult).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: #name'
        }
      ]
    })

    // Fill email field
    const emailResult = await client.callTool('fill-input', {
      selector: '#email',
      value: 'john@example.com'
    })

    expect(emailResult).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: #email'
        }
      ]
    })

    // Fill message field
    const messageResult = await client.callTool('fill-input', {
      selector: '#message',
      value: 'Hello, this is a test message!'
    })

    expect(messageResult).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully filled element matching selector: #message'
        }
      ]
    })

    // Verify all commands succeeded
    expect(nameResult.content[0].text).toContain('Successfully filled')
    expect(emailResult.content[0].text).toContain('Successfully filled')
    expect(messageResult.content[0].text).toContain('Successfully filled')
  })
})
