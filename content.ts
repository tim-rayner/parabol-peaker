// Content script for Parabol Peaker
// This script runs in the context of web pages

const toggle = true // later hook up to toggle, for now hard-coded

// Function to inject WebSocket interceptor into page context
const injectWebSocketInterceptor = () => {
  const script = document.createElement("script")
  script.src = chrome.runtime.getURL("injected.js")

  if (document.head) {
    document.head.appendChild(script)
  } else {
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
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
      chrome.runtime
        .sendMessage({
          type: "WEBSOCKET_MESSAGE",
          payload: event.data.payload
        })
        .then(() => {
          // Optionally log here
        })
        .catch(console.error)
    }
  }
}

// Helper to determine badge color based on avatar background
const getBadgeColor = (
  avatarSrc: string
): { background: string; text: string } => {
  // Extract color from avatar URL or use default
  // This is a simplified approach - you might want to analyze the actual image
  const colorMatch = avatarSrc.match(/color=([^&]+)/)
  const color = colorMatch ? decodeURIComponent(colorMatch[1]) : "#ff4757"

  // Determine if color is light or dark for contrast
  const hex = color.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  if (brightness > 128) {
    // Dark background, light text
    return { background: color, text: "#000000" }
  } else {
    // Light background, dark text
    return { background: color, text: "#ffffff" }
  }
}

// Helper to create and apply vote badge that overflows avatar
const createVoteBadge = (score: any, avatar: HTMLImageElement) => {
  const colors = getBadgeColor(avatar.src)

  // Create badge element
  const badge = document.createElement("div")
  badge.className = "pp-vote-badge"
  badge.textContent = score.label

  // Enhanced styling for smooth, native look
  badge.style.cssText = `
    position: fixed;
    background: ${colors.background};
    color: ${colors.text};
    border-radius: 12px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    border: 2px solid #ffffff;
    transform: scale(0);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    white-space: nowrap;
    min-width: 20px;
    text-align: center;
  `

  // Position badge over avatar (top right, overflowing)
  const rect = avatar.getBoundingClientRect()
  badge.style.top = `${rect.top - 10}px` // 10px above avatar
  badge.style.left = `${rect.right - 10}px` // 10px to the right of avatar

  // Append to body so it can overflow
  document.body.appendChild(badge)

  // Trigger smooth animation
  requestAnimationFrame(() => {
    badge.style.transform = "scale(1)"
    badge.style.opacity = "1"
  })

  return badge
}

// Helper to remove existing badges
const removeExistingBadges = () => {
  document.querySelectorAll(".pp-vote-badge").forEach((el) => {
    const badge = el as HTMLElement
    badge.style.transform = "scale(0)"
    badge.style.opacity = "0"

    setTimeout(() => {
      badge.remove()
    }, 300)
  })
}

// Helper to get the story points avatar container
const getStoryPointsAvatars = (): HTMLImageElement[] => {
  // Try to find the Story Points heading
  const headings = Array.from(
    document.querySelectorAll("div, h2, h3, h4, h5, h6")
  ).filter((el) => el.textContent?.trim() === "Story Points")
  for (const heading of headings) {
    // Look for avatars in the next sibling or parent container
    let container: HTMLElement | null = heading.parentElement
    for (let i = 0; i < 3 && container; i++) {
      const avatars = container.querySelectorAll?.('img[alt="Avatar"]')
      if (avatars && avatars.length > 0) {
        return Array.from(avatars) as HTMLImageElement[]
      }
      container = container.parentElement
    }
    // Try nextElementSibling as fallback
    if (heading.nextElementSibling) {
      const avatars =
        heading.nextElementSibling.querySelectorAll?.('img[alt="Avatar"]')
      if (avatars && avatars.length > 0) {
        return Array.from(avatars) as HTMLImageElement[]
      }
    }
  }
  // Fallback: select all avatars (should be rare)
  return Array.from(document.querySelectorAll('img[alt="Avatar"]'))
}

// Store last rendered state to avoid unnecessary re-renders
let lastVoteHash = ""
let lastAvatarSrcs: string[] = []

// Helper to overlay votes on avatars
const overlayVotes = async () => {
  if (!toggle) return

  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_MESSAGES" })
    const messages = response?.messages

    if (!messages || messages.length === 0) return

    const validVotes = []

    for (const msg of messages) {
      try {
        const rawData = JSON.parse(msg.data)

        const scores =
          rawData?.payload?.data?.meetingSubscription?.VoteForPokerStorySuccess
            ?.stage?.scores

        if (scores && Array.isArray(scores) && scores.length > 0) {
          validVotes.push({
            id: msg.id,
            timestamp: msg.timestamp,
            type: msg.type,
            url: msg.url,
            data: rawData
          })
        }
      } catch (error) {
        console.warn("Skipping invalid vote message in overlay:", error)
      }
    }

    if (validVotes.length === 0) return

    // Use latest valid vote
    const latestVote = validVotes[validVotes.length - 1]
    const scores =
      latestVote?.data?.payload?.data?.meetingSubscription
        ?.VoteForPokerStorySuccess?.stage?.scores || []

    // Get avatars only in the Story Points area
    const avatars = getStoryPointsAvatars()
    const avatarSrcs = avatars.map((a) => a.src)

    // Create a hash of the current vote state and avatar list
    const voteHash = JSON.stringify(
      scores.map((s: any) => ({ p: s.user.picture, l: s.label }))
    )

    // Only update if votes or avatars have changed
    if (
      voteHash === lastVoteHash &&
      JSON.stringify(avatarSrcs) === JSON.stringify(lastAvatarSrcs)
    ) {
      return
    }
    lastVoteHash = voteHash
    lastAvatarSrcs = avatarSrcs

    // Remove existing badges with smooth transition
    removeExistingBadges()

    // Add new badges with delay for staggered animation
    avatars.forEach((avatar, index) => {
      const src = avatar.src
      const score = scores.find((s: any) => s.user.picture === src)

      if (score) {
        setTimeout(() => {
          createVoteBadge(score, avatar)
        }, index * 50) // Staggered animation
      }
    })
  } catch (error) {
    console.error("Overlay votes error:", error)
  }
}

// Inject when document is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    injectWebSocketInterceptor()
    window.addEventListener("message", handleWebSocketMessage)
  })
} else {
  injectWebSocketInterceptor()
  window.addEventListener("message", handleWebSocketMessage)
}

// Periodically try to overlay votes if toggle enabled
if (toggle) {
  setInterval(() => {
    overlayVotes()
  }, 2000) // adjust as needed
}

// Send message to background script when Parabol is detected
if (window.location.hostname.includes("parabol")) {
  console.log("Parabol website detected")
  injectWebSocketInterceptor()
}
