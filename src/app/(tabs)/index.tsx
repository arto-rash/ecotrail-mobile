import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, Extrapolation } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, Footprints, Leaf, Map as MapIcon, Recycle, Search, ShoppingBasket, Droplets, UsersRound, Plus } from "lucide-react-native";
import { colors, font, GUTTER, radius, shadow } from "@/theme";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useFeaturedPlaces, useFeaturedTrails, useRegions, useStats } from "@/lib/queries";
import { PlaceCard, TrailTile } from "@/components/cards";
import { RegionMap } from "@/components/region-map";
import { LocaleToggle } from "@/components/locale-toggle";
import { useTabBarSpace } from "@/components/tab-bar";
import { Bouncy } from "@/components/ui/bouncy";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/states";
import { Span, Txt } from "@/components/ui/text";
import { Topo } from "@/components/ui/topo";

const HERO = 520;
const ECO_ICONS = [Recycle, Droplets, Footprints, ShoppingBasket];

export default function Home() {
  const { dict, locale, m } = useI18n();
  const h = dict.home;
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const stats = useStats();
  const trails = useFeaturedTrails(8);
  const places = useFeaturedPlaces(10);
  const regions = useRegions();

  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const heroImage = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-200, 0, HERO], [-100, 0, HERO * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-200, 0], [1.35, 1], Extrapolation.CLAMP) },
    ],
  }));
  const topBar = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [HERO - 180, HERO - 110], [0, 1], Extrapolation.CLAMP) }));

  const s = stats.data;
  const statItems = [
    { value: s?.trails, label: h.statTrails },
    { value: s?.places, label: h.statPlaces },
    { value: s?.total_km, label: h.statKm },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand50 }}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: bottom }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ height: HERO + insets.top, overflow: "hidden", backgroundColor: colors.forest950 }}>
          <Animated.View style={[StyleSheet.absoluteFill, heroImage]}>
            <Image source={require("@/assets/images/hero/shahdag-greenery.jpg")} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Animated.View>
          <LinearGradient
            colors={["rgba(14,34,23,0.6)", "rgba(14,34,23,0.18)", "rgba(14,34,23,0.9)"]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroTop, { paddingTop: insets.top + 10 }]}>
            <View style={styles.brand}>
              <Leaf size={18} color={colors.moss200} strokeWidth={2.4} />
              <Txt style={styles.brandText}>EcoTrail</Txt>
            </View>
            <LocaleToggle tone="dark" />
          </View>
          <View style={styles.heroBody}>
            <View style={styles.eyebrow}>
              <Txt variant="eyebrow" color={colors.sand50}>
                {h.eyebrow}
              </Txt>
            </View>
            <Txt variant="hero" color={colors.sand50}>
              {h.titleLine1}
              {"\n"}
              <Span style={{ fontFamily: font.displayItalic, color: colors.moss200 }}>{h.titleEm}</Span> {h.titleLine2}
            </Txt>
            <Txt variant="body" color="rgba(251,248,242,0.85)" numberOfLines={3}>
              {h.subtitle}
            </Txt>
            <Bouncy
              feedback
              onPress={() => router.navigate({ pathname: "/explore", params: { focus: "1" } })}
              style={styles.search}
              accessibilityRole="search"
              accessibilityLabel={m.search.placeholder}
            >
              <Search size={19} color={colors.forest700} strokeWidth={2.4} />
              <Txt style={styles.searchText} numberOfLines={1}>
                {m.search.placeholder}
              </Txt>
              <View style={styles.searchGo}>
                <ArrowRight size={17} color={colors.sand50} strokeWidth={2.6} />
              </View>
            </Bouncy>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          {statItems.map((item, i) => (
            <View key={item.label} style={[styles.stat, i > 0 && styles.statDivider]}>
              {item.value == null ? (
                <Skeleton width={44} height={24} />
              ) : (
                <Txt style={styles.statValue}>{formatNumber(locale, item.value)}</Txt>
              )}
              <Txt style={styles.statLabel} numberOfLines={1}>
                {item.label}
              </Txt>
            </View>
          ))}
        </View>

        {/* Featured trails */}
        <SectionHeader eyebrow={h.featuredEyebrow} title={h.featuredTitle} action={m.common.seeAll} onAction={() => router.navigate("/explore")} style={{ marginTop: 34 }} />
        <FlatList
          horizontal
          data={trails.data ?? []}
          keyExtractor={(t) => t.slug}
          renderItem={({ item }) => <TrailTile trail={item} />}
          ListEmptyComponent={
            <View style={{ flexDirection: "row", gap: 14 }}>
              {[0, 1].map((i) => (
                <Skeleton key={i} width={250} height={300} rounded={radius.card} />
              ))}
            </View>
          }
          contentContainerStyle={styles.carousel}
          showsHorizontalScrollIndicator={false}
          snapToInterval={264}
          decelerationRate="fast"
        />

        {/* Regions */}
        <View style={styles.regions}>
          <Topo color={colors.sand200} size={560} style={{ position: "absolute", top: -200, right: -260 }} />
          <SectionHeader eyebrow={h.regionsEyebrow} title={h.regionsTitle} text={h.regionsDescription} style={{ paddingHorizontal: 0 }} />
          <View style={{ marginTop: 20 }}>
            {regions.data ? (
              <RegionMap regions={regions.data} onOpen={(slug) => router.push(`/region/${slug}`)} />
            ) : (
              <Skeleton height={260} rounded={radius.card} />
            )}
          </View>
        </View>

        {/* Places */}
        <SectionHeader eyebrow={h.placesEyebrow} title={h.placesTitle} action={m.common.seeAll} onAction={() => router.navigate({ pathname: "/explore", params: { tab: "places" } })} style={{ marginTop: 36 }} />
        <FlatList
          horizontal
          data={places.data ?? []}
          keyExtractor={(p) => p.slug}
          renderItem={({ item }) => <PlaceCard place={item} width={190} />}
          ListEmptyComponent={
            <View style={{ flexDirection: "row", gap: 14 }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} width={190} height={210} rounded={radius.card} />
              ))}
            </View>
          }
          contentContainerStyle={styles.carousel}
          showsHorizontalScrollIndicator={false}
          snapToInterval={204}
          decelerationRate="fast"
        />

        {/* Map teaser */}
        <Bouncy onPress={() => router.navigate("/map")} scaleTo={0.98} style={styles.mapCard}>
          <Image source={require("@/assets/images/hero/lerik.jpg")} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(14,34,23,0.25)", "rgba(14,34,23,0.92)"]} style={StyleSheet.absoluteFill} />
          <View style={{ gap: 8 }}>
            <Txt variant="eyebrow" color={colors.moss200}>
              {h.mapEyebrow}
            </Txt>
            <Txt variant="title" color={colors.sand50}>
              {h.mapTitle}
            </Txt>
            <Txt variant="body" color="rgba(251,248,242,0.8)" numberOfLines={3}>
              {h.mapDescription}
            </Txt>
          </View>
          <View style={styles.mapButton}>
            <MapIcon size={17} color={colors.forest900} strokeWidth={2.4} />
            <Txt style={{ fontFamily: font.bold, fontSize: 14, color: colors.forest900 }}>{h.openMap}</Txt>
          </View>
        </Bouncy>

        {/* Eco-challenges */}
        <View style={styles.eco}>
          <Topo color={colors.moss200} size={520} style={{ position: "absolute", bottom: -260, left: -240 }} />
          <SectionHeader eyebrow={h.ecoEyebrow} title={h.ecoTitle} text={h.ecoDescription} style={{ paddingHorizontal: 0 }} />
          <View style={styles.ecoGrid}>
            {h.eco.map((item, i) => {
              const Icon = ECO_ICONS[i] ?? Leaf;
              return (
                <View key={item.title} style={styles.ecoItem}>
                  <View style={styles.ecoIcon}>
                    <Icon size={18} color={colors.forest700} strokeWidth={2.2} />
                  </View>
                  <Txt variant="label">{item.title}</Txt>
                  <Txt variant="small" color={colors.ink500}>
                    {item.text}
                  </Txt>
                </View>
              );
            })}
          </View>
          <Button variant="primary" iconRight={ArrowRight} onPress={() => router.push("/challenges")} style={{ alignSelf: "flex-start" }}>
            {h.ecoAll}
          </Button>
        </View>

        {/* Guides */}
        <Bouncy onPress={() => router.navigate("/guides")} scaleTo={0.98} style={styles.guides}>
          <View style={styles.guidesIcon}>
            <UsersRound size={24} color={colors.forest700} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="eyebrow" color={colors.forest600}>
              {h.guidesEyebrow}
            </Txt>
            <Txt variant="heading">{dict.guides.title}</Txt>
            <Txt variant="small" color={colors.ink500} numberOfLines={3}>
              {dict.guides.intro}
            </Txt>
          </View>
          <ArrowRight size={20} color={colors.forest700} />
        </Bouncy>

        {/* Share a trail */}
        <View style={styles.cta}>
          <Topo color={colors.forest700} size={520} style={{ position: "absolute", top: -220, right: -220 }} />
          <Txt variant="title" color={colors.sand50}>
            {h.ctaTitle}
          </Txt>
          <Txt variant="body" color="rgba(251,248,242,0.8)">
            {h.ctaText}
          </Txt>
          <Button
            variant="light"
            icon={Plus}
            onPress={() => {
              haptic.tap();
              router.push("/submit");
            }}
            style={{ alignSelf: "flex-start", marginTop: 6 }}
          >
            {h.ctaButton}
          </Button>
        </View>

        <Pressable onPress={() => router.push("/sources")} style={{ paddingHorizontal: GUTTER, paddingTop: 22 }}>
          <Txt variant="small" color={colors.ink400} align="center">
            {dict.footer.disclaimer}
          </Txt>
        </Pressable>
      </Animated.ScrollView>

      {/* Frosted status-bar strip once the hero scrolls away */}
      <Animated.View pointerEvents="none" style={[styles.statusStrip, { height: insets.top }, topBar]} />
    </View>
  );
}

