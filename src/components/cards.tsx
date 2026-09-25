import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { Clock, Languages, MapPin, Mountain, MoveUpRight, Route, TrendingUp } from "lucide-react-native";
import { colors, font, radius, shadow } from "@/theme";
import { useI18n, plural } from "@/i18n";
import { formatDistance, formatDuration, formatMetres, formatNumber } from "@/lib/format";
import type { Guide, Place, Trail } from "@/lib/types";
import { Bouncy } from "./ui/bouncy";
import { CoverImage } from "./ui/cover-image";
import { DifficultyBadge, Pill, VerifiedBadge } from "./ui/badges";
import { Avatar } from "./ui/monogram";
import { RatingInline } from "./ui/stars";
import { Txt } from "./ui/text";

function Meta({ icon: Icon, text, light }: { icon: typeof Clock; text: string; light?: boolean }) {
  return (
    <View style={styles.meta}>
      <Icon size={14} color={light ? "rgba(251,248,242,0.85)" : colors.ink500} strokeWidth={2.2} />
      <Txt style={[styles.metaText, light && { color: "rgba(251,248,242,0.92)" }]}>{text}</Txt>
    </View>
  );
}

function where(district?: { name: string } | null, region?: { name: string } | null) {
  return [district?.name, region?.name].filter(Boolean).join(", ");
}

/** Large photo card for lists: photo on top, facts below. */
export function TrailCard({ trail, style }: { trail: Trail; style?: StyleProp<ViewStyle> }) {
  const { dict, locale } = useI18n();
  return (
    <Bouncy onPress={() => router.push(`/trail/${trail.slug}`)} style={[styles.card, style]} accessibilityRole="link" accessibilityLabel={trail.name}>
      <CoverImage src={trail.image?.url} kind="trail" style={styles.cardPhoto} />
      <View style={styles.photoBadges}>
        <DifficultyBadge difficulty={trail.difficulty} />
        {trail.segments > 1 || trail.duration_minutes > 600 ? <Pill label={dict.trail.multiDay} tone="glass" /> : null}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Txt variant="cardTitle" numberOfLines={2} style={{ flex: 1 }}>
            {trail.name}
          </Txt>
          <RatingInline rating={trail.rating} count={trail.reviews_count} />
        </View>
        {!!where(trail.district, trail.region) && (
          <Meta icon={MapPin} text={where(trail.district, trail.region)} />
        )}
        <View style={styles.statsRow}>
          <Meta icon={Route} text={formatDistance(trail.distance_km, locale, dict)} />
          <Meta icon={Clock} text={formatDuration(trail.duration_minutes, dict)} />
          {trail.ascent_m != null && <Meta icon={TrendingUp} text={formatMetres(trail.ascent_m, locale, dict)} />}
        </View>
      </View>
    </Bouncy>
  );
}

/** Portrait card with text over the photo, for horizontal carousels. */
export function TrailTile({ trail, width = 250 }: { trail: Trail; width?: number }) {
  const { dict, locale } = useI18n();
  return (
    <Bouncy onPress={() => router.push(`/trail/${trail.slug}`)} style={[styles.tile, { width }]} accessibilityRole="link" accessibilityLabel={trail.name}>
      <CoverImage src={trail.image?.url} kind="trail" scrim style={StyleSheet.absoluteFill} />
      <View style={styles.tileTop}>
        <DifficultyBadge difficulty={trail.difficulty} />
      </View>
      <View style={styles.tileBottom}>
        {trail.region && (
          <Txt variant="eyebrow" color={colors.moss200} numberOfLines={1}>
            {trail.region.name}
          </Txt>
        )}
        <Txt variant="heading" color={colors.sand50} numberOfLines={2}>
          {trail.name}
        </Txt>
        <View style={styles.statsRow}>
          <Meta light icon={Route} text={formatDistance(trail.distance_km, locale, dict)} />
          <Meta light icon={Clock} text={formatDuration(trail.duration_minutes, dict)} />
        </View>
      </View>
    </Bouncy>
  );
}

/** Compact horizontal row: thumbnail + facts. Used on detail pages. */
export function TrailRow({ trail }: { trail: Trail }) {
  const { dict, locale } = useI18n();
  return (
    <Bouncy onPress={() => router.push(`/trail/${trail.slug}`)} style={styles.row} scaleTo={0.98} accessibilityRole="link" accessibilityLabel={trail.name}>
      <CoverImage src={trail.image?.url} kind="trail" style={styles.rowThumb} />
      <View style={{ flex: 1, gap: 5 }}>
        <Txt variant="cardTitle" numberOfLines={2}>
          {trail.name}
        </Txt>
        <View style={[styles.statsRow, { gap: 10 }]}>
          <DifficultyBadge difficulty={trail.difficulty} />
          <Meta icon={Route} text={formatDistance(trail.distance_km, locale, dict)} />
        </View>
      </View>
    </Bouncy>
  );
}

