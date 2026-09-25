import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Linking, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight, Clock, Download, Expand, ExternalLink, Gauge, Mountain, MountainSnow, Navigation, Route, ShieldAlert, Signpost, UsersRound } from "lucide-react-native";
import { colors, GUTTER, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { WEB_URL } from "@/lib/api";
import { formatDistance, formatDuration, formatMetres, formatNumber } from "@/lib/format";
import { shareGpx } from "@/lib/gpx";
import { haptic } from "@/lib/haptics";
import { osmUrl } from "@/lib/maps";
import { useNearbyTrails, useTrail } from "@/lib/queries";
import type { TrailDetail } from "@/lib/types";
import { TrailTile } from "@/components/cards";
import { DetailError, DetailScreen, LoadingDetail } from "@/components/detail-screen";
import { LocationLine, Paragraphs, PhotoCredit, Reviews, Sources, StatGrid, useOpenInMaps, type Stat } from "@/components/detail-parts";
import { ElevationProfile } from "@/components/elevation-profile";
import { MapView } from "@/components/map/map-view";
import type { MapHandle } from "@/components/map/types";
import { DifficultyBadge, Pill } from "@/components/ui/badges";
import { Bouncy } from "@/components/ui/bouncy";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Avatar } from "@/components/ui/monogram";
import { Block } from "@/components/ui/section";
import { RatingInline } from "@/components/ui/stars";
import { Txt } from "@/components/ui/text";

function bboxOf(trail: TrailDetail): [number, number, number, number] | null {
  const coords = trail.route?.coordinates.flat() ?? [];
  if (!coords.length) return null;
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

function RouteMap({ trail }: { trail: TrailDetail }) {
  const map = useRef<MapHandle>(null);
  const [ready, setReady] = useState(false);
  const bbox = useMemo(() => bboxOf(trail), [trail]);

  useEffect(() => {
    if (!ready) return;
    map.current?.send({
      type: "data",
      trails: {
        type: "FeatureCollection",
        features: trail.route
          ? [{ type: "Feature", geometry: trail.route, properties: { slug: trail.slug, difficulty: trail.difficulty, lat: trail.location.lat, lng: trail.location.lng } }]
          : [],
      },
      places: {
        type: "FeatureCollection",
        features: trail.places.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.location.lng, p.location.lat] }, properties: { slug: p.slug, name: p.name, type: p.type } })),
      },
    });
    if (bbox) map.current?.send({ type: "fit", bbox, padding: 36, animate: false });
    else map.current?.send({ type: "fly", lat: trail.location.lat, lng: trail.location.lng, zoom: 12 });
  }, [ready, trail, bbox]);

  return (
    <View style={styles.mapWrap}>
      <MapView
        ref={map}
        interactive={false}
        bounds={bbox ?? undefined}
        style={StyleSheet.absoluteFill}
        onMessage={(msg) => {
          if (msg.type === "ready") setReady(true);
        }}
      />
      <Bouncy
        scaleTo={0.99}
        style={StyleSheet.absoluteFill}
        onPress={() => router.navigate({ pathname: "/map", params: { focus: trail.slug, kind: "trail" } })}
        accessibilityRole="button"
      >
        <View style={styles.expand}>
          <Expand size={16} color={colors.forest900} strokeWidth={2.4} />
        </View>
      </Bouncy>
    </View>
  );
}

