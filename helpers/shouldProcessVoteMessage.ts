function shouldProcessVoteMessage(data) {
  try {
    return typeof data === "string" && data.includes("VoteForPokerStorySuccess")
  } catch {
    return false
  }
}

export default shouldProcessVoteMessage
