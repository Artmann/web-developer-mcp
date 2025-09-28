import { BrowserManager } from './browser/BrowserManager'
import { Server } from './server'

async function main() {
  try {
    const server = new Server()

    await server.start()
  } catch (error) {
    console.error('Fatal error:', error)

    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  console.error('Received SIGINT, shutting down gracefully...')

  const browserManager = BrowserManager.getInstance()

  await browserManager.close()

  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.error('Received SIGTERM, shutting down gracefully...')

  const browserManager = BrowserManager.getInstance()

  await browserManager.close()

  process.exit(0)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)

  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)

  process.exit(1)
})

main()
