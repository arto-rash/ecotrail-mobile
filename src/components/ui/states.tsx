import { useEffect, type ReactNode } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { CloudOff, Compass, type LucideIcon } from "lucide-react-native";
import { colors, radius } from "@/theme";
import { useI18n } from "@/i18n";
import { Button } from "./button";
import { Txt } from "./text";

/** Soft pulsing placeholder block. */
export function Skeleton({ width = "100%", height = 16, rounded = 8, style }: { width?: DimensionValue; height?: DimensionValue; rounded?: number; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.55);
  useEffect(() => {
    o.set(withRepeat(withTiming(1, { duration: 850 }), -1, true));
  }, [o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: rounded, backgroundColor: colors.sand200 }, animated, style]} />;
}

export function CardSkeleton({ height = 260 }: { height?: number }) {
  return (
    <View style={{ gap: 10 }}>
      <Skeleton height={height * 0.68} rounded={radius.card} />
      <Skeleton width="70%" height={18} />
      <Skeleton width="45%" height={13} />
    </View>
  );
}

export function EmptyState({ icon: Icon = Compass, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon size={28} color={colors.forest700} strokeWidth={1.8} />
      </View>
      <Txt variant="heading" align="center">
        {title}
      </Txt>
      {text && (
        <Txt variant="body" color={colors.ink500} align="center">
          {text}
        </Txt>
      )}
      {action}
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { dict } = useI18n();
  return (
    <EmptyState
      icon={CloudOff}
      title={dict.errors.errorTitle}
      text={dict.errors.errorText}
      action={onRetry && <Button onPress={onRetry} variant="outline" size="sm">{dict.errors.retry}</Button>}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  badge: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.moss100, alignItems: "center", justifyContent: "center", marginBottom: 6 },
});
