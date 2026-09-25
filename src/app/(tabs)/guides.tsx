import { useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Handshake, Info } from "lucide-react-native";
import { colors, GUTTER, radius } from "@/theme";
import { useI18n } from "@/i18n";
import { useGuides, useOptions, useRegions } from "@/lib/queries";
import { GuideCard } from "@/components/cards";
import { useTabBarSpace } from "@/components/tab-bar";
import { Button } from "@/components/ui/button";
import { SelectChip } from "@/components/ui/select";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { Txt } from "@/components/ui/text";
import { Topo } from "@/components/ui/topo";

export default function Guides() {
  const { dict, m } = useI18n();
  const g = dict.guides;
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [kind, setKind] = useState("");
  const guides = useGuides({ region, language, kind });
  const regions = useRegions();
  const options = useOptions();
  const list = guides.data ?? [];
  const hasSamples = list.some((x) => x.is_sample);

  const header = (
    <View style={{ gap: 18, paddingBottom: 8 }}>
      <View style={styles.hero}>
        <Topo color={colors.forest700} size={480} style={{ position: "absolute", top: -200, right: -210 }} />
        <Txt variant="eyebrow" color={colors.moss200}>
          {g.eyebrow}
        </Txt>
        <Txt variant="display" color={colors.sand50}>
          {g.title}
        </Txt>
        <Txt variant="body" color="rgba(251,248,242,0.8)">
          {g.intro}
        </Txt>
        <Button variant="light" size="sm" icon={Handshake} onPress={() => router.push("/apply")} style={{ alignSelf: "flex-start", marginTop: 4 }}>
          {g.applyTitle}
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }} style={{ marginHorizontal: -GUTTER }}>
        <SelectChip
          label={m.filters.region}
          title={m.filters.region}
          value={region}
          onChange={setRegion}
          options={[{ value: "", label: dict.explore.allRegions }, ...(regions.data ?? []).filter((r) => r.hiking_advised).map((r) => ({ value: r.slug, label: r.name }))]}
        />
        <SelectChip
          label={m.filters.language}
          title={m.filters.language}
          value={language}
          onChange={setLanguage}
          options={[{ value: "", label: g.anyLanguage }, ...(options.data?.guide_languages ?? [])]}
        />
        <SelectChip
          label={g.allKinds}
          title={m.filters.kind}
          value={kind}
          onChange={setKind}
          options={[
            { value: "", label: g.allKinds },
            { value: "guide", label: g.guide },
            { value: "agency", label: g.agency },
          ]}
        />
      </ScrollView>

      {hasSamples && (
        <View style={styles.note}>
          <Info size={16} color="#7a5410" strokeWidth={2.4} style={{ marginTop: 2 }} />
          <Txt variant="small" color="#7a5410" style={{ flex: 1 }}>
            {g.sampleNote}
          </Txt>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1 }}
      data={list}
      keyExtractor={(x) => x.slug}
      renderItem={({ item }) => <GuideCard guide={item} />}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: GUTTER, paddingBottom: bottom, gap: 14 }}
      refreshControl={<RefreshControl refreshing={guides.isRefetching} onRefresh={() => guides.refetch()} tintColor={colors.forest700} />}
      ListEmptyComponent={
        guides.isPending ? (
          <View style={{ gap: 16 }}>
            <CardSkeleton height={200} />
            <CardSkeleton height={200} />
          </View>
        ) : guides.isError ? (
          <ErrorState onRetry={() => guides.refetch()} />
        ) : (
          <EmptyState title={region || language || kind ? g.noMatch : g.none} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  hero: { padding: 22, gap: 10, borderRadius: radius.xl, backgroundColor: colors.forest900, overflow: "hidden" },
  note: { flexDirection: "row", gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.ochre100 },
});
