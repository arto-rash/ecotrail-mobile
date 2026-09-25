import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Star } from "lucide-react-native";
import { colors, font } from "@/theme";
import { useI18n, plural } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { Txt } from "./text";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** One star filled to `fill` (0–1): an outline with a solid star clipped on top. */
function PartialStar({ fill, size, empty = colors.sand300 }: { fill: number; size: number; empty?: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <Star size={size} color={empty} fill={empty} strokeWidth={1.2} />
      {fill > 0 && (
        <View style={[StyleSheet.absoluteFill, { width: size * fill, overflow: "hidden" }]}>
          <Star size={size} color={colors.ochre500} fill={colors.ochre500} strokeWidth={1.2} />
        </View>
      )}
    </View>
  );
}

export function Stars({ value, size = 16, gap = 2 }: { value: number; size?: number; gap?: number }) {
  return (
    <View style={{ flexDirection: "row", gap }} accessibilityLabel={`${value} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <PartialStar key={i} fill={clamp(value - i, 0, 1)} size={size} />
      ))}
    </View>
  );
}

/** Compact "★ 4.5 (12)" used on cards. Renders nothing without ratings. */
export function RatingInline({ rating, count, color = colors.ink700 }: { rating?: number | null; count?: number; color?: string }) {
  const { locale } = useI18n();
  if (!rating) return null;
  return (
    <View style={styles.inline}>
      <Star size={14} color={colors.ochre500} fill={colors.ochre500} />
      <Txt style={[styles.inlineValue, { color }]}>{formatNumber(locale, rating, 1)}</Txt>
      {count != null && <Txt style={[styles.inlineCount, { color }]}>({count})</Txt>}
    </View>
  );
}

export function RatingSummary({ rating, count }: { rating?: number | null; count: number }) {
  const { dict, locale } = useI18n();
  return (
    <View style={styles.summary}>
      <Txt style={styles.big}>{rating ? formatNumber(locale, rating, 1) : "–"}</Txt>
      <View style={{ gap: 4 }}>
        <Stars value={rating ?? 0} size={18} />
        <Txt variant="small" color={colors.ink500}>
          {plural(count, dict.common.reviewsCount, dict.common.reviewsCountOne)}
        </Txt>
      </View>
    </View>
  );
}

/**
 * Letterboxd-style input: tap or drag across the stars, half-star steps, blank by default.
 * Tapping the current value again clears it.
 */
export function StarRatingInput({ value, onChange, size = 40 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const { dict } = useI18n();
  const [preview, setPreview] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const shown = preview ?? value;

  const valueAt = (x: number) => clamp(Math.ceil((x / Math.max(1, width)) * 10) / 2, 0.5, 5);

  const move = (x: number) => {
    const v = valueAt(x);
    if (v === preview) return;
    haptic.select();
    setPreview(v);
  };
  const commit = (x: number, isTap: boolean) => {
    const v = valueAt(x);
    setPreview(null);
    if (isTap && v === value) onChange(0);
    else onChange(v);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(2)
    .onBegin((e) => move(e.x))
    .onUpdate((e) => move(e.x))
    .onEnd((e) => commit(e.x, false))
    .onFinalize((_e, success) => {
      if (!success) setPreview(null);
    });
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => commit(e.x, true));

  return (
    <View style={{ gap: 6 }}>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={dict.reviews.rating}
          accessibilityValue={{ min: 0, max: 5, now: value }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => onChange(clamp(value + (e.nativeEvent.actionName === "increment" ? 0.5 : -0.5), 0, 5))}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={{ flexDirection: "row", alignSelf: "flex-start" }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <View key={i} style={{ paddingRight: i < 4 ? 6 : 0 }}>
              <PartialStar fill={clamp(shown - i, 0, 1)} size={size} empty={colors.sand200} />
            </View>
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  inlineValue: { fontFamily: font.heavy, fontSize: 13 },
  inlineCount: { fontFamily: font.semibold, fontSize: 12, opacity: 0.75 },
  summary: { flexDirection: "row", alignItems: "center", gap: 14 },
  big: { fontFamily: font.display, fontSize: 40, lineHeight: 44, color: colors.ink900, letterSpacing: -1 },
});
