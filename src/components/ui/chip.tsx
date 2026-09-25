import { StyleSheet, View } from "react-native";
import { Check, ChevronDown, type LucideIcon } from "lucide-react-native";
import { colors, font, radius } from "@/theme";
import { haptic } from "@/lib/haptics";
import { Bouncy } from "./bouncy";
import { Txt } from "./text";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  dot?: string;
  /** Shows a chevron: the chip opens a picker rather than toggling. */
  dropdown?: boolean;
  tone?: "light" | "onDark";
};

/** Filter chip. Selected = moss fill with a forest ring, like the website's chips. */
export function Chip({ label, selected, onPress, icon: Icon, dot, dropdown, tone = "light" }: Props) {
  const onDark = tone === "onDark";
  const fg = selected ? colors.forest800 : onDark ? colors.sand50 : colors.ink700;
  return (
    <Bouncy
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        haptic.select();
        onPress?.();
      }}
      scaleTo={0.95}
      style={[
        styles.chip,
        onDark ? styles.onDark : styles.light,
        selected && styles.selected,
      ]}
    >
      {selected && !dropdown && !Icon && !dot && <Check size={14} color={colors.forest800} strokeWidth={2.6} />}
      {dot && <View style={[styles.dot, { backgroundColor: dot }]} />}
      {Icon && <Icon size={15} color={fg} strokeWidth={2.2} />}
      <Txt style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Txt>
      {dropdown && <ChevronDown size={15} color={fg} strokeWidth={2.4} style={{ marginLeft: -2 }} />}
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  light: { backgroundColor: colors.white, borderColor: colors.sand200 },
  onDark: { backgroundColor: "rgba(251,248,242,0.14)", borderColor: "rgba(251,248,242,0.22)" },
  selected: { backgroundColor: colors.moss100, borderColor: colors.forest600 },
  label: { fontFamily: font.bold, fontSize: 13 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
