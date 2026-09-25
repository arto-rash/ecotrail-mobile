import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, font, radius, shadow } from "@/theme";
import { Bouncy } from "./bouncy";
import { Txt } from "./text";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "light" | "danger";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: "md" | "sm" | "lg";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
  accessibilityLabel?: string;
};

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.forest800, fg: colors.sand50 },
  secondary: { bg: colors.moss100, fg: colors.forest800 },
  outline: { bg: colors.white, fg: colors.forest800, border: colors.sand300 },
  ghost: { bg: "transparent", fg: colors.forest800 },
  light: { bg: colors.sand50, fg: colors.forest900 },
  danger: { bg: colors.pomegranate600, fg: colors.white },
};

const SIZES = {
  sm: { height: 38, px: 14, text: 13, icon: 16 },
  md: { height: 48, px: 20, text: 15, icon: 18 },
  lg: { height: 56, px: 24, text: 16, icon: 20 },
};

export function Button({ children, onPress, variant = "primary", size = "md", icon: Icon, iconRight: IconRight, loading, disabled, style, full, accessibilityLabel }: Props) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const inactive = disabled || loading;
  return (
    <Bouncy
      feedback
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.base,
        { backgroundColor: v.bg, height: s.height, paddingHorizontal: s.px, opacity: inactive ? 0.6 : 1 },
        v.border && { borderWidth: 1, borderColor: v.border },
        variant === "primary" && shadow.forest,
        full && { alignSelf: "stretch" },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={v.fg} /> : Icon && <Icon size={s.icon} color={v.fg} strokeWidth={2.2} />}
        <Txt style={{ fontFamily: font.bold, fontSize: s.text, color: v.fg }} numberOfLines={1}>
          {children}
        </Txt>
        {IconRight && <IconRight size={s.icon} color={v.fg} strokeWidth={2.2} />}
      </View>
    </Bouncy>
  );
}

/** Round icon-only button, used over photos and in headers. */
export function IconButton({ icon: Icon, onPress, label, tone = "light", size = 42 }: { icon: LucideIcon; onPress?: () => void; label: string; tone?: "light" | "dark" | "plain"; size?: number }) {
  const bg = tone === "light" ? "rgba(251,248,242,0.94)" : tone === "dark" ? "rgba(14,34,23,0.55)" : colors.white;
  const fg = tone === "dark" ? colors.sand50 : colors.forest900;
  return (
    <Bouncy
      feedback
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.icon, { width: size, height: size, backgroundColor: bg }, tone !== "dark" && shadow.card, tone === "plain" && { borderWidth: 1, borderColor: colors.sand200 }]}
    >
      <Icon size={size * 0.45} color={fg} strokeWidth={2.2} />
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: { borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
});
