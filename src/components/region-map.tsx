import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Defs, G, Line, Path, Pattern, Rect } from "react-native-svg";
import { ArrowRight, TriangleAlert } from "lucide-react-native";
import shapes from "@/data/az-regions.json";
import { colors, font, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { haptic } from "@/lib/haptics";
import type { Region } from "@/lib/types";
import { Bouncy } from "./ui/bouncy";
import { Txt } from "./ui/text";

type Shape = { name: { az: string; en: string }; path: string; label: [number, number]; bounds: [number, number, number, number] };
export const REGION_SHAPES = shapes.regions as unknown as Record<string, Shape>;

// Same soft fills as the website, neighbours differ.
const FILLS: Record<string, string> = {
  nakhchivan: "#e5eddc",
  "gazakh-tovuz": "#f6ead0",
  "ganja-dashkasan": "#f7e1d8",
  "shaki-zagatala": "#e7e1ec",
  "guba-khachmaz": "#f6ead0",
  "central-aran": "#e5eddc",
  "mountainous-shirvan": "#f0e9da",
  "absheron-khizi": "#f7e1d8",
  baku: "#e5eddc",
  karabakh: "#e7e1ec",
  "east-zangezur": "#e5eddc",
  "mil-mughan": "#f6ead0",
  "shirvan-salyan": "#e7e1ec",
  "lankaran-astara": "#f0e9da",
};

/**
 * Azerbaijan's 14 economic regions. Tap one to select it; the card below shows its counts and
 * opens the region. Regions with landmine risk are hatched.
 */
export function RegionMap({ regions, onOpen, width: fixedWidth }: { regions: Region[]; onOpen: (slug: string) => void; width?: number }) {
  const { locale, dict, m } = useI18n();
  const window = useWindowDimensions();
  const width = fixedWidth ?? window.width - 40;
  const height = (width * shapes.height) / shapes.width;
  const [active, setActive] = useState<string | null>(null);
  const bySlug = Object.fromEntries(regions.map((r) => [r.slug, r]));
  const info = active ? bySlug[active] : null;
  const advised = info?.hiking_advised ?? true;

  return (
    <View style={{ gap: 14 }}>
      <Svg width={width} height={height} viewBox={`0 0 ${shapes.width} ${shapes.height}`}>
        <Defs>
          <Pattern id="no-hiking" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width="8" height="8" fill={colors.sand200} />
            <Line x1="0" y1="0" x2="0" y2="8" stroke={colors.sand400} strokeWidth="3" />
          </Pattern>
        </Defs>
        <G>
          {Object.entries(REGION_SHAPES).map(([slug, shape]) => {
            const ok = bySlug[slug]?.hiking_advised ?? true;
            const isActive = active === slug;
            return (
              <Path
                key={slug}
                d={shape.path}
                fill={isActive ? colors.forest700 : ok ? FILLS[slug] : "url(#no-hiking)"}
                stroke={colors.sand50}
                strokeWidth={isActive ? 3 : 1.6}
                onPress={() => {
                  haptic.select();
                  setActive(isActive ? null : slug);
                }}
              />
            );
          })}
        </G>
      </Svg>

      <Bouncy
        disabled={!active || !advised}
        onPress={() => active && onOpen(active)}
        scaleTo={0.98}
        style={[styles.card, active && advised && styles.cardActive]}
      >
        {active ? (
          <>
            <View style={{ flex: 1, gap: 3 }}>
              <Txt variant="cardTitle" color={advised ? colors.sand50 : colors.ink900}>
                {REGION_SHAPES[active]?.name[locale] ?? info?.name}
              </Txt>
              {advised ? (
                <Txt variant="small" color={colors.moss200}>
                  {fill(dict.regionMap.trails, { count: info?.trails_count ?? 0 })} · {fill(dict.regionMap.places, { count: info?.places_count ?? 0 })}
                </Txt>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <TriangleAlert size={14} color={colors.pomegranate600} />
                  <Txt variant="small" color={colors.pomegranate700}>
                    {dict.regionMap.noHiking}
                  </Txt>
                </View>
              )}
            </View>
            {advised && (
              <View style={styles.go}>
                <ArrowRight size={18} color={colors.forest900} strokeWidth={2.5} />
              </View>
            )}
          </>
        ) : (
          <Txt style={styles.hint}>{m.region.tapHint}</Txt>
        )}
      </Bouncy>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  cardActive: { backgroundColor: colors.forest800, borderColor: colors.forest800 },
  go: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.moss200, alignItems: "center", justifyContent: "center" },
  hint: { fontFamily: font.semibold, fontSize: 13, color: colors.ink500, lineHeight: 19 },
});
