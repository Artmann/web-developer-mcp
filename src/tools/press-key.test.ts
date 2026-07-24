import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { MCPTestClient } from '../testing/mcp-test-client'

describe('press-key tool', () => {
  let client: MCPTestClient

  beforeEach(async () => {
    client = new MCPTestClient()
    await client.connect()
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('should return error when no page is loaded', async () => {
    const result = await client.callTool('press-key', {
      key: 'a'
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

  it('should send a keydown and keyup for the default press action', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Press Test</title></head>
<body>
    <div id="result"></div>
    <script>
        const result = document.getElementById('result');
        document.addEventListener('keydown', (e) => {
            result.textContent += 'down:' + e.key + ';';
        });
        document.addEventListener('keyup', (e) => {
            result.textContent += 'up:' + e.key + ';';
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('press-key', {
      key: 'a'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully pressed key: a'
        }
      ]
    })

    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(htmlResult.content[0].text).toContain('down:a;up:a;')
  })

  it('should hold a key down across separate down and up calls', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Hold Test</title></head>
<body>
    <div id="result">idle</div>
    <script>
        const result = document.getElementById('result');
        document.addEventListener('keydown', (e) => {
            result.textContent = 'held:' + e.key;
        });
        document.addEventListener('keyup', (e) => {
            result.textContent = 'released:' + e.key;
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const downResult = await client.callTool('press-key', {
      key: 'w',
      action: 'down'
    })

    expect(downResult).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully sent keydown for key: w'
        }
      ]
    })

    const heldHtml = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(heldHtml.content[0].text).toContain('held:w')

    const upResult = await client.callTool('press-key', {
      key: 'w',
      action: 'up'
    })

    expect(upResult).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully sent keyup for key: w'
        }
      ]
    })

    const releasedHtml = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(releasedHtml.content[0].text).toContain('released:w')
  })

  it('should hold two keys simultaneously via separate down calls', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Multi Hold Test</title></head>
<body>
    <div id="result"></div>
    <script>
        const held = new Set();
        const result = document.getElementById('result');
        document.addEventListener('keydown', (e) => {
            held.add(e.key);
            result.textContent = Array.from(held).sort().join(',');
        });
        document.addEventListener('keyup', (e) => {
            held.delete(e.key);
            result.textContent = Array.from(held).sort().join(',');
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    await client.callTool('press-key', { key: 'w', action: 'down' })
    await client.callTool('press-key', { key: 'a', action: 'down' })

    const bothHeldHtml = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(bothHeldHtml.content[0].text).toContain('a,w')

    await client.callTool('press-key', { key: 'w', action: 'up' })
    await client.callTool('press-key', { key: 'a', action: 'up' })

    const noneHeldHtml = await client.callTool('extract-html', {
      selector: '#result'
    })

    expect(noneHeldHtml.content[0].text).toContain('<div id="result"></div>')
  })

  it('should hold a key down for the requested duration', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Duration Test</title></head>
<body>
    <div id="result"></div>
    <script>
        const result = document.getElementById('result');
        let downAt = null;
        document.addEventListener('keydown', (e) => {
            downAt = performance.now();
        });
        document.addEventListener('keyup', (e) => {
            const heldFor = performance.now() - downAt;
            result.textContent = 'heldFor:' + Math.round(heldFor);
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('press-key', {
      key: 'w',
      durationMs: 300
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: "Successfully held key 'w' down for 300ms"
        }
      ]
    })

    const htmlResult = await client.callTool('extract-html', {
      selector: '#result'
    })

    const match = htmlResult.content[0].text.match(/heldFor:(\d+)/)
    expect(match).not.toBeNull()
    expect(Number(match![1])).toBeGreaterThanOrEqual(250)
  })

  it('should return error when durationMs is combined with action down', async () => {
    const result = await client.callTool('press-key', {
      key: 'w',
      action: 'down',
      durationMs: 200
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: "The 'durationMs' parameter can only be used with action 'press'. It is not valid with action 'down'."
        }
      ],
      isError: true
    })
  })

  it('should return error when durationMs is combined with action up', async () => {
    const result = await client.callTool('press-key', {
      key: 'w',
      action: 'up',
      durationMs: 200
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: "The 'durationMs' parameter can only be used with action 'press'. It is not valid with action 'up'."
        }
      ],
      isError: true
    })
  })

  it('should support modifier combos with the press action', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Combo Test</title></head>
<body>
    <input type="text" id="test-input" />
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    await client.callTool('click-element', { selector: '#test-input' })

    const result = await client.callTool('press-key', {
      key: 'Shift+A'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully pressed key: Shift+A'
        }
      ]
    })

    const htmlResult = await client.callTool('extract-html', {
      selector: '#test-input'
    })

    expect(htmlResult.content[0].text).toContain('value="A"')
  })

  it('should dismiss an overlay on Escape', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Escape Test</title></head>
<body>
    <div id="overlay">Overlay open</div>
    <script>
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('overlay').textContent = 'dismissed';
            }
        });
    </script>
</body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('press-key', {
      key: 'Escape'
    })

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Successfully pressed key: Escape'
        }
      ]
    })

    const htmlResult = await client.callTool('extract-html', {
      selector: '#overlay'
    })

    expect(htmlResult.content[0].text).toContain('dismissed')
  })

  it('should return an error for an unknown key', async () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body></body>
</html>`

    await client.callTool('browser-navigate', {
      url: `data:text/html;base64,${Buffer.from(htmlContent).toString('base64')}`
    })

    const result = await client.callTool('press-key', {
      key: 'NotARealKey12345'
    })

    // The exact message comes from Playwright's own key-resolution logic,
    // so only the error shape is asserted here, not the specific text.
    expect(result.isError).toBe(true)
    expect(result.content[0].type).toBe('text')
  })
})
