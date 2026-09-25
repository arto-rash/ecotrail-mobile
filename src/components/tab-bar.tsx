import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { BlurView } from "expo-blur";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Compass, Ellipsis, House, Map, UsersRound, type LucideIcon } from "lucide-react-native";
import { colors, font, shadow } from "@/theme";
import { useI18n } from "@/i18n";
import { haptic } from "@/lib/haptics";

const ICONS: Record<string, LucideIcon> = { index: House, explore: Compass, map: Map, guides: UsersRound, more: Ellipsis };
const BAR_HEIGHT = 66;

/** Space the floating tab bar covers, for scroll content padding. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom, 12) + 20;
}

function TabItem({ focused, label, icon: Icon, onPress, onLongPress }: { focused: boolean; label: string; icon: LucideIcon; onPress: () => void; onLongPress: () => void }) {
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.set(withSpring(focused ? 1 : 0, { damping: 18, stiffness: 240 }));
  }, [focused, p]);

  const pill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ["rgba(29,63,42,0)", colors.forest800]),
    transform: [{ scale: 0.86 + p.value * 0.14 }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
    >
      <Animated.View style={[styles.pill, pill]}>
        <Icon size={21} color={focused ? colors.sand50 : colors.ink500} strokeWidth={focused ? 2.3 : 2} />
      </Animated.View>
      <Animated.Text numberOfLines={1} style={[styles.label, { color: focused ? colors.forest800 : colors.ink500, fontFamily: focused ? font.heavy : font.bold }]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

/** Floating, frosted tab bar with a forest pill behind the active icon. */
export function TabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { m } = useI18n();
  const labels: Record<string, string> = { index: m.tabs.home, explore: m.tabs.explore, map: m.tabs.map, guides: m.tabs.guides, more: m.tabs.more };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, shadow.lift]}>
        {Platform.OS === "ios" ? (
          <BlurView tint="systemChromeMaterialLight" intensity={80} style={[StyleSheet.absoluteFill, styles.blur]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.blur, { backgroundColor: "rgba(251,248,242,0.97)" }]} />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if ((options as { href?: unknown }).href === null || !ICONS[route.name]) return null;
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={labels[route.name] ?? route.name}
              icon={ICONS[route.name]}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptic.select();
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: {
    flexDirection: "row",
    height: BAR_HEIGHT,
    borderRadius: 26,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(196,179,147,0.55)",
    backgroundColor: Platform.OS === "ios" ? "rgba(251,248,242,0.72)" : "transparent",
  },
  blur: { borderRadius: 26, overflow: "hidden" },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, height: "100%" },
  pill: { width: 50, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 10.5, letterSpacing: 0.1 },
});
