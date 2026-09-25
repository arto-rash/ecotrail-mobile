import { useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { colors, radius, shadow, GUTTER } from "@/theme";
import { Txt } from "./text";

const OPEN = { duration: 280, easing: Easing.out(Easing.cubic) };
const CLOSE = { duration: 200, easing: Easing.in(Easing.cubic) };

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Let the content scroll (long option lists, forms). */
  scroll?: boolean;
};

/**
 * EcoTrail's bottom sheet: sand panel sliding up over a dimmed backdrop. Drag the handle down
 * or tap outside to dismiss. It stays mounted until the close animation finishes.
 */
export function Sheet({ open, onClose, title, children, footer, scroll }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const y = useSharedValue(height);
  const fade = useSharedValue(0);

  // Mount as soon as it opens (derived state), unmount after the close animation.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      y.set(height);
      y.set(withTiming(0, OPEN));
      fade.set(withTiming(1, OPEN));
    } else {
      fade.set(withTiming(0, CLOSE));
      y.set(
        withTiming(height, CLOSE, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [open, height, y, fade]);

  const drag = Gesture.Pan()
    .onUpdate((e) => {
      y.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 900) scheduleOnRN(onClose);
      else y.set(withTiming(0, OPEN));
    });

  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));

  if (!mounted) return null;

  const body = scroll ? (
    <ScrollView style={{ maxHeight: height * 0.62 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16), maxHeight: height * 0.9 }, panel]}>
          <GestureDetector gesture={drag}>
            <View style={styles.header}>
              <View style={styles.handle} />
              {title && (
                <View style={styles.titleRow}>
                  <Txt variant="heading" style={{ flex: 1 }}>
                    {title}
                  </Txt>
                  <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
                    <X size={18} color={colors.ink700} strokeWidth={2.4} />
                  </Pressable>
                </View>
              )}
            </View>
          </GestureDetector>
          {body}
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(14,34,23,0.45)" },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.sand50,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.lift,
  },
  header: { paddingTop: 10, paddingHorizontal: GUTTER },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.sand300 },
  titleRow: { flexDirection: "row", alignItems: "center", paddingTop: 14, paddingBottom: 4 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.sand100, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 8 },
  footer: { paddingHorizontal: GUTTER, paddingTop: 12 },
});
