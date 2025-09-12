// Request deduplication utility to prevent multiple identical API calls
class RequestDeduplication {
  private pendingRequests = new Map<string, Promise<any>>()

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Create new request
    const requestPromise = requestFn()
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key)
      })

    // Store the promise
    this.pendingRequests.set(key, requestPromise)

    return requestPromise
  }

  // Clear all pending requests (useful for cleanup)
  clear() {
    this.pendingRequests.clear()
  }

  // Get count of pending requests
  getPendingCount(): number {
    return this.pendingRequests.size
  }
}

// Global instance
export const requestDeduplication = new RequestDeduplication()

// Helper function for API calls
export async function deduplicatedRequest<T>(
  endpoint: string,
  requestFn: () => Promise<T>
): Promise<T> {
  return requestDeduplication.deduplicate(endpoint, requestFn)
}
