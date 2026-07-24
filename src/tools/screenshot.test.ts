import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
])

function expectValidPngImageContent(content: unknown) {
  const image = content as { type: string; data: string; mimeType: string }

  expect(image.type).toEqual('image')
  expect(image.mimeType).toEqual('image/png')
  expect(image.data.length).toBeGreaterThan(0)

  const bytes = Buffer.from(image.data, 'base64')

  expect(bytes.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE)
}

describe('browser-screenshot tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('browser-screenshot', {})

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

  it('should return error when selector matches nothing', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('browser-screenshot', {
      selector: '#missing'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No element found matching selector: #missing'
        }
      ],
      isError: true
    })
  })

  it('should return error when selector and fullPage are combined', async () => {
    const result = await client.callTool('browser-screenshot', {
      selector: '#anything',
      fullPage: true
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: "The 'selector' and 'fullPage' parameters cannot be combined. Provide only one."
        }
      ],
      isError: true
    })
  })

  // Screenshot bytes aren't deterministic across environments/Playwright
  // versions, so these assertions are structural (valid PNG, expected
  // relative sizes) rather than exact `toEqual` on the whole response.

  it('should capture a viewport screenshot', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Screenshot Test</title></head>
<body style="margin:0">
    <div style="width:100vw;height:100vh;background:red"></div>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('browser-screenshot', {})

    expect(result.isError).toBeUndefined()
    expect(result.content.length).toEqual(1)
    expectValidPngImageContent(result.content[0])
  })

  it('should capture a larger image for fullPage than for the viewport', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Tall Page Test</title></head>
<body style="margin:0">
    <div style="width:100%;height:6000px;background:linear-gradient(red,blue)"></div>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const viewportResult = await client.callTool('browser-screenshot', {})
    const fullPageResult = await client.callTool('browser-screenshot', {
      fullPage: true
    })

    expectValidPngImageContent(viewportResult.content[0])
    expectValidPngImageContent(fullPageResult.content[0])

    const viewportImage = viewportResult.content[0] as { data: string }
    const fullPageImage = fullPageResult.content[0] as { data: string }

    expect(fullPageImage.data.length).toBeGreaterThan(
      viewportImage.data.length
    )
  })

  it('should capture a smaller image for a small element than for the viewport', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Element Screenshot Test</title></head>
<body style="margin:0">
    <div id="small" style="width:20px;height:20px;background:green"></div>
    <div style="width:100vw;height:100vh;background:linear-gradient(red,blue)"></div>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const elementResult = await client.callTool('browser-screenshot', {
      selector: '#small'
    })
    const viewportResult = await client.callTool('browser-screenshot', {})

    expectValidPngImageContent(elementResult.content[0])
    expectValidPngImageContent(viewportResult.content[0])

    const elementImage = elementResult.content[0] as { data: string }
    const viewportImage = viewportResult.content[0] as { data: string }

    expect(elementImage.data.length).toBeLessThan(viewportImage.data.length)
  })
})
