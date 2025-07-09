export interface User {
  id: string
  preferredName: string
  picture: string
}

export interface Score {
  userId: string
  label: string
  id: string
  user: User
}

export interface Stage {
  id: string
  scores: Score[]
}

export interface VoteForPokerStory {
  __typename: "VoteForPokerStorySuccess"
  stage: Stage
}

export interface VoteData {
  voteForPokerStory: VoteForPokerStory
}

export interface Payload {
  data: VoteData
}

export interface FullVoteMessage {
  type: string
  payload: Payload
}

export interface VoteMessageMetadata {
  id: string
  timestamp: number
  type: "incoming" | "outgoing"
  url: string
}

export type Vote = VoteMessageMetadata & {
  data: FullVoteMessage
}
