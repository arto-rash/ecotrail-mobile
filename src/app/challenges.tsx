import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bus, Camera, Droplets, Flame, Footprints, MapPin, Recycle, ShoppingBasket, Sprout, type LucideIcon } from "lucide-react-native";
import { colors, font, GUTTER, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Span, Txt } from "@/components/ui/text";
import { Topo } from "@/components/ui/topo";

const ICONS: Record<string, LucideIcon> = { recycle: Recycle, droplets: Droplets, footprints: Footprints, basket: ShoppingBasket, bus: Bus, flame: Flame, camera: Camera, mapPin: MapPin, sprout: Sprout };
const LEVEL_TONE: Record<string, { bg: string; fg: string }> = {
  everyday: { bg: colors.moss100, fg: colors.forest700 },
  weekend: { bg: colors.ochre100, fg: "#7a5410" },
  adventure: { bg: colors.pomegranate100, fg: colors.pomegranate700 },
  community: { bg: colors.plum100, fg: colors.plum700 },
};

export default function Challenges() {
  const { dict } = useI18n();
  const c = dict.challenges;
  const insets = useSafeAreaInsets();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, gap: 24 }} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Topo color={colors.moss200} size={520} style={{ position: "absolute", top: -220, right: -240 }} />
        <Txt variant="eyebrow" color={colors.forest600}>
          {c.eyebrow}
        </Txt>
        <Txt variant="display">
          {c.titleA}
          {"\n"}
          <Span style={{ fontFamily: font.displayItalic, color: colors.forest600 }}>{c.titleEm}</Span>
        </Txt>
        <Txt variant="body" color={colors.ink700}>
          {c.intro}
        </Txt>
      </View>

      <View style={{ paddingHorizontal: GUTTER, gap: 12 }}>
        {c.items.map((item) => {
          const Icon = ICONS[item.icon] ?? Sprout;
          const tone = LEVEL_TONE[item.level] ?? LEVEL_TONE.everyday;
          return (
            <View key={item.title} style={styles.card}>
              <View style={[styles.icon, { backgroundColor: tone.bg }]}>
                <Icon size={22} color={tone.fg} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <Txt variant="eyebrow" color={tone.fg} style={{ fontSize: 10 }}>
                    {c.levels[item.level as keyof typeof c.levels]}
                  </Txt>
                  <Txt style={styles.points}>{fill(c.points, { points: item.points })}</Txt>
                </View>
                <Txt variant="cardTitle">{item.title}</Txt>
                <Txt variant="small" color={colors.ink500}>
                  {item.text}
                </Txt>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.lnt}>
        <Txt variant="heading" color={colors.sand50}>
          {c.lntTitle}
        </Txt>
        <Txt variant="small" color="rgba(251,248,242,0.75)">
          {c.lntIntro}
        </Txt>
        <View style={{ gap: 10, marginTop: 6 }}>
          {c.lnt.map((p, i) => (
            <View key={p} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={styles.num}>
                <Txt style={{ fontFamily: font.heavy, fontSize: 12, color: colors.forest900 }}>{i + 1}</Txt>
              </View>
              <Txt variant="bodyStrong" color={colors.sand50} style={{ flex: 1 }}>
                {p}
              </Txt>
            </View>
          ))}
        </View>
      </View>

      <Button onPress={() => router.navigate("/explore")} style={{ marginHorizontal: GUTTER }}>
        {c.findTrail}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: GUTTER, paddingTop: 12, paddingBottom: 28, gap: 10, backgroundColor: colors.moss100, overflow: "hidden" },
  card: { flexDirection: "row", gap: 14, padding: 16, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  points: { fontFamily: font.heavy, fontSize: 12, color: colors.ochre500 },
  lnt: { marginHorizontal: GUTTER, padding: 20, gap: 8, borderRadius: radius.xl, backgroundColor: colors.forest900 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.moss200, alignItems: "center", justifyContent: "center" },
});
