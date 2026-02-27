import { getEventConfig } from "@/lib/store"
import { LanguageProvider } from "@/components/language-provider"
import type { ReactNode } from "react"

export default async function EventLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  const config = await getEventConfig(eventId)

  const supportedLanguages = config?.supportedLanguages ?? ["en"]
  const defaultLanguage = config?.defaultLanguage ?? "en"

  return (
    <LanguageProvider defaultLanguage={defaultLanguage} supportedLanguages={supportedLanguages}>
      {children}
    </LanguageProvider>
  )
}
