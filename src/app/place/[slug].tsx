import { FlatList, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Compass, Map as MapIcon, MapPin, Mountain, Navigation } from "lucide-react-native";
import { colors, GUTTER } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { WEB_URL } from "@/lib/api";
import { formatMetres } from "@/lib/format";
import { useNearbyPlaces, usePlace } from "@/lib/queries";
import { PlaceCard, TrailRow } from "@/components/cards";
import { DetailError, DetailScreen, LoadingDetail } from "@/components/detail-screen";
import { LocationLine, Paragraphs, PhotoCredit, Reviews, Sources, StatGrid, useOpenInMaps, type Stat } from "@/components/detail-parts";
import { Pill } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Block } from "@/components/ui/section";
import { RatingInline } from "@/components/ui/stars";
import { Txt } from "@/components/ui/text";

export default function PlaceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { dict, locale, m } = useI18n();
  const p = dict.place;
  const { data: place, isPending, isError, refetch } = usePlace(slug);
  const nearby = useNearbyPlaces(slug);
  const { open, sheet } = useOpenInMaps();

  if (isPending) return <LoadingDetail />;
  if (isError || !place) return <DetailError onRetry={refetch} />;

  const { lat, lng } = place.location;
  const type = dict.placeType[place.type];
  const where = [place.district?.name, place.region?.name].filter(Boolean).join(", ");
  const generated =
    place.district && place.region
      ? place.ele_m != null
        ? fill(p.generatedEle, { type, district: place.district.name, region: place.region.name, ele: formatMetres(place.ele_m, locale, dict) })
        : fill(p.generated, { type, district: place.district.name, region: place.region.name })
      : null;

  const stats: Stat[] = [
    ...(place.ele_m != null ? [{ icon: Mountain, label: p.elevation, value: formatMetres(place.ele_m, locale, dict), note: place.ele_source === "srtm" ? dict.common.est : undefined }] : []),
    ...(place.district ? [{ icon: MapPin, label: p.district, value: place.district.name }] : []),
    ...(place.region ? [{ icon: Compass, label: p.region, value: place.region.name }] : []),
  ];

  return (
    <DetailScreen
      title={place.name}
      image={place.image?.url}
      kind={place.type}
      shareUrl={`${WEB_URL}/${locale}/places/${place.slug}`}
      hero={
        <>
          <Pill label={type} tone="glass" />
          <Txt variant="display" color={colors.sand50}>
            {place.name}
          </Txt>
          {!!where && (
            <Txt variant="bodyStrong" color="rgba(251,248,242,0.85)">
              {where}
            </Txt>
          )}
          <RatingInline rating={place.rating} count={place.reviews_count} color={colors.sand50} />
        </>
      }
      footer={
        <>
          <Button variant="secondary" icon={MapIcon} onPress={() => router.navigate({ pathname: "/map", params: { focus: place.slug, kind: "place" } })} style={{ flex: 1 }}>
            {dict.map.title}
          </Button>
          <Button icon={Navigation} onPress={() => open(lat, lng, place.name, true)} style={{ flex: 2 }}>
            {dict.common.directions}
          </Button>
        </>
      }
    >
      {place.image ? <PhotoCredit photo={place.image} /> : (
        <Txt variant="micro" color={colors.ink400} style={{ paddingHorizontal: GUTTER }}>
          {p.noPhoto}
        </Txt>
      )}

      {stats.length > 0 && <StatGrid stats={stats} />}
      {place.ele_source === "srtm" && (
        <Txt variant="small" color={colors.ink500} style={{ paddingHorizontal: GUTTER, marginTop: -18 }}>
          {p.elevation}: {p.elevationSrtm}
        </Txt>
      )}

      <Block title={p.about}>
        {place.summary || generated ? (
          <Txt variant="bodyStrong" style={{ fontSize: 17, lineHeight: 25 }}>
            {place.summary ?? generated}
          </Txt>
        ) : null}
        {place.description && (
          <>
            <Paragraphs text={place.description} />
            <Txt variant="micro" color={colors.ink400}>
              {p.fromWikipedia}
            </Txt>
          </>
        )}
      </Block>

      <Block title={m.map.openIn}>
        <LocationLine text={where || place.name} lat={lat} lng={lng} label={place.name} />
      </Block>

      {place.trails.length > 0 && (
        <Block title={p.trailsHere}>
          <View style={{ gap: 10 }}>
            {place.trails.map((t) => (
              <TrailRow key={t.slug} trail={t} />
            ))}
          </View>
        </Block>
      )}

      <Reviews kind="places" slug={place.slug} reviews={place.reviews} rating={place.rating} count={place.reviews_count} />
      <Sources sources={place.sources} />

      {(nearby.data?.length ?? 0) > 0 && (
        <View style={{ gap: 4 }}>
          <Txt variant="heading" style={styles.pad}>
            {p.nearby}
          </Txt>
          <FlatList
            horizontal
            data={nearby.data}
            keyExtractor={(n) => n.slug}
            renderItem={({ item }) => <PlaceCard place={item} width={180} />}
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
  pad: { paddingHorizontal: GUTTER },
});
