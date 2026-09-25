import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExternalLink } from "lucide-react-native";
import { colors, GUTTER, radius } from "@/theme";
import { useI18n } from "@/i18n";
import { Bouncy } from "@/components/ui/bouncy";
import { Txt } from "@/components/ui/text";

export default function Sources() {
  const { dict } = useI18n();
  const s = dict.sources;
  const insets = useSafeAreaInsets();

  return (
    <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: insets.bottom + 40, gap: 26 }} showsVerticalScrollIndicator={false}>
      <Txt variant="body" color={colors.ink700}>
        {s.intro}
      </Txt>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{s.dataTitle}</Txt>
        {s.data.map((d) => (
          <Bouncy key={d.name} scaleTo={0.98} onPress={() => Linking.openURL(d.url)} style={styles.card} accessibilityRole="link">
            <View style={{ flex: 1, gap: 3 }}>
              <Txt variant="bodyStrong">{d.name}</Txt>
              <Txt variant="small" color={colors.ink700}>
                {d.what}
              </Txt>
              <Txt variant="micro" color={colors.forest600}>
                {d.license}
              </Txt>
            </View>
            <ExternalLink size={16} color={colors.ink400} />
          </Bouncy>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{s.methodTitle}</Txt>
        {s.method.map((line, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 10 }}>
            <View style={styles.dot} />
            <Txt variant="body" color={colors.ink700} style={{ flex: 1 }}>
              {line}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{s.photosTitle}</Txt>
        <Txt variant="body" color={colors.ink700}>
          {s.photosIntro}
        </Txt>
      </View>

      <Txt variant="small" color={colors.ink500}>
        {dict.footer.disclaimer}
      </Txt>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest600, marginTop: 9 },
});
