import { Stack, Typography } from "@mui/material"

interface InfoCardProps {
  message: string
  variant?: "info" | "warning" | "error"
}

export const InfoCard = ({ message, variant = "info" }: InfoCardProps) => {
  const getStyles = () => {
    switch (variant) {
      case "warning":
        return {
          background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
          color: "#ffffff"
        }
      case "error":
        return {
          background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
          color: "#ffffff"
        }
      default:
        return {
          background: "#f8f9fa",
          color: "#495057"
        }
    }
  }

  const styles = getStyles()

  return (
    <Stack
      className="p-4 rounded-lg transition-all duration-300"
      sx={{
        background: styles.background,
        color: styles.color,
        border: variant === "info" ? "1px solid #e9ecef" : "none",
        borderRadius: "12px",
        boxShadow:
          variant === "info"
            ? "0 2px 4px rgba(0,0,0,0.05)"
            : "0 4px 12px rgba(0,0,0,0.15)"
      }}>
      <Typography
        variant="body2"
        sx={{
          fontSize: "13px",
          lineHeight: "1.5",
          fontWeight: variant === "info" ? 400 : 500
        }}>
        {message}
      </Typography>
    </Stack>
  )
}
