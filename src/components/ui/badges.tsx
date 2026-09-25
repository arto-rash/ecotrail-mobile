import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BadgeCheck, type LucideIcon } from "lucide-react-native";
import { colors, DIFFICULTY_STYLE, font, radius } from "@/theme";
import { useI18n } from "@/i18n";
import type { Difficulty } from "@/lib/types";
import { Txt } from "./text";

export function DifficultyBadge({ difficulty, style }: { difficulty: Difficulty; style?: StyleProp<ViewStyle> }) {
  const { dict } = useI18n();
  const s = DIFFICULTY_STYLE[difficulty];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Txt style={[styles.text, { color: s.fg }]}>{dict.difficulty[difficulty]}</Txt>
    </View>
  );
}

/** Small rounded label. `glass` is for use on top of photos. */
export function Pill({ label, icon: Icon, tone = "sand", style }: { label: string; icon?: LucideIcon; tone?: "sand" | "glass" | "moss" | "ochre" | "dark"; style?: StyleProp<ViewStyle> }) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      {Icon && <Icon size={13} color={t.fg} strokeWidth={2.4} />}
      <Txt style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

export function VerifiedBadge() {
  const { dict } = useI18n();
  return <Pill icon={BadgeCheck} label={dict.guides.verified} tone="moss" />;
}

const TONES = {
  sand: { bg: colors.sand100, fg: colors.ink700 },
  glass: { bg: "rgba(251,248,242,0.92)", fg: colors.forest900 },
  moss: { bg: colors.moss100, fg: colors.forest700 },
  ochre: { bg: colors.ochre100, fg: "#7a5410" },
  dark: { bg: "rgba(14,34,23,0.6)", fg: colors.sand50 },
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: font.bold, fontSize: 12 },
});
