import { useEffect, useState } from "react"

export const useIsParabolSession = () => {
  const [isInParabolSession, setIsInParabolSession] = useState(false)

  function isValidParabolSessionUrl(url: string): boolean {
    const regex = /^https?:\/\/action\.parabol\.co\/meet\/[^/]+\/estimate\/.+$/
    return regex.test(url)
  }

  useEffect(() => {
    // Check if we're in a valid extension context
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      console.warn("Extension context not available")
      setIsInParabolSession(false)
      return
    }

    const checkActiveTabUrl = async () => {
      try {
        // Get the active tab
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })

        if (activeTab?.url) {
          setIsInParabolSession(isValidParabolSessionUrl(activeTab.url))
        } else {
          setIsInParabolSession(false)
        }
      } catch (error) {
        console.error("Error checking active tab URL:", error)
        setIsInParabolSession(false)
      }
    }

    checkActiveTabUrl()

    // Listen for tab updates
    const handleTabUpdate = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.status === "complete" && tab.url) {
        setIsInParabolSession(isValidParabolSessionUrl(tab.url))
      }
    }

    // Listen for tab activation
    const handleTabActivated = async (
      activeInfo: chrome.tabs.TabActiveInfo
    ) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId)
        if (tab.url) {
          setIsInParabolSession(isValidParabolSessionUrl(tab.url))
        }
      } catch (error) {
        console.error("Error getting active tab:", error)
        setIsInParabolSession(false)
      }
    }

    // Add event listeners with error handling
    try {
      chrome.tabs.onUpdated.addListener(handleTabUpdate)
      chrome.tabs.onActivated.addListener(handleTabActivated)
    } catch (error) {
      console.error("Error adding tab event listeners:", error)
    }

    return () => {
      // Cleanup event listeners with error handling
      try {
        chrome.tabs.onUpdated.removeListener(handleTabUpdate)
        chrome.tabs.onActivated.removeListener(handleTabActivated)
      } catch (error) {
        console.error("Error removing tab event listeners:", error)
      }
    }
  }, [])

  return isInParabolSession
}
