import { Platform, type TextStyle, type ViewStyle } from "react-native";

/** Palette — the same tokens as the web app's globals.css. */
export const colors = {
  forest950: "#0e2217",
  forest900: "#14301f",
  forest800: "#1d3f2a",
  forest700: "#285237",
  forest600: "#356a47",
  forest500: "#4a855c",
  moss400: "#8fae7c",
  moss200: "#cddcbf",
  moss100: "#e5eddc",
  sand50: "#fbf8f2",
  sand100: "#f5efe3",
  sand200: "#ebe2d0",
  sand300: "#dccfb6",
  sand400: "#c4b393",
  ink900: "#1a1d19",
  ink700: "#3c423a",
  ink500: "#676e63",
  ink400: "#8a9086",
  pomegranate700: "#93331f",
  pomegranate600: "#b4432a",
  pomegranate500: "#cc5a3c",
  pomegranate100: "#f7e1d8",
  ochre500: "#c9912a",
  ochre100: "#f6ead0",
  plum700: "#43334f",
  plum100: "#e7e1ec",
  white: "#ffffff",
} as const;

export const font = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  displayItalic: "Fraunces_600SemiBold_Italic",
  body: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  heavy: "Manrope_800ExtraBold",
} as const;

export const radius = { sm: 10, md: 14, lg: 16, card: 20, xl: 28, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** Page gutter, matching the web's px-5 on phones. */
export const GUTTER = 20;

function shadowOf(y: number, blur: number, opacity: number, elevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation },
    default: { shadowColor: colors.ink900, shadowOffset: { width: 0, height: y }, shadowRadius: blur, shadowOpacity: opacity },
  })!;
}

/** Web --shadow-card / --shadow-lift, translated to native shadows. */
export const shadow = {
  card: shadowOf(6, 14, 0.09, 2),
  lift: shadowOf(14, 26, 0.18, 8),
  forest: Platform.select<ViewStyle>({
    android: { elevation: 6 },
    default: { shadowColor: colors.forest800, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, shadowOpacity: 0.28 },
  })!,
};

export const type = {
  hero: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  display: { fontFamily: font.display, fontSize: 30, lineHeight: 35, letterSpacing: -0.6 },
  title: { fontFamily: font.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.4 },
  heading: { fontFamily: font.display, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  cardTitle: { fontFamily: font.display, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 23 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bold, fontSize: 13, lineHeight: 17 },
  eyebrow: { fontFamily: font.heavy, fontSize: 11, lineHeight: 14, letterSpacing: 1.8, textTransform: "uppercase" },
  micro: { fontFamily: font.bold, fontSize: 11, lineHeight: 14 },
} satisfies Record<string, TextStyle>;

/** Difficulty dot and badge colours, as on the web. */
export const DIFFICULTY_STYLE = {
  easy: { dot: "#4a855c", bg: colors.moss100, fg: colors.forest700 },
  moderate: { dot: "#c9912a", bg: colors.ochre100, fg: "#7a5410" },
  hard: { dot: "#b4432a", bg: colors.pomegranate100, fg: colors.pomegranate700 },
  expert: { dot: "#43334f", bg: colors.plum100, fg: colors.plum700 },
} as const;
