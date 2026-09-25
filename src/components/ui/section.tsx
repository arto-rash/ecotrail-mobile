import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { colors, font, GUTTER } from "@/theme";
import { Txt } from "./text";

/** Eyebrow + Fraunces title + optional "see all" link, like the website's section heads. */
export function SectionHeader({ eyebrow, title, text, action, onAction, style, tone = "light" }: { eyebrow?: string; title: string; text?: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle>; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <View style={[styles.wrap, style]}>
      <View style={{ flex: 1, gap: 6 }}>
        {eyebrow && (
          <Txt variant="eyebrow" color={dark ? colors.moss200 : colors.forest600}>
            {eyebrow}
          </Txt>
        )}
        <Txt variant="title" color={dark ? colors.sand50 : colors.ink900}>
          {title}
        </Txt>
        {text && (
          <Txt variant="body" color={dark ? "rgba(251,248,242,0.75)" : colors.ink500} style={{ marginTop: 2 }}>
            {text}
          </Txt>
        )}
      </View>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={10} style={styles.action} accessibilityRole="link">
          <Txt style={[styles.actionText, dark && { color: colors.moss200 }]}>{action}</Txt>
          <ArrowRight size={15} color={dark ? colors.moss200 : colors.forest700} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}

/** A labelled block inside a detail screen. */
export function Block({ title, children, style, right }: { title: string; children: ReactNode; style?: StyleProp<ViewStyle>; right?: ReactNode }) {
  return (
    <View style={[{ paddingHorizontal: GUTTER, gap: 14 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Txt variant="heading">{title}</Txt>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.sand200, marginHorizontal: GUTTER }, style]} />;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingHorizontal: GUTTER },
  action: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 4 },
  actionText: { fontFamily: font.bold, fontSize: 14, color: colors.forest700 },
});
