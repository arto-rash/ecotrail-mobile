import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, ChevronRight, Globe, Handshake, Plus, Sprout, type LucideIcon } from "lucide-react-native";
import { colors, GUTTER, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { WEB_URL } from "@/lib/api";
import { LocaleToggle } from "@/components/locale-toggle";
import { Logo } from "@/components/logo";
import { useTabBarSpace } from "@/components/tab-bar";
import { Bouncy } from "@/components/ui/bouncy";
import { Txt } from "@/components/ui/text";
import { Topo } from "@/components/ui/topo";

function Row({ icon: Icon, title, text, onPress, tint = colors.moss100, fg = colors.forest700 }: { icon: LucideIcon; title: string; text?: string; onPress: () => void; tint?: string; fg?: string }) {
  return (
    <Bouncy onPress={onPress} scaleTo={0.98} style={styles.row} accessibilityRole="button">
      <View style={[styles.rowIcon, { backgroundColor: tint }]}>
        <Icon size={20} color={fg} strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {text && (
          <Txt variant="small" color={colors.ink500} numberOfLines={2}>
            {text}
          </Txt>
        )}
      </View>
      <ChevronRight size={18} color={colors.ink400} />
    </Bouncy>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="eyebrow" color={colors.ink500} style={{ paddingHorizontal: 4 }}>
        {title}
      </Txt>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export default function More() {
  const { dict, m, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: GUTTER, paddingBottom: bottom, gap: 26 }} showsVerticalScrollIndicator={false}>
      <Txt variant="display">{m.more.title}</Txt>

      <View style={styles.lang}>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="bodyStrong">{m.more.language}</Txt>
          <Txt variant="small" color={colors.ink500}>
            {m.more.languageHint}
          </Txt>
        </View>
        <LocaleToggle />
      </View>

      <Group title={m.more.contribute}>
        <Row icon={Plus} title={dict.nav.share} text={dict.home.ctaText} onPress={() => router.push("/submit")} />
        <Row icon={Handshake} title={dict.guides.applyTitle} text={dict.home.guidesDescription} onPress={() => router.push("/apply")} tint={colors.ochre100} fg="#7a5410" />
      </Group>

      <Group title={m.more.learn}>
        <Row icon={Sprout} title={dict.nav.challenges} text={dict.home.ecoTitle} onPress={() => router.push("/challenges")} />
        <Row icon={BookOpen} title={dict.sources.title} text={dict.sources.intro} onPress={() => router.push("/sources")} tint={colors.plum100} fg={colors.plum700} />
        <Row icon={Globe} title={m.more.website} text={WEB_URL.replace(/^https?:\/\//, "")} onPress={() => Linking.openURL(`${WEB_URL}/${locale}`)} tint={colors.sand100} fg={colors.ink700} />
      </Group>

      <View style={styles.about}>
        <Topo color={colors.forest700} size={440} style={{ position: "absolute", bottom: -220, right: -180 }} />
        <Logo light tagline={locale === "az" ? "Azərbaycan" : "Azerbaijan"} />
        <Txt variant="body" color="rgba(251,248,242,0.8)">
          {dict.footer.about}
        </Txt>
        <Txt variant="small" color={colors.moss200}>
          {m.more.madeWith}
        </Txt>
        <Txt variant="micro" color="rgba(251,248,242,0.5)">
          {fill(m.more.version, { version })}
        </Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lang: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  group: { borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.sand200 },
  rowIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  about: { padding: 22, gap: 10, borderRadius: radius.xl, backgroundColor: colors.forest900, overflow: "hidden" },
});
