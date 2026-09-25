import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, ChevronRight, Clock, LocateFixed, Mountain, Navigation, Route, TriangleAlert, X } from "lucide-react-native";
import { colors, font, GUTTER, radius, shadow } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { formatDistance, formatDuration, formatMetres, PLACE_TYPES } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { googleDirectionsUrl } from "@/lib/maps";
import { useMapData, useRegions } from "@/lib/queries";
import type { PlaceFeatureProps, TrailFeatureProps } from "@/lib/types";
import { MapView } from "@/components/map/map-view";
import { AZ_BOUNDS, PLACE_COLORS } from "@/components/map/map-html";
import type { MapHandle, MapOutMessage } from "@/components/map/types";
import { REGION_SHAPES, RegionMap } from "@/components/region-map";
import { useTabBarSpace } from "@/components/tab-bar";
import { Bouncy } from "@/components/ui/bouncy";
import { Button, IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CoverImage } from "@/components/ui/cover-image";
import { DifficultyBadge, Pill } from "@/components/ui/badges";
import { Txt } from "@/components/ui/text";
import { Topo } from "@/components/ui/topo";

type Mode = "regions" | "terrain";
type Layer = "all" | "trails" | (typeof PLACE_TYPES)[number];
type Selected = { kind: "trail"; props: TrailFeatureProps } | { kind: "place"; props: PlaceFeatureProps; lat: number; lng: number } | null;

