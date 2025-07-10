import {
  Box,
  Card,
  CardContent,
  Stack,
  Switch,
  Typography
} from "@mui/material"

interface ToggleCardProps {
  isEnabled: boolean
  onToggle: () => void
  title: string
  description: string
  enabledDescription: string
  disabledDescription: string
}

export const ToggleCard = ({
  isEnabled,
  onToggle,
  title,
  description,
  enabledDescription,
  disabledDescription
}: ToggleCardProps) => {
  return (
    <Card
      className="transition-all duration-300 ease-in-out hover:shadow-md"
      sx={{
        background: isEnabled
          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          : "#f5f5f5",
        border: "none",
        borderRadius: "12px",
        overflow: "hidden"
      }}>
      <CardContent className="p-4">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between">
          <Box>
            <Typography
              variant="h6"
              className="mb-1"
              sx={{
                color: isEnabled ? "#ffffff" : "#333333",
                fontWeight: 600,
                fontSize: "16px"
              }}>
              {title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isEnabled ? "rgba(255,255,255,0.8)" : "#666666",
                fontSize: "13px"
              }}>
              {isEnabled ? enabledDescription : disabledDescription}
            </Typography>
          </Box>
          <Switch
            checked={isEnabled}
            onChange={onToggle}
            sx={{
              "& .MuiSwitch-switchBase": {
                color: isEnabled ? "#ffffff" : "#cccccc",
                "&.Mui-checked": {
                  color: "#ffffff",
                  "& + .MuiSwitch-track": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                    opacity: 1
                  }
                }
              },
              "& .MuiSwitch-track": {
                backgroundColor: isEnabled
                  ? "rgba(255,255,255,0.3)"
                  : "#cccccc",
                opacity: 1
              },
              "& .MuiSwitch-thumb": {
                boxShadow: isEnabled ? "0 2px 4px rgba(0,0,0,0.2)" : "none"
              }
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}
