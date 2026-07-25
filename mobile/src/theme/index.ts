import { Category } from "@/types";

/**
 * "Liberated" theme. A grounded, calm system: deep teal canvas, warm cream card
 * surfaces, soft mint accents, and muted teal actions. Clean humanist sans type.
 * Restful and focused — nothing loud or urgent.
 */
export const colors = {
  paper: "#01332F", // deep teal outer canvas / headers
  paperElevated: "#FDFDF2", // warm cream card surface
  ink: "#1A2E2B", // charcoal / dark teal text on cream
  inkSoft: "#4A5C58", // secondary text
  inkMuted: "#8A9A95", // tertiary / hints
  line: "#E6EBE1", // soft hairline on cream
  brass: "#538D89", // primary — muted teal action
  brassDeep: "#3F726E", // pressed teal
  success: "#32CD32", // lime success (checks / finished borders)
  successBg: "#EAF7EA", // soft green wash
  danger: "#C98B7A", // muted terracotta (non-alarming)
  overlay: "rgba(1, 51, 47, 0.55)",
  onDark: "#FDFDF2", // text/icons on the deep teal
  darkField: "#01332F",
  // supporting accents
  teal: "#01332F", // deep teal
  mint: "#D4E9D6", // soft mint (active states / borders)
  sun: "#E4CFA6", // warm sand
  sky: "#9DB9D2", // soft sky blue
  grape: "#B0A3CC", // dusty lavender
};

/** Muted, low-saturation accent per category. */
export const categoryColors: Record<Category, string> = {
  PHYSICAL: "#538D89", // teal
  SPIRITUAL: "#7BA694", // sage
  CAREER: "#5E8C8A", // deep teal-green
  RELATIONAL: "#8FAAC7", // soft sky
  CONTENT: "#88B4AE", // soft teal
  PROCESSING: "#9C9F7E", // muted olive
};

/** Ionicons glyph name per category (used by the activity grid tiles). */
export const categoryIcons: Record<Category, string> = {
  PHYSICAL: "walk",
  SPIRITUAL: "leaf",
  CAREER: "briefcase",
  RELATIONAL: "heart",
  CONTENT: "brush",
  PROCESSING: "journal",
};

export const categoryEmojis: Record<Category, string> = {
  PHYSICAL: "🌿",
  SPIRITUAL: "🌙",
  CAREER: "🌤️",
  RELATIONAL: "🤍",
  CONTENT: "🌊",
  PROCESSING: "☁️",
};

export const categoryLabels: Record<Category, string> = {
  PHYSICAL: "Physical",
  SPIRITUAL: "Spiritual",
  CAREER: "Career",
  RELATIONAL: "Relational",
  CONTENT: "Content",
  PROCESSING: "Processing",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 16,
  md: 24,
  lg: 32,
  pill: 999,
};

/** Barely-there, diffuse shadows for gentle, weightless depth. */
export const shadow = {
  soft: {
    shadowColor: "#2C3A38",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  pop: {
    shadowColor: "#5E8C79",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const fonts = {
  display: "Inter_700Bold", // clean humanist sans for headings
  displayLight: "Inter_600SemiBold",
  serifItalic: "Inter_400Regular",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
};

export const type = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.displayLight,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.inkSoft,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: colors.brass,
  },
  mono: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink },
};
