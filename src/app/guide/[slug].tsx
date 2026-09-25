import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Award, Info, Languages, MapPin, Mountain } from "lucide-react-native";
import { colors, font, GUTTER, radius } from "@/theme";
import { plural, useI18n } from "@/i18n";
import { WEB_URL } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useGuide } from "@/lib/queries";
import { DetailError, DetailScreen, LoadingDetail } from "@/components/detail-screen";
import { Paragraphs, Reviews } from "@/components/detail-parts";
import { ContactReveal, TourCard } from "@/components/guide-parts";
import { Pill, VerifiedBadge } from "@/components/ui/badges";
import { Avatar } from "@/components/ui/monogram";
import { Block } from "@/components/ui/section";
import { RatingInline } from "@/components/ui/stars";
import { Txt } from "@/components/ui/text";
import { Topo } from "@/components/ui/topo";

export default function GuideScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { dict, locale } = useI18n();
  const g = dict.guides;
  const { data: guide, isPending, isError, refetch } = useGuide(slug);

  if (isPending) return <LoadingDetail />;
  if (isError || !guide) return <DetailError onRetry={refetch} />;

  const specialties = guide.specialties ?? [];
  const languages = guide.languages ?? [];
  const regions = guide.regions ?? [];
  const certifications = guide.certifications ?? [];
  const tours = guide.tours ?? [];

  return (
    <DetailScreen
      title={guide.name}
      heroHeight={360}
      shareUrl={`${WEB_URL}/${locale}/guides/${guide.slug}`}
      heroBackground={
        <LinearGradient colors={[colors.forest700, colors.forest950]} style={StyleSheet.absoluteFill}>
          <Topo color={colors.forest600} size={600} style={{ position: "absolute", top: -160, right: -240 }} />
        </LinearGradient>
      }
      hero={
        <View style={{ gap: 12 }}>
          <Avatar name={guide.name} photo={guide.photo} size={88} rounded={26} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {guide.is_verified && <VerifiedBadge />}
            {guide.is_sample && <Pill label={g.sample} tone="ochre" />}
            <Pill label={guide.kind === "agency" ? g.agency : g.guide} tone="glass" />
          </View>
          <Txt variant="display" color={colors.sand50}>
            {guide.name}
          </Txt>
          {guide.headline && (
            <Txt variant="bodyStrong" color="rgba(251,248,242,0.85)">
              {guide.headline}
            </Txt>
          )}
          <RatingInline rating={guide.rating} count={guide.reviews_count} color={colors.sand50} />
        </View>
      }
    >
      {guide.is_sample && (
        <View style={styles.note}>
          <Info size={16} color="#7a5410" style={{ marginTop: 2 }} />
          <Txt variant="small" color="#7a5410" style={{ flex: 1 }}>
            {g.sampleNote}
          </Txt>
        </View>
      )}

      {/* Contact card */}
      <View style={styles.contact}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <Txt variant="heading">{g.contactTitle}</Txt>
          {guide.price_from_azn != null ? (
            <Txt style={styles.price}>
              <Txt style={styles.from}>{g.from} </Txt>
              {formatNumber(locale, guide.price_from_azn)} ₼<Txt style={styles.from}> {guide.price_unit?.label}</Txt>
            </Txt>
          ) : (
            <Txt variant="small" color={colors.ink500}>
              {g.priceOnRequest}
            </Txt>
          )}
        </View>
        <ContactReveal slug={guide.slug} channels={guide.contact_channels ?? []} />
      </View>

      {/* Quick facts */}
      <View style={styles.facts}>
        {guide.experience_years != null && <Fact icon={Mountain} label={g.experience} value={plural(guide.experience_years, g.years, g.yearsOne)} />}
        {languages.length > 0 && <Fact icon={Languages} label={g.languagesLabel} value={languages.map((l) => l.label).join(", ")} />}
        {regions.length > 0 && <Fact icon={MapPin} label={g.worksIn} value={regions.map((r) => r.name).join(", ")} />}
      </View>

      {guide.bio && (
        <Block title={g.about}>
          <Paragraphs text={guide.bio} />
        </Block>
      )}

      {specialties.length > 0 && (
        <Block title={g.specialties}>
          <View style={styles.wrap}>
            {specialties.map((s) => (
              <Pill key={s.value} label={s.label} tone="moss" />
            ))}
          </View>
        </Block>
      )}

      {certifications.length > 0 && (
        <Block title={g.certifications}>
          <View style={{ gap: 8 }}>
            {certifications.map((c, i) => (
              <View key={`${c.name}-${i}`} style={styles.cert}>
                <Award size={18} color={colors.ochre500} />
                <View style={{ flex: 1 }}>
                  <Txt variant="label">{c.name}</Txt>
                  {(c.issuer || c.year) && (
                    <Txt variant="small" color={colors.ink500}>
                      {[c.issuer, c.year].filter(Boolean).join(" · ")}
                    </Txt>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Block>
      )}

      <Block title={g.tours}>
        {tours.length ? (
          <View style={{ gap: 12 }}>
            {tours.map((t) => (
              <TourCard key={t.slug} tour={t} />
            ))}
          </View>
        ) : (
          <Txt variant="body" color={colors.ink500}>
            {g.noTours}
          </Txt>
        )}
      </Block>

      <Reviews kind="guides" slug={guide.slug} reviews={guide.reviews ?? []} rating={guide.rating} count={guide.reviews_count} />
    </DetailScreen>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Mountain; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <Icon size={17} color={colors.forest700} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="micro" color={colors.ink500}>
          {label}
        </Txt>
        <Txt variant="bodyStrong">{value}</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: "row", gap: 10, marginHorizontal: GUTTER, padding: 14, borderRadius: radius.lg, backgroundColor: colors.ochre100 },
  contact: { marginHorizontal: GUTTER, padding: 18, gap: 16, borderRadius: radius.card, backgroundColor: colors.sand100 },
  price: { fontFamily: font.display, fontSize: 20, color: colors.forest800 },
  from: { fontFamily: font.bold, fontSize: 12, color: colors.ink500 },
  facts: { marginHorizontal: GUTTER, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  fact: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.sand200 },
  factIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.moss100, alignItems: "center", justifyContent: "center" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cert: { flexDirection: "row", gap: 12, alignItems: "center", padding: 14, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
});
