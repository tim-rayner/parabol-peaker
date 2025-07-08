import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography
} from "@mui/material"
import React from "react"

import { useGetVotes } from "../hooks/useGetVotes"
import { useWebSocketInterceptor } from "../hooks/useWebSocketInterceptor"

/**
 * Example component demonstrating WebSocket interception functionality
 *
 * This component shows how to:
 * 1. Inject the WebSocket interceptor into the page context
 * 2. Monitor intercepted messages in real-time
 * 3. Extract and display specific data (votes) from the messages
 * 4. Provide user controls for managing the interception
 */
export const WebSocketInterceptorExample: React.FC = () => {
  const {
    messages,
    isIntercepting,
    injectWebSocketInterceptor,
    clearMessages
  } = useWebSocketInterceptor()

  const { votes, getLatestVotes, getVoteSummary, totalVotes, uniqueVoters } =
    useGetVotes()

  const latestVotes = getLatestVotes()
  const voteSummary = getVoteSummary()

  return (
    <Box className="p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" className="mb-2">
            WebSocket Interceptor Example
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            This example demonstrates how to intercept and analyze WebSocket
            messages from Parabol's real-time communication system.
          </Typography>

          {/* Control Buttons */}
          <Box className="flex gap-2 mb-4">
            <Button
              variant="contained"
              color="primary"
              onClick={injectWebSocketInterceptor}
              disabled={isIntercepting}>
              {isIntercepting ? "Interceptor Active" : "Start Interception"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearMessages}
              disabled={messages.length === 0}>
              Clear Messages
            </Button>
          </Box>

          {/* Status Alert */}
          {isIntercepting && (
            <Alert severity="success" className="mb-4">
              WebSocket interceptor is active and monitoring Parabol connections
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Message Statistics */}
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-4">
            Message Statistics
          </Typography>
          <Box className="grid grid-cols-3 gap-4">
            <Box className="text-center">
              <Typography variant="h4" color="primary">
                {messages.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Messages
              </Typography>
            </Box>
            <Box className="text-center">
              <Typography variant="h4" color="success.main">
                {votes.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vote Messages
              </Typography>
            </Box>
            <Box className="text-center">
              <Typography variant="h4" color="info.main">
                {uniqueVoters}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Voters
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Vote Summary */}
      {voteSummary.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Vote Summary
            </Typography>
            <Box className="space-y-2">
              {voteSummary.map(({ vote, count, percentage }) => (
                <Box key={vote} className="flex items-center justify-between">
                  <Box className="flex items-center gap-2">
                    <Chip label={vote} color="primary" size="small" />
                    <Typography variant="body2">
                      {count} vote{count !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {percentage.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Latest Votes */}
      {latestVotes.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Latest Votes by User
            </Typography>
            <List>
              {latestVotes.map((vote) => (
                <ListItem
                  key={vote.userId}
                  className="border-b border-gray-200">
                  <ListItemText
                    primary={
                      <Box className="flex items-center gap-2">
                        <Typography variant="body1" className="font-medium">
                          User {vote.userId.slice(0, 8)}...
                        </Typography>
                        <Chip label={vote.vote} color="primary" size="small" />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(vote.timestamp).toLocaleTimeString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Raw Messages (for debugging) */}
      {messages.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-4">
              Recent Messages (Last 5)
            </Typography>
            <List className="max-h-60 overflow-y-auto">
              {messages
                .slice(-5)
                .reverse()
                .map((message) => (
                  <ListItem
                    key={message.id}
                    className="border-b border-gray-200">
                    <ListItemText
                      primary={
                        <Box className="flex items-center gap-2">
                          <Chip
                            label={message.type}
                            color={
                              message.type === "incoming"
                                ? "success"
                                : "primary"
                            }
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                          {typeof message.data === "string"
                            ? message.data
                            : JSON.stringify(message.data, null, 2)}
                        </pre>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {messages.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-2">
              Getting Started
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              To see intercepted messages:
            </Typography>
            <Box className="space-y-2 text-sm">
              <Typography variant="body2">
                1. Click "Start Interception" to inject the WebSocket
                interceptor
              </Typography>
              <Typography variant="body2">
                2. Navigate to a Parabol planning poker session
              </Typography>
              <Typography variant="body2">
                3. Wait for WebSocket messages to appear in the console and here
              </Typography>
              <Typography variant="body2">
                4. The extension will automatically filter and display
                vote-related data
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default WebSocketInterceptorExample
