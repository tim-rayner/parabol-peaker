// Content script for Parabol Peaker
// This script runs in the context of web pages

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

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

// Listen for toggle changes from background script
const handleToggleChange = (message: any) => {
  if (message.type === "TOGGLE_CHANGED") {
    // Immediately remove badges if disabled
    if (!message.enabled) {
      removeExistingBadges()
    } else {
      // Clear cached state to force re-processing of existing votes
      lastVoteHash = ""
      lastAvatarSrcs = []
      lastCurrentUserAvatar = null
      // Immediately re-run overlay logic when enabled
      overlayVotes()
    }
  }
}

// Helper to identify the current user's avatar
const getCurrentUserAvatar = (): string | null => {
  // Look for the current user's avatar in the UI
  // Common selectors for current user avatar in Parabol
  const selectors = [
    // Look for avatar with "You" or current user indicators
    'img[alt*="You"]',
    'img[alt*="your avatar"]',
    'img[alt*="current user"]',
    // Look for avatar in user menu or profile area
    '[data-testid*="user"] img[alt="Avatar"]',
    '[data-testid*="profile"] img[alt="Avatar"]',
    // Look for avatar with special classes that might indicate current user
    '.current-user img[alt="Avatar"]',
    '.user-profile img[alt="Avatar"]',
    // Look for avatar in header/navigation
    'header img[alt="Avatar"]',
    'nav img[alt="Avatar"]',
    // Look for avatar with "me" or "my" indicators
    'img[alt*="me"]',
    'img[alt*="my"]',
    // Look for avatar in user dropdown or menu
    '[role="button"] img[alt="Avatar"]',
    '[aria-haspopup="true"] img[alt="Avatar"]'
  ]

  for (const selector of selectors) {
    const avatar = document.querySelector(selector) as HTMLImageElement
    if (avatar && avatar.src) {
      console.log(
        "Found current user avatar via selector:",
        selector,
        avatar.src
      )
      return avatar.src
    }
  }

  // Fallback: try to find avatar that's highlighted or has special styling
  const allAvatars = document.querySelectorAll('img[alt="Avatar"]')
  for (const avatar of allAvatars) {
    const img = avatar as HTMLImageElement
    const computedStyle = window.getComputedStyle(img)

    // Check if this avatar has special styling that might indicate current user
    if (
      computedStyle.border.includes("2px") ||
      computedStyle.boxShadow !== "none" ||
      img.closest('[data-testid*="current"]') ||
      img.closest('[class*="current"]') ||
      img.closest('[class*="active"]') ||
      img.closest('[class*="me"]') ||
      img.closest('[class*="user"]')
    ) {
      console.log("Found current user avatar via styling:", img.src)
      return img.src
    }
  }

  // Additional fallback: look for avatar in user menu or profile sections
  const userMenuSelectors = [
    '[data-testid*="menu"] img[alt="Avatar"]',
    '[data-testid*="dropdown"] img[alt="Avatar"]',
    '.user-menu img[alt="Avatar"]',
    '.profile-menu img[alt="Avatar"]'
  ]

  for (const selector of userMenuSelectors) {
    const avatar = document.querySelector(selector) as HTMLImageElement
    if (avatar && avatar.src) {
      console.log("Found current user avatar in menu:", avatar.src)
      return avatar.src
    }
  }

  console.log("Could not identify current user avatar")
  return null
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
let lastCurrentUserAvatar: string | null = null

// Helper to overlay votes on avatars
const overlayVotes = async () => {
  // Check if toggle is enabled
  const isEnabled = await storage.get("parabol-peaker-toggle")
  if (!isEnabled) {
    // Remove existing badges when disabled
    removeExistingBadges()
    return
  }

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

    // Get current user's avatar to filter out their votes
    const currentUserAvatar = getCurrentUserAvatar()
    console.log("Current user avatar:", currentUserAvatar)

    // Filter out current user's votes
    const otherUsersScores = currentUserAvatar
      ? scores.filter((score: any) => score.user.picture !== currentUserAvatar)
      : scores

    console.log(
      "All scores:",
      scores.length,
      "Other users scores:",
      otherUsersScores.length
    )

    // Get avatars only in the Story Points area
    const avatars = getStoryPointsAvatars()
    const avatarSrcs = avatars.map((a) => a.src)
    console.log(
      "Found avatars:",
      avatarSrcs.length,
      "Current user avatar in avatars:",
      avatarSrcs.includes(currentUserAvatar || "")
    )

    // Create a hash that includes current user avatar to detect changes
    const voteHash = JSON.stringify({
      scores: otherUsersScores.map((s: any) => ({
        p: s.user.picture,
        l: s.label,
        id: s.id
      })),
      currentUser: currentUserAvatar,
      timestamp: latestVote.timestamp
    })

    // Check if anything has changed (votes, avatars, or current user)
    const hasChanged =
      voteHash !== lastVoteHash ||
      JSON.stringify(avatarSrcs) !== JSON.stringify(lastAvatarSrcs) ||
      currentUserAvatar !== lastCurrentUserAvatar

    if (!hasChanged) {
      return
    }

    // Update cached state
    lastVoteHash = voteHash
    lastAvatarSrcs = avatarSrcs
    lastCurrentUserAvatar = currentUserAvatar

    // Remove existing badges with smooth transition
    removeExistingBadges()

    // Add new badges with delay for staggered animation
    avatars.forEach((avatar, index) => {
      const src = avatar.src

      // Skip if this is the current user's avatar - NEVER show badges on current user
      if (currentUserAvatar && src === currentUserAvatar) {
        console.log("Skipping current user avatar:", src)
        return
      }

      // Only show badges for other users' votes
      const score = otherUsersScores.find((s: any) => s.user.picture === src)

      if (score) {
        console.log("Adding badge for avatar:", src, "with score:", score.label)
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

// Listen for messages from background script
if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  chrome.runtime.onMessage.addListener(handleToggleChange)
}

// Periodically try to overlay votes
setInterval(() => {
  overlayVotes()
}, 2000) // adjust as needed

// Send message to background script when Parabol is detected
if (window.location.hostname.includes("parabol")) {
  console.log("Parabol website detected")
  injectWebSocketInterceptor()
}
