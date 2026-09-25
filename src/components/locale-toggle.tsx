import { StyleSheet, View } from "react-native";
import { colors, font, radius } from "@/theme";
import { locales, useI18n } from "@/i18n";
import { haptic } from "@/lib/haptics";
import { Bouncy } from "./ui/bouncy";
import { Txt } from "./ui/text";

/** AZ | EN segmented switch. */
export function LocaleToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { locale, setLocale, dict } = useI18n();
  const dark = tone === "dark";
  return (
    <View style={[styles.wrap, dark ? styles.dark : styles.light]} accessibilityRole="radiogroup" accessibilityLabel={dict.nav.language}>
      {locales.map((l) => {
        const on = l === locale;
        return (
          <Bouncy
            key={l}
            scaleTo={0.92}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              haptic.select();
              setLocale(l);
            }}
            style={[styles.item, on && (dark ? styles.onDark : styles.onLight)]}
          >
            <Txt style={[styles.text, { color: on ? (dark ? colors.forest900 : colors.sand50) : dark ? colors.sand50 : colors.ink500 }]}>{l.toUpperCase()}</Txt>
          </Bouncy>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", padding: 3, borderRadius: radius.pill },
  light: { backgroundColor: colors.sand100 },
  dark: { backgroundColor: "rgba(251,248,242,0.16)", borderWidth: 1, borderColor: "rgba(251,248,242,0.2)" },
  item: { paddingHorizontal: 12, height: 30, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  onLight: { backgroundColor: colors.forest800 },
  onDark: { backgroundColor: colors.sand50 },
  text: { fontFamily: font.heavy, fontSize: 12, letterSpacing: 0.6 },
});
