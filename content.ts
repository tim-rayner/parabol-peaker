// Content script for Parabol Peaker
// This script runs in the context of web pages

console.log("Parabol Peaker content script loaded")

// Send message to background script when Parabol is detected
if (window.location.hostname.includes("parabol")) {
  console.log("Parabol website detected")
}
