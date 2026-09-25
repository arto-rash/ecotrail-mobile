import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ChevronLeft, Map as MapIcon } from "lucide-react-native";
import { colors, font, GUTTER, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { useFeaturedPlaces, useFeaturedTrails, useRegions } from "@/lib/queries";
import { PlaceRow, TrailCard } from "@/components/cards";
import { REGION_SHAPES } from "@/components/region-map";
import { Bouncy } from "@/components/ui/bouncy";
import { Button, IconButton } from "@/components/ui/button";
import { CardSkeleton, EmptyState } from "@/components/ui/states";
import { Txt } from "@/components/ui/text";
import { Topo } from "@/components/ui/topo";
import shapes from "@/data/az-regions.json";

/** Region outline highlighted within the whole country. */
function RegionShape({ slug, width }: { slug: string; width: number }) {
  const height = (width * shapes.height) / shapes.width;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${shapes.width} ${shapes.height}`}>
      {Object.entries(REGION_SHAPES).map(([s, shape]) => (
        <Path key={s} d={shape.path} fill={s === slug ? colors.moss200 : "rgba(251,248,242,0.1)"} stroke={colors.forest900} strokeWidth={1.4} />
      ))}
    </Svg>
  );
}

export default function RegionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { dict, locale, m } = useI18n();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"trails" | "places">("trails");
  const regions = useRegions();
  const region = regions.data?.find((r) => r.slug === slug);
  const trails = useFeaturedTrails(50, slug);
  const places = useFeaturedPlaces(50, slug);
  const name = REGION_SHAPES[slug]?.name[locale] ?? region?.name ?? "";
  const active = tab === "trails" ? trails : places;

  const header = (
    <View>
      <View style={[styles.hero, { paddingTop: insets.top + 64 }]}>
        <Topo color={colors.forest700} size={520} style={{ position: "absolute", top: -180, right: -220 }} />
        <RegionShape slug={slug} width={220} />
        <Txt variant="eyebrow" color={colors.moss200}>
          {m.region.title}
        </Txt>
        <Txt variant="display" color={colors.sand50}>
          {name}
        </Txt>
        {region && (
          <Txt variant="bodyStrong" color="rgba(251,248,242,0.8)">
            {fill(dict.regionMap.trails, { count: region.trails_count ?? 0 })} · {fill(dict.regionMap.places, { count: region.places_count ?? 0 })}
          </Txt>
        )}
        <Button variant="light" size="sm" icon={MapIcon} onPress={() => router.navigate({ pathname: "/explore", params: { region: slug, tab } })} style={{ alignSelf: "flex-start", marginTop: 6 }}>
          {m.region.filter}
        </Button>
      </View>
      <View style={styles.segment}>
        {(["trails", "places"] as const).map((t) => (
          <Bouncy key={t} scaleTo={0.96} onPress={() => setTab(t)} style={[styles.segItem, tab === t && styles.segActive]}>
            <Txt style={[styles.segText, tab === t && { color: colors.sand50 }]}>{t === "trails" ? m.region.trails : m.region.places}</Txt>
          </Bouncy>
        ))}
      </View>
    </View>
  );

  const items = (active.data ?? []) as { slug: string }[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand50 }}>
      <FlatList
        key={tab}
        data={items}
        keyExtractor={(i) => i.slug}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: GUTTER }}>
            {tab === "trails" ? <TrailCard trail={item as never} /> : <PlaceRow place={item as never} />}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, gap: tab === "trails" ? 16 : 10 }}
        ListEmptyComponent={
          active.isPending ? (
            <View style={{ paddingHorizontal: GUTTER }}>
              <CardSkeleton />
            </View>
          ) : (
            <EmptyState title={m.region.empty} />
          )
        }
      />
      <View style={[styles.back, { top: insets.top + 8 }]}>
        <IconButton icon={ChevronLeft} label={dict.common.back} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: GUTTER, paddingBottom: 28, gap: 8, backgroundColor: colors.forest900, overflow: "hidden" },
  back: { position: "absolute", left: GUTTER - 4 },
  segment: { flexDirection: "row", alignSelf: "flex-start", margin: GUTTER, marginBottom: 6, padding: 3, borderRadius: radius.pill, backgroundColor: colors.sand100 },
  segItem: { height: 36, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  segActive: { backgroundColor: colors.forest800 },
  segText: { fontFamily: font.bold, fontSize: 14, color: colors.ink700 },
});
