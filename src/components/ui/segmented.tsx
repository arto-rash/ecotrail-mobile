import { StyleSheet, View } from "react-native";
import { colors, font, radius } from "@/theme";
import { haptic } from "@/lib/haptics";
import { Bouncy } from "./bouncy";
import { Txt } from "./text";

/** Pill segmented control on a sand track. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Bouncy
            key={o.value}
            scaleTo={0.96}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              haptic.select();
              onChange(o.value);
            }}
            style={[styles.item, on && styles.on]}
          >
            <Txt style={[styles.text, on && { color: colors.forest900 }]} numberOfLines={1}>
              {o.label}
            </Txt>
          </Bouncy>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", padding: 4, borderRadius: radius.pill, backgroundColor: colors.sand100, alignSelf: "stretch" },
  item: { flex: 1, height: 38, paddingHorizontal: 10, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: colors.white, shadowColor: colors.ink900, shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  text: { fontFamily: font.bold, fontSize: 13, color: colors.ink500 },
});
