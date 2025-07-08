// Content script for Parabol Peaker
// This script runs in the context of web pages

console.log("Parabol Peaker content script loaded")

// Monitor for Parabol-specific network requests
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === "resource") {
      const resourceEntry = entry as PerformanceResourceTiming
      if (
        resourceEntry.name.includes("parabol") ||
        resourceEntry.name.includes("socket")
      ) {
        console.log("Parabol network request detected:", resourceEntry.name)
      }
    }
  }
})

observer.observe({ entryTypes: ["resource"] })

// Send message to background script when Parabol is detected
if (window.location.hostname.includes("parabol")) {
  console.log("Parabol website detected")
}
