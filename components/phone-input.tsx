"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Search } from "lucide-react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countries"

interface PhoneInputProps {
  onChange: (fullPhone: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function PhoneInput({ onChange, onKeyDown }: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [localNumber, setLocalNumber] = useState("")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) setSearch("")
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  function selectCountry(c: Country) {
    setCountry(c)
    setOpen(false)
    const digits = localNumber.replace(/\D/g, "")
    onChange(digits ? `${c.dialCode}${digits}` : "")
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const local = e.target.value
    setLocalNumber(local)
    const digits = local.replace(/\D/g, "")
    onChange(digits ? `${country.dialCode}${digits}` : "")
  }

  return (
    <div
      className="flex w-full max-w-sm overflow-visible rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm transition-colors focus-within:border-white/50 focus-within:bg-white/15"
      dir="ltr"
    >
      {/* Country selector trigger */}
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-l-2xl border-r border-white/20 px-4 py-5 text-white transition-colors hover:bg-white/10 focus:outline-none"
            aria-label={`Selected country: ${country.name} ${country.dialCode}`}
          >
            <span className="text-xl leading-none">{country.flag}</span>
            <span className="text-sm font-medium tabular-nums">{country.dialCode}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={10}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              const input = (e.currentTarget as HTMLElement).querySelector("input")
              input?.focus()
            }}
            className="z-50 w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#0d0d1a] shadow-2xl shadow-black/60 backdrop-blur-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
              <Search className="h-4 w-4 shrink-0 text-white/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code…"
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
            </div>

            {/* Country list */}
            <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-white/40">No countries found</p>
              ) : (
                filtered.map((c) => {
                  const isActive = c.code === country.code
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => selectCountry(c)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/10 ${
                        isActive ? "bg-white/10 text-white" : "text-white/75"
                      }`}
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="shrink-0 tabular-nums text-white/40">{c.dialCode}</span>
                    </button>
                  )
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Local number input */}
      <input
        type="tel"
        dir="ltr"
        value={localNumber}
        onChange={handleLocalChange}
        onKeyDown={onKeyDown}
        placeholder={country.format}
        className="min-w-0 flex-1 bg-transparent px-4 py-5 text-xl text-white placeholder-white/30 outline-none"
        autoComplete="tel-national"
      />
    </div>
  )
}