const styles = StyleSheet.create({
  heroTop: { position: "absolute", top: 0, left: GUTTER, right: GUTTER, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  brandText: { fontFamily: font.display, fontSize: 21, color: colors.sand50, letterSpacing: -0.4 },
  heroBody: { position: "absolute", left: GUTTER, right: GUTTER, bottom: 54, gap: 14 },
  eyebrow: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: "rgba(251,248,242,0.16)", borderWidth: 1, borderColor: "rgba(251,248,242,0.2)" },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 56, paddingLeft: 18, paddingRight: 7, borderRadius: radius.pill, backgroundColor: colors.sand50, marginTop: 4, ...shadow.lift },
  searchText: { flex: 1, fontFamily: font.semibold, fontSize: 15, color: colors.ink500 },
  searchGo: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.forest800, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", marginHorizontal: GUTTER, marginTop: -30, paddingVertical: 16, borderRadius: radius.card, backgroundColor: colors.white, ...shadow.card },
  stat: { flex: 1, alignItems: "center", gap: 4, paddingHorizontal: 6 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.sand200 },
  statValue: { fontFamily: font.display, fontSize: 24, color: colors.forest800, letterSpacing: -0.5 },
  statLabel: { fontFamily: font.bold, fontSize: 11.5, color: colors.ink500 },
  carousel: { paddingHorizontal: GUTTER, paddingTop: 18, gap: 14 },
  regions: { marginTop: 40, paddingHorizontal: GUTTER, paddingVertical: 32, backgroundColor: colors.sand100, overflow: "hidden" },
  mapCard: { marginHorizontal: GUTTER, marginTop: 36, minHeight: 330, borderRadius: radius.xl, overflow: "hidden", padding: 22, justifyContent: "flex-end", gap: 18, backgroundColor: colors.forest900 },
  mapButton: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", height: 46, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: colors.sand50 },
  eco: { marginTop: 36, paddingHorizontal: GUTTER, paddingVertical: 32, backgroundColor: colors.moss100, overflow: "hidden", gap: 22 },
  ecoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  ecoItem: { width: "47.8%", flexGrow: 1, padding: 14, gap: 6, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.7)" },
  ecoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.moss100, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  guides: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: GUTTER, marginTop: 28, padding: 18, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  guidesIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.moss100, alignItems: "center", justifyContent: "center" },
  cta: { marginHorizontal: GUTTER, marginTop: 16, padding: 24, gap: 10, borderRadius: radius.xl, backgroundColor: colors.forest900, overflow: "hidden" },
  statusStrip: { position: "absolute", top: 0, left: 0, right: 0, backgroundColor: "rgba(251,248,242,0.96)" },
});