export default function MapScreen() {
  const { dict, locale, m } = useI18n();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const params = useLocalSearchParams<{ focus?: string; kind?: string }>();
  const map = useRef<MapHandle>(null);
  const [ready, setReady] = useState(false);
  // Like the website: start on the region picker, switch to the terrain map for a region or a trail.
  const [mode, setMode] = useState<Mode>(params.focus ? "terrain" : "regions");
  const [region, setRegion] = useState<string | null>(null);
  const [layer, setLayer] = useState<Layer>("all");
  const [selected, setSelected] = useState<Selected>(null);
  const [locating, setLocating] = useState(false);
  const { data } = useMapData();
  const regions = useRegions();
  const regionInfo = region ? regions.data?.find((r) => r.slug === region) : null;

  // Only draw what belongs to the chosen region, if any.
  const visible = useMemo(() => {
    if (!data) return null;
    const inRegion = <T extends { properties: { region: string | null } }>(fs: T[]) => (region ? fs.filter((f) => f.properties.region === region) : fs);
    return { trails: { ...data.trails, features: inRegion(data.trails.features) }, places: { ...data.places, features: inRegion(data.places.features) } };
  }, [data, region]);

  const trailsBySlug = useMemo(() => new Map((data?.trails.features ?? []).map((f) => [f.properties.slug, f])), [data]);
  const placesBySlug = useMemo(() => new Map((data?.places.features ?? []).map((f) => [f.properties.slug, f])), [data]);

  // Push data and layer visibility into the map whenever either changes.
  useEffect(() => {
    if (!ready || !visible) return;
    map.current?.send({ type: "data", trails: visible.trails, places: visible.places });
  }, [ready, visible]);

  // Frame the chosen region, or the whole country.
  useEffect(() => {
    if (!ready || params.focus) return;
    const bbox = (region && REGION_SHAPES[region]?.bounds) || AZ_BOUNDS;
    map.current?.send({ type: "fit", bbox, padding: { top: 150, bottom: tabSpace + 20, left: 24, right: 24 } });
  }, [ready, region, tabSpace, params.focus]);

  function chooseRegion(slug: string | null) {
    setRegion(slug);
    setSelected(null);
    map.current?.send({ type: "active", slug: null });
    if (slug) setMode("terrain");
  }

  useEffect(() => {
    if (!ready) return;
    const placeTypes = layer === "all" || layer === "trails" ? [] : [layer];
    map.current?.send({ type: "visibility", trails: layer === "all" || layer === "trails", places: layer !== "trails", placeTypes });
  }, [ready, layer]);

  useEffect(() => {
    map.current?.send({ type: "padding", bottom: tabSpace - 10 });
  }, [ready, tabSpace]);

  const select = useCallback(
    (kind: "trail" | "place", slug: string, fly = false) => {
      if (kind === "trail") {
        const f = trailsBySlug.get(slug);
        if (!f) return;
        setSelected({ kind, props: f.properties });
        if (fly) {
          const coords = f.geometry.coordinates.flat();
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          map.current?.send({ type: "fit", bbox: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], padding: { top: 140, bottom: tabSpace + 200, left: 40, right: 40 } });
        }
      } else {
        const f = placesBySlug.get(slug);
        if (!f) return;
        const [lng, lat] = f.geometry.coordinates;
        setSelected({ kind, props: f.properties, lat, lng });
        if (fly) map.current?.send({ type: "fly", lat, lng, zoom: 12 });
      }
      map.current?.send({ type: "active", slug });
    },
    [trailsBySlug, placesBySlug, tabSpace],
  );

  // Deep link from a trail or place page: /map?focus=slug&kind=trail. The map lives in a WebView,
  // so this is syncing with an external system.
  const [seenFocus, setSeenFocus] = useState(params.focus);
  if (params.focus && params.focus !== seenFocus) {
    setSeenFocus(params.focus);
    setMode("terrain");
    setRegion(null);
  }
  useEffect(() => {
    if (!ready || !data || !params.focus) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    select(params.kind === "place" ? "place" : "trail", params.focus, true);
  }, [ready, data, params.focus, params.kind, select]);

  const onMessage = useCallback(
    (msg: MapOutMessage) => {
      if (msg.type === "ready") setReady(true);
      else if (msg.type === "select") {
        haptic.select();
        select(msg.kind, msg.slug);
      } else if (msg.type === "press") {
        setSelected(null);
        map.current?.send({ type: "active", slug: null });
      }
    },
    [select],
  );

  async function nearMe() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alertOnce(m.map.locationDenied);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;
      map.current?.send({ type: "me", lat, lng });
      map.current?.send({ type: "fly", lat, lng, zoom: 10 });
      haptic.success();
    } catch {
      alertOnce(m.map.locationDenied);
    } finally {
      setLocating(false);
    }
  }

  const [notice, setNotice] = useState<string | null>(null);
  function alertOnce(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(null), 4000);
  }

  const layers: { value: Layer; label: string; dot?: string }[] = [
    { value: "all", label: m.map.all },
    { value: "trails", label: m.map.trails, dot: colors.forest600 },
    ...PLACE_TYPES.map((t) => ({ value: t as Layer, label: dict.placeTypePlural[t], dot: PLACE_COLORS[t] })),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#e9e4d6" }}>
      <MapView ref={map} style={StyleSheet.absoluteFill} onMessage={onMessage} />

      {mode === "regions" && (
        <View style={[StyleSheet.absoluteFill, styles.regions]}>
          <Topo color={colors.sand200} size={620} style={{ position: "absolute", top: -160, right: -260 }} />
          <ScrollView contentContainerStyle={{ paddingTop: insets.top + 78, paddingHorizontal: GUTTER, paddingBottom: tabSpace + 10, gap: 18 }} showsVerticalScrollIndicator={false}>
            {regions.data && <RegionMap regions={regions.data} selected={region} onSelect={chooseRegion} />}
            <Txt variant="small" color={colors.ink500}>
              {m.region.tapHint}
            </Txt>
            <View style={styles.regionList}>
              {(regions.data ?? []).map((r, i) => (
                <Bouncy key={r.slug} scaleTo={0.98} onPress={() => chooseRegion(r.slug)} style={[styles.regionRow, i > 0 && styles.regionDivider]} accessibilityRole="button">
                  <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                    {REGION_SHAPES[r.slug]?.name[locale] ?? r.name}
                  </Txt>
                  {r.hiking_advised ? (
                    <Txt variant="small" color={colors.ink500}>
                      {fill(dict.regionMap.trails, { count: r.trails_count ?? 0 })} · {fill(dict.regionMap.places, { count: r.places_count ?? 0 })}
                    </Txt>
                  ) : (
                    <TriangleAlert size={15} color={colors.pomegranate600} />
                  )}
                  <ChevronRight size={16} color={colors.ink400} />
                </Bouncy>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.titleRow} pointerEvents="box-none">
          <View style={[styles.titlePill, shadow.card]}>
            <Txt variant="heading">{dict.map.title}</Txt>
            <View style={styles.toggle}>
              {(["regions", "terrain"] as const).map((v) => (
                <Bouncy
                  key={v}
                  scaleTo={0.95}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === v }}
                  onPress={() => {
                    haptic.select();
                    setMode(v);
                  }}
                  style={[styles.toggleItem, mode === v && styles.toggleOn]}
                >
                  <Txt style={[styles.toggleText, mode === v && { color: colors.sand50 }]}>{v === "regions" ? dict.map.regions : dict.map.terrain}</Txt>
                </Bouncy>
              ))}
            </View>
          </View>
          {mode === "terrain" && <IconButton icon={LocateFixed} label={m.map.nearMe} onPress={nearMe} tone="plain" size={46} />}
        </View>
        {mode === "terrain" && regionInfo && (
          <View style={[styles.regionBar, shadow.card]}>
            <Txt variant="label" style={{ flex: 1 }} numberOfLines={1}>
              {REGION_SHAPES[regionInfo.slug]?.name[locale] ?? regionInfo.name}
            </Txt>
            <Bouncy onPress={() => chooseRegion(null)} hitSlop={8} style={styles.regionClear} accessibilityRole="button">
              <X size={14} color={colors.pomegranate600} strokeWidth={2.6} />
              <Txt style={styles.regionClearText}>{dict.map.backToAll}</Txt>
            </Bouncy>
          </View>
        )}
        {mode === "terrain" && regionInfo && !regionInfo.hiking_advised && (
          <View style={styles.warning}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TriangleAlert size={16} color={colors.pomegranate700} />
              <Txt variant="label" color={colors.pomegranate700}>
                {dict.map.notAdvisedTitle}
              </Txt>
            </View>
            <Txt variant="small" color={colors.pomegranate700}>
              {dict.map.notAdvisedText}
            </Txt>
          </View>
        )}
        {mode === "terrain" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layers}>
          {layers.map((l) => (
            <View key={l.value} style={[{ borderRadius: radius.pill }, shadow.card]}>
              <Chip label={l.label} dot={l.dot} selected={layer === l.value} onPress={() => setLayer(l.value)} />
            </View>
          ))}
        </ScrollView>
        )}
        {(notice || locating) && (
          <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.notice}>
            <Txt variant="small" color={colors.sand50}>
              {locating ? dict.common.loading : notice}
            </Txt>
          </Animated.View>
        )}
      </View>

      {mode === "terrain" && selected && (
        <Animated.View key={selected.props.slug} entering={FadeInDown.duration(260)} exiting={FadeOutDown.duration(180)} style={[styles.peek, { bottom: tabSpace - 6 }]}>
          <Bouncy
            scaleTo={0.985}
            onPress={() => router.push(selected.kind === "trail" ? `/trail/${selected.props.slug}` : `/place/${selected.props.slug}`)}
            style={styles.peekCard}
          >
            <CoverImage src={selected.props.image} kind={selected.kind === "trail" ? "trail" : selected.props.type} style={styles.peekPhoto} />
            <View style={{ flex: 1, gap: 6 }}>
              {selected.kind === "trail" ? <DifficultyBadge difficulty={selected.props.difficulty} /> : <Pill label={dict.placeType[selected.props.type]} tone="moss" />}
              <Txt variant="cardTitle" numberOfLines={2}>
                {selected.props.name}
              </Txt>
              <View style={styles.metaRow}>
                {selected.kind === "trail" ? (
                  <>
                    <Meta icon={Route} text={formatDistance(selected.props.distance_km, locale, dict)} />
                    <Meta icon={Clock} text={formatDuration(selected.props.duration_minutes, dict)} />
                  </>
                ) : (
                  selected.props.ele_m != null && <Meta icon={Mountain} text={formatMetres(selected.props.ele_m, locale, dict)} />
                )}
              </View>
            </View>
            <Bouncy
              hitSlop={8}
              onPress={() => {
                setSelected(null);
                map.current?.send({ type: "active", slug: null });
              }}
              style={styles.peekClose}
              accessibilityLabel={m.common.close}
            >
              <X size={16} color={colors.ink700} strokeWidth={2.4} />
            </Bouncy>
          </Bouncy>
          <View style={styles.peekActions}>
            <Button
              size="sm"
              variant="outline"
              icon={Navigation}
              style={{ flex: 1 }}
              onPress={() => {
                const lat = selected.kind === "trail" ? selected.props.lat : selected.lat;
                const lng = selected.kind === "trail" ? selected.props.lng : selected.lng;
                Linking.openURL(googleDirectionsUrl(lat, lng));
              }}
            >
              {dict.common.directions}
            </Button>
            <Button size="sm" iconRight={ArrowRight} style={{ flex: 1 }} onPress={() => router.push(selected.kind === "trail" ? `/trail/${selected.props.slug}` : `/place/${selected.props.slug}`)}>
              {m.map.details}
            </Button>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Icon size={14} color={colors.ink500} strokeWidth={2.2} />
      <Txt style={{ fontFamily: font.bold, fontSize: 13, color: colors.ink700 }}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0, gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GUTTER },
  titlePill: { flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 18, paddingRight: 5, height: 46, borderRadius: radius.pill, backgroundColor: colors.sand50 },
  toggle: { flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: colors.sand100 },
  toggleItem: { height: 30, paddingHorizontal: 12, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  toggleOn: { backgroundColor: colors.forest800 },
  toggleText: { fontFamily: font.bold, fontSize: 12.5, color: colors.ink700 },
  regions: { backgroundColor: colors.sand100, overflow: "hidden" },
  regionList: { borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200, overflow: "hidden" },
  regionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  regionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.sand300 },
  regionBar: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: GUTTER, paddingLeft: 16, paddingRight: 6, height: 44, borderRadius: radius.pill, backgroundColor: colors.sand50 },
  regionClear: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 32, borderRadius: radius.pill, backgroundColor: colors.pomegranate100 },
  regionClearText: { fontFamily: font.bold, fontSize: 12, color: colors.pomegranate600 },
  warning: { marginHorizontal: GUTTER, padding: 14, gap: 4, borderRadius: radius.lg, backgroundColor: colors.pomegranate100 },
  layers: { paddingHorizontal: GUTTER, gap: 8, paddingBottom: 8 },
  notice: { marginHorizontal: GUTTER, padding: 12, borderRadius: radius.md, backgroundColor: "rgba(14,34,23,0.88)" },
  peek: { position: "absolute", left: 14, right: 14, padding: 12, gap: 12, borderRadius: 24, backgroundColor: colors.sand50, ...shadow.lift },
  peekCard: { flexDirection: "row", gap: 14, alignItems: "center" },
  peekPhoto: { width: 92, height: 92, borderRadius: 16 },
  peekClose: { position: "absolute", top: -2, right: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sand100, alignItems: "center", justifyContent: "center" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  peekActions: { flexDirection: "row", gap: 10 },
});