export function PlaceCard({ place, width }: { place: Place; width?: number }) {
  const { dict, locale } = useI18n();
  return (
    <Bouncy onPress={() => router.push(`/place/${place.slug}`)} style={[styles.place, width ? { width } : { flex: 1 }]} accessibilityRole="link" accessibilityLabel={place.name}>
      <CoverImage src={place.image?.url} kind={place.type} scrim style={StyleSheet.absoluteFill} />
      <View style={styles.tileTop}>
        <Pill label={dict.placeType[place.type]} tone="glass" />
      </View>
      <View style={styles.tileBottom}>
        <Txt variant="cardTitle" color={colors.sand50} numberOfLines={2}>
          {place.name}
        </Txt>
        <View style={styles.statsRow}>
          {place.ele_m != null && <Meta light icon={Mountain} text={formatMetres(place.ele_m, locale, dict)} />}
          {place.region && <Meta light icon={MapPin} text={place.region.name} />}
        </View>
      </View>
    </Bouncy>
  );
}

/** Row version of a place for lists. */
export function PlaceRow({ place }: { place: Place }) {
  const { dict, locale } = useI18n();
  return (
    <Bouncy onPress={() => router.push(`/place/${place.slug}`)} style={styles.row} scaleTo={0.98} accessibilityRole="link" accessibilityLabel={place.name}>
      <CoverImage src={place.image?.url} kind={place.type} style={styles.rowThumb} />
      <View style={{ flex: 1, gap: 5 }}>
        <Txt variant="eyebrow" color={colors.forest600}>
          {dict.placeType[place.type]}
        </Txt>
        <Txt variant="cardTitle" numberOfLines={2}>
          {place.name}
        </Txt>
        <View style={styles.statsRow}>
          {place.ele_m != null && <Meta icon={Mountain} text={formatMetres(place.ele_m, locale, dict)} />}
          {!!where(place.district, place.region) && <Meta icon={MapPin} text={where(place.district, place.region)} />}
        </View>
      </View>
      <RatingInline rating={place.rating} />
    </Bouncy>
  );
}

export function GuideCard({ guide }: { guide: Guide }) {
  const { dict, locale } = useI18n();
  const g = dict.guides;
  const specialties = guide.specialties ?? [];
  const languages = guide.languages ?? [];
  return (
    <Bouncy onPress={() => router.push(`/guide/${guide.slug}`)} style={styles.guide} scaleTo={0.98} accessibilityRole="link" accessibilityLabel={guide.name}>
      <View style={{ flexDirection: "row", gap: 14 }}>
        <Avatar name={guide.name} photo={guide.photo} size={60} rounded={18} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {guide.is_verified && <VerifiedBadge />}
            {guide.is_sample && <Pill label={g.sample} tone="ochre" />}
            {!guide.is_verified && !guide.is_sample && <Pill label={guide.kind === "agency" ? g.agency : g.guide} />}
          </View>
          <Txt variant="cardTitle" numberOfLines={1}>
            {guide.name}
          </Txt>
          {guide.headline && (
            <Txt variant="small" color={colors.ink500} numberOfLines={2}>
              {guide.headline}
            </Txt>
          )}
        </View>
      </View>

      {specialties.length > 0 && (
        <View style={styles.tags}>
          {specialties.slice(0, 3).map((s) => (
            <Pill key={s.value} label={s.label} tone="moss" />
          ))}
        </View>
      )}

      <View style={styles.guideFooter}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.statsRow}>
            {guide.experience_years != null && (
              <Meta icon={Mountain} text={plural(guide.experience_years, g.years, g.yearsOne)} />
            )}
            {!!guide.tours_count && <Meta icon={Route} text={plural(guide.tours_count, g.toursCount, g.toursCountOne)} />}
          </View>
          {languages.length > 0 && <Meta icon={Languages} text={languages.map((l) => l.label).join(" · ")} />}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <RatingInline rating={guide.rating} count={guide.reviews_count} />
          {guide.price_from_azn != null ? (
            <Txt style={styles.price}>
              <Txt style={styles.priceFrom}>{g.from} </Txt>
              {formatNumber(locale, guide.price_from_azn)} ₼
            </Txt>
          ) : (
            <MoveUpRight size={18} color={colors.forest700} />
          )}
        </View>
      </View>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.card, overflow: "hidden", ...shadow.card },
  cardPhoto: { height: 190 },
  photoBadges: { position: "absolute", top: 12, left: 12, flexDirection: "row", gap: 6 },
  cardBody: { padding: 16, gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 14, rowGap: 6 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
  metaText: { fontFamily: font.bold, fontSize: 13, color: colors.ink700, flexShrink: 1 },
  tile: { height: 300, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.forest800, ...shadow.card },
  tileTop: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row" },
  tileBottom: { position: "absolute", left: 16, right: 16, bottom: 16, gap: 6 },
  place: { height: 210, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.forest800 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 10, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  rowThumb: { width: 84, height: 84, borderRadius: 14 },
  guide: { backgroundColor: colors.white, borderRadius: radius.card, padding: 18, gap: 16, borderWidth: 1, borderColor: colors.sand200 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  guideFooter: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.sand200 },
  price: { fontFamily: font.display, fontSize: 18, color: colors.forest800 },
  priceFrom: { fontFamily: font.bold, fontSize: 12, color: colors.ink500 },
});
