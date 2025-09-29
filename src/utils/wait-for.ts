/**
 * Utility function to wait for a specified amount of time
 * @param milliseconds - The number of milliseconds to wait
 * @returns A promise that resolves after the specified time
 */
export function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
