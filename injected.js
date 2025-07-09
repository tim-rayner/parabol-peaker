;(function () {
  const relevantMessages = ["VoteForPokerStorySuccess"]

  const OriginalWebSocket = window.WebSocket
  const originalAddEventListener = OriginalWebSocket.prototype.addEventListener
  const originalSend = OriginalWebSocket.prototype.send

  const messageQueue = []
  const processQueue = () => {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift()
      window.postMessage({ type: "WEBSOCKET_INTERCEPT", payload: message }, "*")
    }
  }

  OriginalWebSocket.prototype.send = function (data) {
    if (this.url?.includes("action.parabol.co")) {
      const message = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "outgoing",
        data: typeof data === "string" ? data : "[Binary data]",
        url: this.url
      }
      console.log("📤 Outgoing WS message:", message)
    }
    return originalSend.call(this, data)
  }

  OriginalWebSocket.prototype.addEventListener = function (
    type,
    listener,
    options
  ) {
    if (type === "message" && this.url?.includes("action.parabol.co")) {
      const wrappedListener = (event) => {
        if (
          typeof event.data === "string" &&
          event.data.includes('fieldName":"VoteForPokerStorySuccess')
        ) {
          const message = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: "incoming",
            data: event.data,
            url: this.url
          }
          messageQueue.push(message)
          processQueue()
          console.log("📥 Incoming WS message (prototype):", message)
        }
        return listener.call(this, event)
      }
      return originalAddEventListener.call(this, type, wrappedListener, options)
    }
    return originalAddEventListener.call(this, type, listener, options)
  }

  Object.defineProperty(OriginalWebSocket.prototype, "onmessage", {
    set(value) {
      if (this.url?.includes("action.parabol.co")) {
        const wrappedHandler = (event) => {
          if (
            typeof event.data === "string" &&
            relevantMessages.some((msg) => event.data.includes(msg))
          ) {
            const message = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "incoming",
              data: event.data,
              url: this.url
            }
            messageQueue.push(message)
            processQueue()
            console.log(
              "📥 Incoming WS message (onmessage prototype):",
              message
            )
          }
          return value.call(this, event)
        }
        this.addEventListener("message", wrappedHandler)
      } else {
        this.addEventListener("message", value)
      }
    },
    configurable: true
  })

  console.log("🔧 Global WebSocket prototype patched successfully (filtered)")
})()
