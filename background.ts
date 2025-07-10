// Background script for Parabol Peaker
// Handles intercepted WebSocket messages and provides storage

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

interface WebSocketMessage {
  id: string
  timestamp: number
  type: "incoming" | "outgoing"
  data: any
  url: string
}

// Store intercepted messages
const interceptedMessages: WebSocketMessage[] = []

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "WEBSOCKET_MESSAGE") {
    const wsMessage: WebSocketMessage = message.payload

    // Store the message
    interceptedMessages.push(wsMessage)

    // Keep only the last 1000 messages to prevent memory issues
    if (interceptedMessages.length > 1000) {
      interceptedMessages.splice(0, interceptedMessages.length - 1000)
    }

    // Send response to acknowledge receipt
    sendResponse({ success: true })
  }

  // Handle requests for stored messages
  if (message.type === "GET_MESSAGES") {
    sendResponse({ messages: interceptedMessages })
  }

  // Handle requests to clear messages
  if (message.type === "CLEAR_MESSAGES") {
    interceptedMessages.length = 0
    sendResponse({ success: true })
  }
})

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Parabol Peaker extension installed")
  // Initialize default toggle state
  storage.set("parabol-peaker-toggle", true)
})

// Handle tab updates to ensure content script is injected
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("parabol")) {
    console.log("Parabol tab detected, ensuring content script is active")
  }
})

// Listen for storage changes and notify content scripts
storage.watch({
  "parabol-peaker-toggle": (c) => {
    // Notify all Parabol tabs about the toggle change
    chrome.tabs.query({ url: "*://*.parabol.co/*" }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "TOGGLE_CHANGED",
              enabled: c.newValue
            })
            .catch(() => {
              // Ignore errors if content script is not ready
            })
        }
      })
    })
  }
})
