import { Stack, Typography } from "@mui/material"

interface HeaderProps {
  title: string
  subtitle: string
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <Stack className="mb-6" direction="column" gap={2}>
      <Typography
        variant="h5"
        component="h1"
        className="mb-2"
        sx={{
          fontWeight: 700,
          fontSize: "24px",
          color: "#2c3e50",
          letterSpacing: "-0.5px"
        }}>
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        className="mb-4"
        sx={{
          color: "#7f8c8d",
          fontSize: "14px",
          lineHeight: "1.5",
          fontWeight: 400
        }}>
        {subtitle}
      </Typography>
    </Stack>
  )
}
