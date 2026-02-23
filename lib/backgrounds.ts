import type React from "react"
import { BACKGROUND_GALLERY } from "./store"

export function getBackgroundStyle(backgroundId: string): React.CSSProperties {
  const bg = BACKGROUND_GALLERY.find((b) => b.id === backgroundId)
  if (!bg || bg.type === "none") {
    return { background: "#1a1a2e" }
  }
  if (bg.type === "gradient") {
    return { background: bg.value }
  }
  if (bg.type === "image") {
    return {
      backgroundImage: `url(${bg.value})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
  }
  return { background: "#1a1a2e" }
}
