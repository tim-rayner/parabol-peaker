import { useMemo } from "react"

import {
  useBackgroundMessages,
  type WebSocketMessage
} from "./useBackgroundMessages"

export interface VoteData {
  userId: string
  vote: string
  timestamp: number
  meetingId: string
}

export const useGetVotes = () => {
  const { messages } = useBackgroundMessages()

  const votes = useMemo(() => {
    const voteData: VoteData[] = []

    messages.forEach((message: WebSocketMessage) => {
      try {
        // Parse message data
        const data =
          typeof message.data === "string"
            ? JSON.parse(message.data)
            : message.data

        // Look for voting-related messages
        if (data?.payload?.type === "Vote" || data?.payload?.type === "vote") {
          const payload = data.payload

          if (payload.userId && payload.vote !== undefined) {
            voteData.push({
              userId: payload.userId,
              vote: payload.vote,
              timestamp: message.timestamp,
              meetingId: payload.meetingId || "unknown"
            })
          }
        }

        // Also check for GraphQL subscription messages that might contain vote data
        if (data?.type === "data" && data?.payload?.data?.vote) {
          const votePayload = data.payload.data.vote

          if (votePayload.userId && votePayload.vote !== undefined) {
            voteData.push({
              userId: votePayload.userId,
              vote: votePayload.vote,
              timestamp: message.timestamp,
              meetingId: votePayload.meetingId || "unknown"
            })
          }
        }
      } catch (error) {
        // Silently ignore parsing errors
        console.debug("Failed to parse message for vote data:", error)
      }
    })

    return voteData
  }, [messages])

  const getVotesByUser = (userId: string) => {
    return votes.filter((vote) => vote.userId === userId)
  }

  const getLatestVotes = () => {
    // Group by user and get the latest vote for each
    const latestVotes = new Map<string, VoteData>()

    votes.forEach((vote) => {
      const existing = latestVotes.get(vote.userId)
      if (!existing || vote.timestamp > existing.timestamp) {
        latestVotes.set(vote.userId, vote)
      }
    })

    return Array.from(latestVotes.values())
  }

  const getVoteSummary = () => {
    const latestVotes = getLatestVotes()
    const voteCounts = new Map<string, number>()

    latestVotes.forEach((vote) => {
      const count = voteCounts.get(vote.vote) || 0
      voteCounts.set(vote.vote, count + 1)
    })

    return Array.from(voteCounts.entries()).map(([vote, count]) => ({
      vote,
      count,
      percentage: (count / latestVotes.length) * 100
    }))
  }

  return {
    votes,
    getVotesByUser,
    getLatestVotes,
    getVoteSummary,
    totalVotes: votes.length,
    uniqueVoters: new Set(votes.map((v) => v.userId)).size
  }
}
