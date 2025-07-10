import { Chip } from "@mui/material"

interface StatusChipProps {
  isActive: boolean
  activeLabel: string
  inactiveLabel: string
}

export const StatusChip = ({
  isActive,
  activeLabel,
  inactiveLabel
}: StatusChipProps) => {
  return (
    <Chip
      variant="filled"
      color={isActive ? "success" : "default"}
      className="flex-1 transition-all duration-300"
      label={isActive ? activeLabel : inactiveLabel}
      sx={{
        backgroundColor: isActive ? "#4caf50" : "#e0e0e0",
        color: isActive ? "#ffffff" : "#666666",
        fontWeight: 500,
        fontSize: "13px",
        height: "32px",
        "&:hover": {
          backgroundColor: isActive ? "#45a049" : "#d5d5d5"
        }
      }}
    />
  )
}
