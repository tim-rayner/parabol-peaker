import { useCallback, useEffect, useState } from "react"

export interface WebSocketMessage {
  id: string
  timestamp: number
  type: "incoming" | "outgoing"
  data: any
  url: string
}

export const useWebSocketInterceptor = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [isIntercepting, setIsIntercepting] = useState(false)

  const injectWebSocketInterceptor = useCallback(async () => {
    try {
      // Inject the WebSocket interceptor script into the page context
      await chrome.scripting.executeScript({
        target: {
          tabId: (
            await chrome.tabs.query({ active: true, currentWindow: true })
          )[0].id!
        },
        func: () => {
          // Store original WebSocket constructor
          const OriginalWebSocket = window.WebSocket

          // Create a message queue for communication with content script
          const messageQueue: any[] = []
          const processQueue = () => {
            while (messageQueue.length > 0) {
              const message = messageQueue.shift()
              window.postMessage(
                { type: "WEBSOCKET_INTERCEPT", payload: message },
                "*"
              )
            }
          }

          // Override WebSocket constructor
          window.WebSocket = function (
            url: string,
            protocols?: string | string[]
          ) {
            const ws = new OriginalWebSocket(url, protocols)

            // Only intercept Parabol WebSocket connections
            if (url.includes("action.parabol.co")) {
              // Store original methods
              const originalSend = ws.send
              const originalAddEventListener = ws.addEventListener
              const originalRemoveEventListener = ws.removeEventListener

              // Override send method to intercept outgoing messages
              ws.send = function (
                data: string | ArrayBufferLike | Blob | ArrayBufferView
              ) {
                const message = {
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  type: "outgoing" as const,
                  data: typeof data === "string" ? data : "[Binary data]",
                  url: url
                }

                messageQueue.push(message)
                processQueue()

                return originalSend.call(this, data)
              }

              // Override addEventListener to intercept incoming messages
              ws.addEventListener = function (
                type: string,
                listener: EventListener,
                options?: boolean | AddEventListenerOptions
              ) {
                if (type === "message") {
                  const wrappedListener = (event: MessageEvent) => {
                    const message = {
                      id: crypto.randomUUID(),
                      timestamp: Date.now(),
                      type: "incoming" as const,
                      data: event.data,
                      url: url
                    }

                    messageQueue.push(message)
                    processQueue()

                    return listener.call(this, event)
                  }

                  return originalAddEventListener.call(
                    this,
                    type,
                    wrappedListener,
                    options
                  )
                }

                return originalAddEventListener.call(
                  this,
                  type,
                  listener,
                  options
                )
              }

              // Preserve removeEventListener
              ws.removeEventListener = originalRemoveEventListener
            }

            return ws
          } as any

          // Copy static properties from original WebSocket
          Object.setPrototypeOf(window.WebSocket, OriginalWebSocket)
          Object.getOwnPropertyNames(OriginalWebSocket).forEach((prop) => {
            if (prop !== "prototype" && prop !== "length" && prop !== "name") {
              ;(window.WebSocket as any)[prop] = (OriginalWebSocket as any)[
                prop
              ]
            }
          })
        }
      })

      setIsIntercepting(true)
    } catch (error) {
      console.error("❌ Failed to inject WebSocket interceptor:", error)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  useEffect(() => {
    // Listen for intercepted WebSocket messages from the page context
    const handleWebSocketMessage = (event: MessageEvent) => {
      if (event.data?.type === "WEBSOCKET_INTERCEPT") {
        setMessages((prev) => [...prev, event.data.payload])
      }
    }

    window.addEventListener("message", handleWebSocketMessage)

    return () => {
      window.removeEventListener("message", handleWebSocketMessage)
    }
  }, [])

  return {
    messages,
    isIntercepting,
    injectWebSocketInterceptor,
    clearMessages
  }
}
