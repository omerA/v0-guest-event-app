import { ImageResponse } from "next/og"
import { getEventConfig } from "@/lib/store"
import { formatEventDate } from "@/lib/date-utils"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const config = await getEventConfig(eventId)

  if (!config) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          color: "white",
          fontSize: 48,
          fontFamily: "serif",
        }}
      >
        Event Not Found
      </div>,
      size
    )
  }

  const hasHeroImage = config.heroMediaType === "image" && config.heroMediaUrl
  const formattedDate = formatEventDate(config.date)

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hasHeroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.heroMediaUrl}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}

      {/* Dark overlay / gradient background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: hasHeroImage
            ? "rgba(0,0,0,0.55)"
            : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          display: "flex",
        }}
      />

      {/* Event content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 80px",
          color: "white",
        }}
      >
        <p
          style={{
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
            opacity: 0.85,
            margin: 0,
            marginBottom: 20,
            fontFamily: "serif",
          }}
        >
          You are invited
        </p>
        <h1
          style={{
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.1,
            margin: 0,
            marginBottom: 28,
            fontFamily: "serif",
          }}
        >
          {config.name}
        </h1>
        <p
          style={{
            fontSize: 28,
            margin: 0,
            marginBottom: 12,
            opacity: 0.9,
            fontFamily: "serif",
          }}
        >
          {formattedDate}
        </p>
        <p
          style={{
            fontSize: 24,
            margin: 0,
            opacity: 0.75,
            fontFamily: "serif",
          }}
        >
          {config.location}
        </p>
      </div>
    </div>,
    size
  )
}
