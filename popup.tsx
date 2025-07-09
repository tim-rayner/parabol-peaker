import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography
} from "@mui/material"
import { useEffect, useState } from "react"

import { useGetVotes } from "./hooks/useGetVotes"
import { useIsParabolSession } from "./hooks/useIsParabolSession"

import "./style.css"

function IndexPopup() {
  const [error, setError] = useState<string | null>(null)

  const isInParabolSession = useIsParabolSession()
  const { votes, isLoading, fetchVotes, clearVotes } = useGetVotes()

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Extension error:", event.error)
      setError("Extension context error occurred. Please reload the extension.")
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatMessageData = (data: any) => {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return data
      }
    }
    return JSON.stringify(data, null, 2)
  }

  const getMessageTypeColor = (type: "incoming" | "outgoing") => {
    return type === "incoming" ? "success" : "primary"
  }

  if (error) {
    return (
      <div className="p-4 w-80">
        <Card className="mb-4">
          <CardContent>
            <Typography
              variant="h5"
              component="h1"
              className="mb-2 text-red-600">
              Error
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}>
              Reload Extension
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Box className="p-4 w-80 ">
      <Stack className="mb-4" direction="column" gap={2}>
        <Typography variant="h5" component="h1" className="mb-2">
          Parabol Peaker
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          Inspect network socket requests and show voting data ahead of time in
          Parabol planning poker.
        </Typography>

        <Box className="flex gap-2 mb-4">
          <Chip
            variant="filled"
            color={isInParabolSession ? "success" : "default"}
            className="flex-1"
            label={isInParabolSession ? "Monitoring" : "Not Monitoring"}
          />
        </Box>
      </Stack>
      {!isInParabolSession && (
        <Stack className="bg-gray-100 p-3 rounded-lg" direction="row">
          <Typography variant="body2" className="text-gray-600">
            You are not in a Parabol session. Please open a valid session and
            try again.
          </Typography>
        </Stack>
      )}
    </Box>
  )
}

export default IndexPopup
