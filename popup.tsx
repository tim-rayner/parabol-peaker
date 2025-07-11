import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography
} from "@mui/material"
import { useEffect, useState } from "react"

import { Header } from "./components/Header"
import { InfoCard } from "./components/InfoCard"
import { StatusChip } from "./components/StatusChip"
import { ToggleCard } from "./components/ToggleCard"
import { useGetVotes } from "./hooks/useGetVotes"
import { useIsParabolSession } from "./hooks/useIsParabolSession"
import { useToggle } from "./hooks/useToggle"

import "./style.css"

function IndexPopup() {
  const [error, setError] = useState<string | null>(null)
  const { isEnabled, toggle } = useToggle()

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
      <Box className="p-6 w-96">
        <Card
          sx={{
            background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
            border: "none",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(244, 67, 54, 0.3)"
          }}>
          <CardContent className="p-6">
            <Typography
              variant="h5"
              component="h1"
              className="mb-3"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "20px"
              }}>
              Extension Error
            </Typography>
            <Typography
              variant="body2"
              className="mb-6"
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                lineHeight: "1.6"
              }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{
                background: "rgba(255,255,255,0.2)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "14px",
                padding: "10px 20px",
                "&:hover": {
                  background: "rgba(255,255,255,0.3)"
                }
              }}>
              Reload Extension
            </Button>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box className="p-6 w-96">
      <Stack direction="column" gap={4}>
        {/* Header */}
        <Header
          title="Parabol Peaker"
          subtitle="Inspect network socket requests and show voting data ahead of time in Parabol planning poker."
        />

        {/* Status Section */}
        <Box>
          <Typography
            variant="body2"
            className="mb-3"
            sx={{
              color: "#6c757d",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "10px"
            }}>
            Status
          </Typography>
          <StatusChip
            isActive={isInParabolSession}
            activeLabel="Monitoring Parabol Session"
            inactiveLabel="Not in Parabol Session"
          />
        </Box>

        {/* Toggle Section */}
        <Box>
          <Typography
            variant="body2"
            className="mb-3"
            sx={{
              color: "#6c757d",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "10px"
            }}>
            Features
          </Typography>
          <ToggleCard
            isEnabled={isEnabled}
            onToggle={toggle}
            title="Vote Overlay"
            description="Show vote badges on avatars"
            enabledDescription="Showing vote badges on avatars"
            disabledDescription="Vote badges are hidden"
          />
        </Box>

        {/* Info Section */}
        {!isInParabolSession && (
          <InfoCard
            message="You are not in a Parabol session. Please open a valid session and try again."
            variant="warning"
          />
        )}

        {/* Stats Section */}
        {isInParabolSession && (
          <Box>
            <Typography
              variant="body2"
              className="mb-3"
              sx={{
                color: "#6c757d",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px"
              }}>
              Statistics
            </Typography>
            <Card
              sx={{
                background: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: "12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}>
              <CardContent className="p-4">
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center">
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#2c3e50",
                        fontWeight: 700,
                        fontSize: "24px"
                      }}>
                      {votes?.length || 0}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6c757d",
                        fontSize: "13px",
                        fontWeight: 500
                      }}>
                      Messages Captured
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#28a745",
                        fontWeight: 700,
                        fontSize: "24px"
                      }}>
                      {isEnabled ? "ON" : "OFF"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6c757d",
                        fontSize: "13px",
                        fontWeight: 500
                      }}>
                      Overlay Status
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

export default IndexPopup
