import { Clear as ClearIcon, Refresh as RefreshIcon } from "@mui/icons-material"
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography
} from "@mui/material"
import { useEffect, useState } from "react"

import {
  useBackgroundMessages,
  type WebSocketMessage
} from "./hooks/useBackgroundMessages"
import { useIsParabolSession } from "./hooks/useIsParabolSession"

import "./style.css"

function IndexPopup() {
  const [data, setData] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isInParabolSession = useIsParabolSession()
  const { messages, isLoading, fetchMessages, clearMessages } =
    useBackgroundMessages()

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
    <div className="p-4 w-80">
      <Card className="mb-4">
        <CardContent>
          <Typography variant="h5" component="h1" className="mb-2">
            Parabol Peaker
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            Inspect network socket requests and show voting data ahead of time
            in Parabol planning poker.
          </Typography>

          <Box className="flex gap-2 mb-4">
            <Button
              variant="contained"
              color="primary"
              className="flex-1"
              disabled={!isInParabolSession}>
              {isInParabolSession ? "Monitoring Active" : "Start Monitoring"}
            </Button>
            <Tooltip title="Refresh messages">
              <IconButton onClick={fetchMessages} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear messages">
              <IconButton
                onClick={clearMessages}
                disabled={messages.length === 0}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {messages.length > 0 && (
            <Box className="mb-4">
              <Typography variant="h6" className="mb-2">
                Intercepted Messages ({messages.length})
              </Typography>
              <List className="max-h-60 overflow-y-auto bg-gray-50 rounded">
                {messages
                  .slice(-10)
                  .reverse()
                  .map((message: WebSocketMessage) => (
                    <ListItem
                      key={message.id}
                      className="border-b border-gray-200">
                      <ListItemText
                        primary={
                          <Box className="flex items-center gap-2">
                            <Chip
                              label={message.type}
                              color={getMessageTypeColor(message.type)}
                              size="small"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              {formatTimestamp(message.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box className="mt-2">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              className="block mb-1">
                              URL: {message.url}
                            </Typography>
                            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                              {formatMessageData(message.data)}
                            </pre>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          )}

          {isLoading && (
            <Typography variant="body2" color="text.secondary">
              Loading messages...
            </Typography>
          )}
        </CardContent>
      </Card>
      {!isInParabolSession && (
        <Stack className="bg-gray-100 p-3 rounded-lg" direction="row">
          <Typography variant="body2" className="text-gray-600">
            You are not in a Parabol session. Please open a valid session and
            try again.
          </Typography>
        </Stack>
      )}
    </div>
  )
}

export default IndexPopup
