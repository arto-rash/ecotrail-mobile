import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Search, X } from "lucide-react-native";
import { colors, DIFFICULTY_STYLE, font, GUTTER, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { DIFFICULTIES, DURATIONS, FEATURES, PLACE_TYPES } from "@/lib/format";
import { usePlaces, useRegions, useTrails } from "@/lib/queries";
import type { Place, Trail } from "@/lib/types";
import { PlaceRow, TrailCard } from "@/components/cards";
import { useTabBarSpace } from "@/components/tab-bar";
import { Bouncy } from "@/components/ui/bouncy";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SelectChip } from "@/components/ui/select";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { Txt } from "@/components/ui/text";

type Tab = "trails" | "places";

function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function Explore() {
  const { dict, m } = useI18n();
  const e = dict.explore;
  const params = useLocalSearchParams<{ tab?: string; region?: string; q?: string; focus?: string; difficulty?: string }>();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const input = useRef<TextInput>(null);

  const [tab, setTab] = useState<Tab>(params.tab === "places" ? "places" : "trails");
  const [q, setQ] = useState(params.q ?? "");
  const [region, setRegion] = useState(params.region ?? "");
  const [difficulty, setDifficulty] = useState<string[]>(params.difficulty ? [params.difficulty] : []);
  const [features, setFeatures] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [trailSort, setTrailSort] = useState("popular");
  const [placeSort, setPlaceSort] = useState("popular");
  const search = useDebounced(q.trim());

  // Links from Home (search, "see all", region) land here with params; apply each new set once.
  const paramKey = `${params.tab}|${params.region}|${params.q}|${params.difficulty}|${params.focus}`;
  const [seenParams, setSeenParams] = useState(paramKey);
  if (seenParams !== paramKey) {
    setSeenParams(paramKey);
    if (params.tab === "places" || params.tab === "trails") setTab(params.tab);
    if (params.region !== undefined) setRegion(params.region);
    if (params.q !== undefined) setQ(params.q);
    if (params.difficulty) setDifficulty([params.difficulty]);
  }
  useEffect(() => {
    if (!params.focus) return;
    const t = setTimeout(() => input.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [params.focus]);

  const regions = useRegions();
  const trails = useTrails({ q: search, region, difficulty, feature: features, max_duration: duration, sort: trailSort });
  const places = usePlaces({ q: search, region, type: types, sort: placeSort });
  const active = tab === "trails" ? trails : places;
  const items = useMemo(() => ((active.data?.pages ?? []) as { data: (Trail | Place)[] }[]).flatMap((p) => p.data), [active.data]);
  const total = active.data?.pages[0]?.meta.total;

  const regionOptions = [{ value: "", label: e.allRegions }, ...(regions.data ?? []).filter((r) => r.hiking_advised).map((r) => ({ value: r.slug, label: r.name }))];
  const durationOptions = [{ value: "", label: e.anyDuration }, ...DURATIONS.map((d) => ({ value: d, label: dict.duration[d] }))];
  const trailSorts = [
    { value: "popular", label: e.sortPopular },
    { value: "rating", label: e.sortRating },
    { value: "distance", label: e.sortDistance },
    { value: "duration", label: e.sortDuration },
    { value: "name", label: e.sortName },
  ];
  const placeSorts = [
    { value: "popular", label: e.sortPopular },
    { value: "elevation", label: e.sortElevation },
    { value: "name", label: e.sortName },
  ];

  const filtered = !!(search || region || (tab === "trails" ? difficulty.length || features.length || duration : types.length));
  const clear = () => {
    setQ("");
    setRegion("");
    setDifficulty([]);
    setFeatures([]);
    setDuration("");
    setTypes([]);
  };

  const countLabel =
    total == null ? " " : tab === "trails" ? (total === 1 ? e.trailsCountOne : fill(e.trailsCount, { count: total })) : total === 1 ? e.placesCountOne : fill(e.placesCount, { count: total });

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Txt variant="display">{e.title}</Txt>
          <View style={styles.segment}>
            {(["trails", "places"] as const).map((t) => (
              <Bouncy key={t} scaleTo={0.95} onPress={() => setTab(t)} style={[styles.segItem, tab === t && styles.segActive]} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
                <Txt style={[styles.segText, tab === t && { color: colors.sand50 }]}>{t === "trails" ? e.trailsTab : e.placesTab}</Txt>
              </Bouncy>
            ))}
          </View>
        </View>
        <View style={styles.search}>
          <Search size={18} color={colors.ink400} strokeWidth={2.4} />
          <TextInput
            ref={input}
            value={q}
            onChangeText={setQ}
            placeholder={tab === "trails" ? e.searchTrails : e.searchPlaces}
            placeholderTextColor={colors.ink400}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={colors.forest600}
          />
          {!!q && (
            <Pressable onPress={() => setQ("")} hitSlop={10} accessibilityLabel={m.search.cancel}>
              <X size={18} color={colors.ink500} />
            </Pressable>
          )}
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
          <SelectChip label={m.filters.region} title={m.filters.region} options={regionOptions} value={region} onChange={setRegion} />
          {tab === "trails" ? (
            <>
              <SelectChip label={m.filters.duration} title={m.filters.duration} options={durationOptions} value={duration} onChange={setDuration} />
              {DIFFICULTIES.map((d) => (
                <Chip key={d} label={dict.difficulty[d]} dot={DIFFICULTY_STYLE[d].dot} selected={difficulty.includes(d)} onPress={() => setDifficulty((l) => toggle(l, d))} />
              ))}
              {FEATURES.map((f) => (
                <Chip key={f} label={dict.feature[f]} selected={features.includes(f)} onPress={() => setFeatures((l) => toggle(l, f))} />
              ))}
            </>
          ) : (
            PLACE_TYPES.map((t) => <Chip key={t} label={dict.placeTypePlural[t]} selected={types.includes(t)} onPress={() => setTypes((l) => toggle(l, t))} />)
          )}
        </ScrollView>
      </View>

      <View style={styles.countRow}>
        <Txt variant="label" color={colors.ink500}>
          {countLabel}
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {filtered && (
            <Pressable onPress={clear} hitSlop={8}>
              <Txt style={styles.clear}>{dict.common.clearFilters}</Txt>
            </Pressable>
          )}
          <SelectChip
            label={e.sort}
            title={m.filters.sort}
            options={tab === "trails" ? trailSorts : placeSorts}
            value={tab === "trails" ? trailSort : placeSort}
            onChange={(v) => (tab === "trails" ? setTrailSort(v || "popular") : setPlaceSort(v || "popular"))}
          />
        </View>
      </View>

      <FlatList
        data={items}
        key={tab}
        keyExtractor={(item) => `${tab}-${item.slug}`}
        renderItem={({ item }) => (tab === "trails" ? <TrailCard trail={item as Trail} /> : <PlaceRow place={item as Place} />)}
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom, gap: tab === "trails" ? 18 : 12 }}
        keyboardDismissMode="on-drag"
        onEndReachedThreshold={0.6}
        onEndReached={() => active.hasNextPage && !active.isFetchingNextPage && active.fetchNextPage()}
        refreshControl={<RefreshControl refreshing={active.isRefetching && !active.isFetchingNextPage} onRefresh={() => active.refetch()} tintColor={colors.forest700} />}
        ListEmptyComponent={
          active.isPending ? (
            <View style={{ gap: 22 }}>
              <CardSkeleton />
              <CardSkeleton />
            </View>
          ) : active.isError ? (
            <ErrorState onRetry={() => active.refetch()} />
          ) : (
            <EmptyState
              title={dict.common.noResults}
              text={dict.common.noResultsHint}
              action={filtered ? <Button variant="outline" size="sm" onPress={clear}>{dict.common.clearFilters}</Button> : undefined}
            />
          )
        }
        ListFooterComponent={
          active.isFetchingNextPage ? (
            <ActivityIndicator color={colors.forest700} style={{ marginVertical: 20 }} />
          ) : items.length > 0 && tab === "trails" && !active.hasNextPage ? (
            <Bouncy onPress={() => router.push("/submit")} style={styles.missing} scaleTo={0.98}>
              <Plus size={18} color={colors.forest700} strokeWidth={2.4} />
              <Txt style={styles.missingText}>{e.shareMissing}</Txt>
            </Bouncy>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: GUTTER, paddingTop: 10, gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  segment: { flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: colors.sand100 },
  segItem: { height: 34, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  segActive: { backgroundColor: colors.forest800 },
  segText: { fontFamily: font.bold, fontSize: 13, color: colors.ink700 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  searchInput: { flex: 1, fontFamily: font.semibold, fontSize: 15, color: colors.ink900, height: "100%" },
  chips: { paddingHorizontal: GUTTER, paddingVertical: 14, gap: 8 },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GUTTER, paddingBottom: 12 },
  clear: { fontFamily: font.bold, fontSize: 13, color: colors.pomegranate600 },
  missing: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, height: 54, borderRadius: radius.card, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.sand400 },
  missingText: { fontFamily: font.bold, fontSize: 14, color: colors.forest700 },
});
