import type { ReactNode } from "react";
import { Share, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Share2 } from "lucide-react-native";
import { colors, GUTTER, radius } from "@/theme";
import { useI18n } from "@/i18n";
import { IconButton } from "./ui/button";
import { CoverImage } from "./ui/cover-image";
import { ErrorState, Skeleton } from "./ui/states";
import { Txt } from "./ui/text";

type Props = {
  title: string;
  image?: string | null;
  kind?: string;
  /** Content drawn over the bottom of the photo (badges, title). */
  hero: ReactNode;
  children: ReactNode;
  /** Sticky action bar at the bottom. */
  footer?: ReactNode;
  shareUrl?: string;
  heroHeight?: number;
  /** A custom header block instead of a photo (guides). */
  heroBackground?: ReactNode;
};

/** Photo header with parallax, floating back/share buttons and a title bar that fades in on scroll. */
export function DetailScreen({ title, image, kind, hero, children, footer, shareUrl, heroHeight = 400, heroBackground }: Props) {
  const insets = useSafeAreaInsets();
  const { dict } = useI18n();
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const HERO = heroHeight + insets.top;

  const photo = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-HERO, 0, HERO], [-HERO / 2, 0, HERO * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-HERO, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));
  const bar = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [HERO - 160, HERO - 90], [0, 1], Extrapolation.CLAMP) }));

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand50 }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: footer ? 130 : 60 }}>
        <View style={{ height: HERO, overflow: "hidden", backgroundColor: colors.forest900 }}>
          <Animated.View style={[StyleSheet.absoluteFill, photo]}>
            {heroBackground ?? <CoverImage src={image} kind={kind} scrim topScrim priority="high" style={StyleSheet.absoluteFill} />}
          </Animated.View>
          <View style={styles.heroContent}>{hero}</View>
        </View>
        <View style={styles.sheet}>{children}</View>
      </Animated.ScrollView>

      {/* Title bar that appears once the photo scrolls away */}
      <Animated.View pointerEvents="none" style={[styles.bar, { height: insets.top + 58, paddingTop: insets.top }, bar]}>
        <Txt variant="cardTitle" numberOfLines={1} style={{ marginHorizontal: 70 }} align="center">
          {title}
        </Txt>
      </Animated.View>

      <View style={[styles.buttons, { top: insets.top + 8 }]} pointerEvents="box-none">
        <IconButton icon={ChevronLeft} label={dict.common.back} onPress={back} />
        {shareUrl && <IconButton icon={Share2} label={dict.common.share} onPress={() => Share.share({ message: `${title} — ${shareUrl}`, url: shareUrl, title })} />}
      </View>

      {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>{footer}</View>}
    </View>
  );
}

function BackButton() {
  const insets = useSafeAreaInsets();
  const { dict } = useI18n();
  return (
    <View style={[styles.buttons, { top: insets.top + 8 }]} pointerEvents="box-none">
      <IconButton icon={ChevronLeft} label={dict.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </View>
  );
}

export function LoadingDetail() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.sand50 }}>
      <Skeleton height={420} rounded={0} />
      <View style={{ padding: GUTTER, gap: 14 }}>
        <Skeleton width="60%" height={26} />
        <Skeleton width="40%" height={16} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Skeleton width="48%" height={96} rounded={radius.lg} />
          <Skeleton width="48%" height={96} rounded={radius.lg} />
        </View>
        <Skeleton height={120} rounded={radius.lg} />
      </View>
      <BackButton />
    </View>
  );
}

export function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.sand50 }}>
      <ErrorState onRetry={onRetry} />
      <BackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  heroContent: { position: "absolute", left: GUTTER, right: GUTTER, bottom: 40, gap: 10 },
  sheet: { marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.sand50, paddingTop: 26, gap: 30 },
  bar: { position: "absolute", top: 0, left: 0, right: 0, justifyContent: "center", backgroundColor: "rgba(251,248,242,0.97)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.sand200 },
  buttons: { position: "absolute", left: GUTTER - 4, right: GUTTER - 4, flexDirection: "row", justifyContent: "space-between" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: GUTTER, paddingTop: 12, backgroundColor: "rgba(251,248,242,0.98)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.sand300 },
});
