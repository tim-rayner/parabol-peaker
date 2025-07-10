import { useStorage } from "@plasmohq/storage/hook"

export const useToggle = () => {
  const [isEnabled, setIsEnabled] = useStorage("parabol-peaker-toggle", true)

  const toggle = () => setIsEnabled(!isEnabled)

  return {
    isEnabled,
    setIsEnabled,
    toggle
  }
}
