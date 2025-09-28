import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { resolve } from 'path'

export class MCPTestClient {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null

  async connect(): Promise<void> {
    // Create transport that will spawn the server process
    this.transport = new StdioClientTransport({
      command: 'bun',
      args: [resolve(process.cwd(), 'src/index.ts')],
      env: {
        ...process.env,
        HEADLESS: 'true'
      }
    })

    // Create and connect client
    this.client = new Client({
      name: 'test-client',
      version: '1.0.0'
    })

    await this.client.connect(this.transport)
  }

  async callTool(
    name: string,
    arguments_: Record<string, any> = {}
  ): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.')
    }

    return await this.client.callTool({
      name,
      arguments: arguments_
    })
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
    }

    if (this.transport) {
      await this.transport.close()
      this.transport = null
    }
  }
}
