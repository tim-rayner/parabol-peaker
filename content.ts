// Content script for Parabol Peaker
// This script runs in the context of web pages

// Function to inject WebSocket interceptor into page context
const injectWebSocketInterceptor = () => {
  // Create script element to inject external file
  const script = document.createElement("script")
  script.src = chrome.runtime.getURL("injected.js")

  // Inject script at the beginning of the document
  if (document.head) {
    document.head.appendChild(script)
  } else {
    // If head doesn't exist yet, wait for it
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          const head = document.querySelector("head")
          if (head) {
            head.appendChild(script)
            observer.disconnect()
          }
        }
      })
    })

    observer.observe(document, { childList: true, subtree: true })
  }
}

// Listen for intercepted WebSocket messages from the page context
const handleWebSocketMessage = (event: MessageEvent) => {
  if (event.data?.type === "WEBSOCKET_INTERCEPT") {
    // Send message to background script for processing
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
      chrome.runtime
        .sendMessage({
          type: "WEBSOCKET_MESSAGE",
          payload: event.data.payload
        })
        .catch(console.error)
    }
  }
}

// Initialize interceptor when document is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    injectWebSocketInterceptor()
    window.addEventListener("message", handleWebSocketMessage)
  })
} else {
  injectWebSocketInterceptor()
  window.addEventListener("message", handleWebSocketMessage)
}

// Send message to background script when Parabol is detected
if (window.location.hostname.includes("parabol")) {
  console.log("Parabol website detected")

  // Also inject immediately for Parabol sites
  injectWebSocketInterceptor()
}
