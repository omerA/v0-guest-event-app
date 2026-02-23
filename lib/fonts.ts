import type { FontFamily } from "./store"

export const FONT_CSS_MAP: Record<FontFamily, string> = {
  playfair: "font-['Playfair_Display',serif]",
  cormorant: "font-['Cormorant_Garamond',serif]",
  "dm-serif": "font-['DM_Serif_Display',serif]",
  "libre-baskerville": "font-['Libre_Baskerville',serif]",
  "crimson-pro": "font-['Crimson_Pro',serif]",
}

export const FONT_STYLE_MAP: Record<FontFamily, string> = {
  playfair: "'Playfair Display', serif",
  cormorant: "'Cormorant Garamond', serif",
  "dm-serif": "'DM Serif Display', serif",
  "libre-baskerville": "'Libre Baskerville', serif",
  "crimson-pro": "'Crimson Pro', serif",
}

export function getFontClass(fontFamily: FontFamily): string {
  return FONT_CSS_MAP[fontFamily] ?? FONT_CSS_MAP.playfair
}

export function getFontStyle(fontFamily: FontFamily): string {
  return FONT_STYLE_MAP[fontFamily] ?? FONT_STYLE_MAP.playfair
}
