import { Sparkles } from "lucide-react"

interface EventHeaderProps {
  eventName: string
}

export function EventHeader({ eventName }: EventHeaderProps) {
  return (
    <header className="flex items-center gap-2.5 py-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-lg font-semibold text-foreground tracking-tight">
        {eventName}
      </span>
    </header>
  )
}
