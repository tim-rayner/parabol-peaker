import { useCallback, useEffect, useState } from "react"

export interface WebSocketMessage {
  id: string
  timestamp: number
  type: "incoming" | "outgoing"
  data: any
  url: string
}

export const useBackgroundMessages = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      console.warn("Extension context not available")
      return
    }

    setIsLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_MESSAGES"
      })
      if (response?.messages) {
        setMessages(response.messages)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearMessages = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      console.warn("Extension context not available")
      return
    }

    try {
      await chrome.runtime.sendMessage({ type: "CLEAR_MESSAGES" })
      setMessages([])
    } catch (error) {
      console.error("Failed to clear messages:", error)
    }
  }, [])

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Set up periodic refresh (every 2 seconds)
  useEffect(() => {
    const interval = setInterval(fetchMessages, 2000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  return {
    messages,
    isLoading,
    fetchMessages,
    clearMessages
  }
}
