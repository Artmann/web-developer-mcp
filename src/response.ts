export interface MCPResponse {
  [x: string]: unknown
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
  >
  isError?: boolean
}

export function createResponse(
  text: string,
  isError: boolean = false
): MCPResponse {
  return {
    content: [{ type: 'text' as const, text }],
    ...(isError && { isError: true })
  }
}

export function createSuccessResponse(text: string): MCPResponse {
  return createResponse(text, false)
}

export function createErrorResponse(text: string): MCPResponse {
  return createResponse(text, true)
}

export function createImageResponse(
  data: Buffer,
  mimeType: string = 'image/png'
): MCPResponse {
  return {
    content: [
      { type: 'image' as const, data: data.toString('base64'), mimeType }
    ]
  }
}
