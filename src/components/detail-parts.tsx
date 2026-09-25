import { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Camera, ExternalLink, MapPin, Navigation, PenLine, type LucideIcon } from "lucide-react-native";
import { colors, font, GUTTER, radius } from "@/theme";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import { appleMapsUrl, googleDirectionsUrl, googleMapsUrl } from "@/lib/maps";
import type { Photo, Review, Source } from "@/lib/types";
import { Bouncy } from "./ui/bouncy";
import { Button } from "./ui/button";
import { Block } from "./ui/section";
import { Sheet } from "./ui/sheet";
import { RatingSummary, Stars } from "./ui/stars";
import { Txt } from "./ui/text";

export type Stat = { icon: LucideIcon; label: string; value: string; note?: string };

/** 2-column grid of big numbers. */
export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <View style={styles.grid}>
      {stats.map((s) => (
        <View key={s.label} style={styles.stat}>
          <View style={styles.statIcon}>
            <s.icon size={16} color={colors.forest700} strokeWidth={2.3} />
          </View>
          <Txt style={styles.statValue}>
            {s.value}
            {s.note && <Txt style={styles.statNote}> {s.note}</Txt>}
          </Txt>
          <Txt style={styles.statLabel}>{s.label}</Txt>
        </View>
      ))}
    </View>
  );
}

export function PhotoCredit({ photo }: { photo: Photo | null }) {
  const { dict } = useI18n();
  if (!photo?.author) return null;
  return (
    <Pressable disabled={!photo.source} onPress={() => photo.source && Linking.openURL(photo.source)} style={styles.credit}>
      <Camera size={12} color={colors.ink400} />
      <Txt variant="micro" color={colors.ink400} numberOfLines={1} style={{ flexShrink: 1 }}>
        {dict.common.photo}: {photo.author}
        {photo.license ? ` · ${photo.license}` : ""}
      </Txt>
    </Pressable>
  );
}

/** Opens a point in Google Maps or Apple Maps. On Android it goes straight to Google Maps. */
export function useOpenInMaps() {
  const [target, setTarget] = useState<{ lat: number; lng: number; label?: string; directions?: boolean } | null>(null);
  const { m } = useI18n();

  const open = (lat: number, lng: number, label?: string, directions = false) => {
    if (Platform.OS !== "ios") {
      Linking.openURL(directions ? googleDirectionsUrl(lat, lng) : googleMapsUrl(lat, lng));
      return;
    }
    setTarget({ lat, lng, label, directions });
  };

  const sheet = (
    <Sheet open={!!target} onClose={() => setTarget(null)} title={m.maps.choose}>
      <View style={{ gap: 10, paddingBottom: 8 }}>
        <Button
          variant="outline"
          full
          onPress={() => {
            if (target) Linking.openURL(target.directions ? googleDirectionsUrl(target.lat, target.lng) : googleMapsUrl(target.lat, target.lng));
            setTarget(null);
          }}
        >
          {m.maps.google}
        </Button>
        <Button
          variant="outline"
          full
          onPress={() => {
            if (target) Linking.openURL(appleMapsUrl(target.lat, target.lng, target.label, target.directions));
            setTarget(null);
          }}
        >
          {m.maps.apple}
        </Button>
      </View>
    </Sheet>
  );

  return { open, sheet };
}

/** A tappable location line that opens the maps chooser. */
export function LocationLine({ text, lat, lng, label }: { text: string; lat: number; lng: number; label?: string }) {
  const { open, sheet } = useOpenInMaps();
  const { dict } = useI18n();
  return (
    <>
      <Bouncy onPress={() => open(lat, lng, label)} scaleTo={0.98} style={styles.location} accessibilityRole="link" accessibilityHint={dict.common.openInGoogleMaps}>
        <View style={styles.locIcon}>
          <MapPin size={18} color={colors.forest700} strokeWidth={2.3} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong" numberOfLines={2}>
            {text}
          </Txt>
          <Txt variant="small" color={colors.forest600}>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </Txt>
        </View>
        <Navigation size={18} color={colors.forest700} />
      </Bouncy>
      {sheet}
    </>
  );
}

export function Sources({ sources }: { sources: Source[] }) {
  const { dict } = useI18n();
  if (!sources.length) return null;
  return (
    <Block title={dict.common.sources}>
      <View style={{ gap: 8 }}>
        {sources.map((s) => (
          <Pressable key={s.url} onPress={() => Linking.openURL(s.url)} style={styles.source}>
            <View style={{ flex: 1 }}>
              <Txt variant="label">{s.label}</Txt>
              <Txt variant="micro" color={colors.ink500}>
                {s.license}
              </Txt>
            </View>
            <ExternalLink size={16} color={colors.ink400} />
          </Pressable>
        ))}
      </View>
    </Block>
  );
}

export function Reviews({ reviews, rating, count, kind, slug }: { reviews: Review[]; rating?: number | null; count?: number; kind: "trails" | "places" | "guides"; slug: string }) {
  const { dict, locale } = useI18n();
  const r = dict.reviews;
  const [all, setAll] = useState(false);
  const shown = all ? reviews : reviews.slice(0, 3);
  return (
    <Block title={r.title}>
      <View style={styles.reviewHead}>
        <RatingSummary rating={rating} count={count ?? reviews.length} />
        <Button size="sm" variant="secondary" icon={PenLine} onPress={() => router.push({ pathname: "/review/[kind]/[slug]", params: { kind, slug } })}>
          {r.write}
        </Button>
      </View>
      {reviews.length === 0 ? (
        <Txt variant="body" color={colors.ink500}>
          {r.empty}
        </Txt>
      ) : (
        <View style={{ gap: 10 }}>
          {shown.map((rev) => (
            <View key={rev.id} style={styles.review}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Txt variant="label" style={{ flex: 1 }} numberOfLines={1}>
                  {rev.author_name}
                </Txt>
                <Stars value={rev.rating} size={14} />
              </View>
              <Txt variant="body">{rev.body}</Txt>
              <Txt variant="micro" color={colors.ink400}>
                {formatDate(rev.created_at, dict, locale)}
              </Txt>
            </View>
          ))}
          {reviews.length > 3 && !all && (
            <Button variant="ghost" size="sm" onPress={() => setAll(true)}>
              {dict.common.viewAll}
            </Button>
          )}
        </View>
      )}
    </Block>
  );
}

export function Paragraphs({ text }: { text: string }) {
  return (
    <View style={{ gap: 12 }}>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <Txt key={i} variant="body" color={colors.ink700}>
            {p}
          </Txt>
        ))}
    </View>
  );
}

export const detailStyles = StyleSheet.create({
  pad: { paddingHorizontal: GUTTER },
});

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: GUTTER },
  stat: { width: "48%", flexGrow: 1, padding: 14, gap: 6, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  statIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.moss100, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: font.display, fontSize: 22, color: colors.ink900, letterSpacing: -0.4 },
  statNote: { fontFamily: font.bold, fontSize: 11, color: colors.ochre500 },
  statLabel: { fontFamily: font.bold, fontSize: 12, color: colors.ink500 },
  credit: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: GUTTER },
  location: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  locIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.moss100, alignItems: "center", justifyContent: "center" },
  source: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.sand100 },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  review: { padding: 16, gap: 8, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
});
