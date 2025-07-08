;(function () {
  // Store original WebSocket constructor
  const OriginalWebSocket = window.WebSocket

  // Create a message queue for communication with content script
  const messageQueue = []
  const processQueue = () => {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift()
      window.postMessage({ type: "WEBSOCKET_INTERCEPT", payload: message }, "*")
    }
  }

  // Override WebSocket constructor
  window.WebSocket = function (url, protocols) {
    const ws = new OriginalWebSocket(url, protocols)

    // Only intercept Parabol WebSocket connections
    if (url.includes("action.parabol.co")) {
      console.log("🔍 Parabol WebSocket intercepted:", url)

      // Store original methods
      const originalSend = ws.send
      const originalAddEventListener = ws.addEventListener
      const originalRemoveEventListener = ws.removeEventListener

      // Override send method to intercept outgoing messages
      ws.send = function (data) {
        const message = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: "outgoing",
          data: typeof data === "string" ? data : "[Binary data]",
          url: url
        }

        messageQueue.push(message)
        processQueue()

        console.log("📤 Outgoing WebSocket message:", message)
        return originalSend.call(this, data)
      }

      // Override addEventListener to intercept incoming messages
      ws.addEventListener = function (type, listener, options) {
        if (type === "message") {
          const wrappedListener = (event) => {
            const message = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "incoming",
              data: event.data,
              url: url
            }

            messageQueue.push(message)
            processQueue()

            console.log("📥 Incoming WebSocket message:", message)
            return listener.call(this, event)
          }

          return originalAddEventListener.call(
            this,
            type,
            wrappedListener,
            options
          )
        }

        return originalAddEventListener.call(this, type, listener, options)
      }

      // Preserve removeEventListener
      ws.removeEventListener = originalRemoveEventListener
    }

    return ws
  }

  // Copy static properties from original WebSocket
  Object.setPrototypeOf(window.WebSocket, OriginalWebSocket)
  Object.getOwnPropertyNames(OriginalWebSocket).forEach((prop) => {
    if (prop !== "prototype" && prop !== "length" && prop !== "name") {
      window.WebSocket[prop] = OriginalWebSocket[prop]
    }
  })

  console.log("🔧 WebSocket interceptor injected successfully")
})()