export default function TrailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { dict, locale, m } = useI18n();
  const t = dict.trail;
  const { data: trail, isPending, isError, refetch } = useTrail(slug);
  const nearby = useNearbyTrails(slug);
  const { open, sheet } = useOpenInMaps();
  const [gpxBusy, setGpxBusy] = useState(false);
  const [gpxError, setGpxError] = useState(false);

  if (isPending) return <LoadingDetail />;
  if (isError || !trail) return <DetailError onRetry={refetch} />;

  const est = trail.stats_estimated ? dict.common.est : undefined;
  const { lat, lng } = trail.location;
  const where = [trail.village, trail.district?.name, trail.region?.name].filter(Boolean).join(", ");
  const routeType = dict.routeType[trail.route_type].toLowerCase();
  const home = locale === "az" ? "Azərbaycan" : "Azerbaijan";
  const summary =
    trail.summary ??
    (trail.ascent_m && trail.max_ele_m
      ? fill(t.generatedSummary, {
          distance: formatDistance(trail.distance_km, locale, dict),
          routeType,
          district: trail.district?.name ?? trail.region?.name ?? home,
          ascent: formatMetres(trail.ascent_m, locale, dict),
          highest: formatMetres(trail.max_ele_m, locale, dict),
        })
      : fill(t.generatedSummaryFlat, { distance: formatDistance(trail.distance_km, locale, dict), routeType, district: trail.district?.name ?? home }));

  const stats: Stat[] = [
    { icon: Route, label: t.distance, value: formatDistance(trail.distance_km, locale, dict), note: trail.route_type === "point_to_point" ? dict.common.oneWay : undefined },
    { icon: Clock, label: t.time, value: formatDuration(trail.duration_minutes, dict), note: est },
    ...(trail.ascent_m != null ? [{ icon: Mountain, label: t.ascent, value: `+${formatMetres(trail.ascent_m, locale, dict)}`, note: est }] : []),
    ...(trail.max_ele_m != null ? [{ icon: MountainSnow, label: t.highest, value: formatMetres(trail.max_ele_m, locale, dict), note: est }] : []),
    { icon: Signpost, label: t.route, value: dict.routeType[trail.route_type] },
  ];
  const basis = trail.difficulty_basis === "sac_scale" ? t.difficultyBasisSac : trail.difficulty_basis === "effort" ? t.difficultyBasisEffort : t.difficultyBasisSubmitter;
  const guides = trail.guides ?? [];

  async function gpx() {
    if (!trail) return;
    setGpxBusy(true);
    setGpxError(false);
    try {
      await shareGpx(trail.slug, trail.name);
      haptic.success();
    } catch {
      setGpxError(true);
      haptic.error();
    } finally {
      setGpxBusy(false);
    }
  }

  return (
    <DetailScreen
      title={trail.name}
      image={trail.image?.url}
      kind="trail"
      shareUrl={`${WEB_URL}/${locale}/trails/${trail.slug}`}
      hero={
        <>
          <View style={styles.badges}>
            <DifficultyBadge difficulty={trail.difficulty} />
            {trail.duration_minutes > 600 && <Pill label={t.multiDay} tone="dark" />}
            {trail.network === "tct" && <Pill label={t.partOfTct} tone="glass" />}
          </View>
          <Txt variant="display" color={colors.sand50}>
            {trail.name}
          </Txt>
          {!!where && (
            <Txt variant="bodyStrong" color="rgba(251,248,242,0.85)">
              {where}
            </Txt>
          )}
          <RatingInline rating={trail.rating} count={trail.reviews_count} color={colors.sand50} />
        </>
      }
      footer={
        <>
          <Button variant="secondary" icon={Download} loading={gpxBusy} onPress={gpx} style={{ flex: 1 }} disabled={!trail.route}>
            GPX
          </Button>
          <Button icon={Navigation} onPress={() => open(lat, lng, trail.name, true)} style={{ flex: 2 }}>
            {t.directionsToStart}
          </Button>
        </>
      }
    >
      <PhotoCredit photo={trail.image} />

      <StatGrid stats={stats} />
      {trail.stats_estimated && (
        <Txt variant="small" color={colors.ink500} style={{ paddingHorizontal: GUTTER, marginTop: -18 }}>
          {dict.common.est} — {dict.common.estimatedTooltip}
        </Txt>
      )}

      <Block title={t.overview}>
        <Txt variant="bodyStrong" style={{ fontSize: 17, lineHeight: 25 }}>
          {summary}
        </Txt>
        {trail.description && <Paragraphs text={trail.description} />}
        {trail.segments > 1 && (
          <Txt variant="small" color={colors.ink500}>
            {fill(t.segmentsNote, { count: trail.segments })}
          </Txt>
        )}
        {trail.features.length > 0 && (
          <View style={styles.wrap}>
            {trail.features.map((f) => (
              <Pill key={f} label={dict.feature[f as keyof typeof dict.feature] ?? f} tone="moss" />
            ))}
          </View>
        )}
      </Block>

      <Block title={t.route}>
        <RouteMap trail={trail} />
        <LocationLine text={`${t.trailhead}${where ? ` · ${where}` : ""}`} lat={lat} lng={lng} label={trail.name} />
        <View style={styles.links}>
          <Chip label="OpenStreetMap" icon={ExternalLink} onPress={() => Linking.openURL(trail.osm_relation_id ? `https://www.openstreetmap.org/relation/${trail.osm_relation_id}` : osmUrl(lat, lng))} />
          {trail.route && <Chip label={t.downloadGpx} icon={Download} onPress={gpx} />}
        </View>
        {gpxError && (
          <Txt variant="small" color={colors.pomegranate600}>
            {m.trail.gpxError}
          </Txt>
        )}
        {trail.route && (
          <Txt variant="small" color={colors.ink500}>
            {t.gpxHint}
          </Txt>
        )}
      </Block>

      {trail.elevation_profile.length > 1 && (
        <Block title={t.profile}>
          <View style={styles.card}>
            <ElevationProfile points={trail.elevation_profile} />
          </View>
          <Txt variant="micro" color={colors.ink500}>
            {t.profileNote}
          </Txt>
        </Block>
      )}

      {trail.waypoints.length > 0 && (
        <Block title={dict.submit.waypoints}>
          <View style={{ gap: 0 }}>
            {trail.waypoints.map((w, i) => (
              <View key={`${w}-${i}`} style={styles.waypoint}>
                <View style={styles.wpRail}>
                  <View style={[styles.wpDot, i === 0 && { backgroundColor: colors.forest700 }]} />
                  {i < trail.waypoints.length - 1 && <View style={styles.wpLine} />}
                </View>
                <Txt variant="bodyStrong" style={{ flex: 1, paddingBottom: 16 }}>
                  {w}
                </Txt>
              </View>
            ))}
          </View>
        </Block>
      )}

      {trail.places.length > 0 && (
        <Block title={t.onTheWay}>
          <View style={{ gap: 8 }}>
            {trail.places.map((p) => (
              <Bouncy key={p.slug} scaleTo={0.98} onPress={() => router.push(`/place/${p.slug}`)} style={styles.placeRow}>
                <View style={{ flex: 1 }}>
                  <Txt variant="label">{p.name}</Txt>
                  <Txt variant="small" color={colors.ink500}>
                    {dict.placeType[p.type]}
                    {p.ele_m != null ? ` · ${formatMetres(p.ele_m, locale, dict)}` : ""}
                  </Txt>
                </View>
                <ArrowRight size={16} color={colors.ink400} />
              </Bouncy>
            ))}
          </View>
        </Block>
      )}

      <View style={[styles.difficulty, { marginHorizontal: GUTTER }]}>
        <Gauge size={20} color={colors.forest700} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="bodyStrong">
            {t.bestFor}: {dict.difficulty[trail.difficulty]} — {dict.difficultyBlurb[trail.difficulty]}
          </Txt>
          <Txt variant="small" color={colors.ink700}>
            {basis}
          </Txt>
        </View>
      </View>

      <View style={[styles.safety, { marginHorizontal: GUTTER }]}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <ShieldAlert size={20} color={colors.moss200} />
          <Txt variant="cardTitle" color={colors.sand50} style={{ flex: 1 }}>
            {dict.difficultyBlurb[trail.difficulty]}
          </Txt>
        </View>
        <Txt variant="small" color="rgba(251,248,242,0.8)">
          {t.safety}
        </Txt>
        {guides.length === 0 && (
          <Button variant="light" size="sm" icon={UsersRound} onPress={() => router.navigate("/guides")} style={{ alignSelf: "flex-start", marginTop: 4 }}>
            {t.withGuide}
          </Button>
        )}
      </View>

      {guides.length > 0 && (
        <Block title={dict.guides.onTrail}>
          <Txt variant="small" color={colors.ink500} style={{ marginTop: -8 }}>
            {dict.guides.onTrailHint}
          </Txt>
          <View style={{ gap: 8 }}>
            {guides.map((g) => (
              <Bouncy key={g.slug} scaleTo={0.98} onPress={() => router.push(`/guide/${g.slug}`)} style={styles.placeRow}>
                <Avatar name={g.name} photo={g.photo} size={46} rounded={14} />
                <View style={{ flex: 1 }}>
                  <Txt variant="label" numberOfLines={1}>
                    {g.name}
                  </Txt>
                  <Txt variant="small" color={colors.ink500} numberOfLines={1}>
                    {g.price_from_azn != null ? `${dict.guides.from} ${formatNumber(locale, g.price_from_azn)} ₼ ${g.price_unit?.label ?? ""}` : g.kind === "agency" ? dict.guides.agency : dict.guides.guide}
                    {g.is_sample ? ` · ${dict.guides.sample}` : ""}
                  </Txt>
                </View>
                <ArrowRight size={16} color={colors.ink400} />
              </Bouncy>
            ))}
          </View>
        </Block>
      )}

      <Reviews kind="trails" slug={trail.slug} reviews={trail.reviews} rating={trail.rating} count={trail.reviews_count} />
      <Sources sources={trail.sources} />

      {(nearby.data?.length ?? 0) > 0 && (
        <View style={{ gap: 4 }}>
          <Txt variant="heading" style={{ paddingHorizontal: GUTTER }}>
            {t.nearby}
          </Txt>
          <FlatList
            horizontal
            data={nearby.data}
            keyExtractor={(n) => n.slug}
            renderItem={({ item }) => <TrailTile trail={item} width={220} />}
            contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 12, gap: 12 }}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
      {sheet}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mapWrap: { height: 240, borderRadius: radius.card, overflow: "hidden", borderWidth: 1, borderColor: colors.sand200 },
  expand: { position: "absolute", top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(251,248,242,0.95)", alignItems: "center", justifyContent: "center" },
  card: { padding: 12, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  waypoint: { flexDirection: "row", gap: 12 },
  wpRail: { width: 14, alignItems: "center" },
  wpDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, borderColor: colors.forest600, backgroundColor: colors.sand50, marginTop: 5 },
  wpLine: { flex: 1, width: 2, backgroundColor: colors.sand300, marginVertical: 2 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  difficulty: { flexDirection: "row", gap: 12, padding: 16, borderRadius: radius.card, backgroundColor: colors.sand100 },
  safety: { padding: 18, gap: 10, borderRadius: radius.card, backgroundColor: colors.forest900 },
});
