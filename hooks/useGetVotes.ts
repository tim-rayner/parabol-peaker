import { useCallback, useEffect, useState } from "react"

import type { FullVoteMessage, Vote } from "~schemas/vote"

export const useGetVotes = () => {
  const [votes, setVotes] = useState<Vote[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchVotes = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      console.warn("Extension context not available")
      return
    }

    setIsLoading(true)
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_MESSAGES"
      })

      if (response?.messages) {
        const validVotes: Vote[] = []

        for (const msg of response.messages) {
          try {
            const parsedData = JSON.parse(msg.data) as FullVoteMessage

            // Push combined metadata and parsed data
            validVotes.push({
              id: msg.id,
              timestamp: msg.timestamp,
              type: msg.type,
              url: msg.url,
              data: parsedData
            })
          } catch (error) {
            console.warn("Skipping invalid vote message:", error)
          }
        }

        setVotes(validVotes)
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearVotes = useCallback(async () => {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      console.warn("Extension context not available")
      return
    }

    try {
      await chrome.runtime.sendMessage({ type: "CLEAR_MESSAGES" })
      setVotes([])
    } catch (error) {
      console.error("Failed to clear votes:", error)
    }
  }, [])

  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  useEffect(() => {
    const interval = setInterval(fetchVotes, 2000)
    return () => clearInterval(interval)
  }, [fetchVotes])

  return {
    votes,
    isLoading,
    fetchVotes,
    clearVotes
  }
}
