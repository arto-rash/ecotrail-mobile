import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { colors, font, radius } from "@/theme";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { Txt } from "./ui/text";

const HEIGHT = 170;
const PAD = { top: 14, right: 8, bottom: 24, left: 40 };

/** SRTM elevation along the route. Drag a finger across it to read km and metres. */
export function ElevationProfile({ points }: { points: [number, number][] }) {
  const { locale, dict, m } = useI18n();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (points.length < 2 || !width) return null;
    const kms = points.map((p) => p[0]);
    const eles = points.map((p) => p[1]);
    const maxKm = Math.max(...kms) || 1;
    let lo = Math.floor(Math.min(...eles) / 50) * 50;
    let hi = Math.ceil(Math.max(...eles) / 50) * 50;
    if (hi - lo < 50) hi = lo + 50;
    lo = Math.max(0, lo);
    const w = width - PAD.left - PAD.right;
    const h = HEIGHT - PAD.top - PAD.bottom;
    const x = (km: number) => PAD.left + (km / maxKm) * w;
    const y = (e: number) => PAD.top + h - ((e - lo) / (hi - lo)) * h;
    const line = points.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const area = `${line} L${x(kms[kms.length - 1]).toFixed(1)},${PAD.top + h} L${x(0).toFixed(1)},${PAD.top + h} Z`;
    const ticks = [lo, (lo + hi) / 2, hi];
    return { x, y, line, area, ticks, maxKm, w };
  }, [points, width]);

  if (points.length < 2) return null;

  const scrub = (px: number) => {
    if (!chart) return;
    const km = ((px - PAD.left) / chart.w) * chart.maxKm;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i][0] - km) < Math.abs(points[best][0] - km)) best = i;
    if (best === index) return;
    haptic.select();
    setIndex(best);
  };
  const end = () => setIndex(null);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onBegin((e) => scrub(e.x))
    .onUpdate((e) => scrub(e.x))
    .onFinalize(end);

  const point = index != null ? points[index] : null;

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.readout}>
        {point ? (
          <>
            <Txt style={styles.readValue}>{formatNumber(locale, point[1])} {dict.common.m}</Txt>
            <Txt style={styles.readKm}>{formatNumber(locale, point[0], 1)} {dict.common.km}</Txt>
          </>
        ) : (
          <Txt variant="small" color={colors.ink500}>
            {m.trail.scrubHint}
          </Txt>
        )}
      </View>
      <GestureDetector gesture={pan}>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
          {chart && (
            <Svg width={width} height={HEIGHT}>
              <Defs>
                <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#4a855c" stopOpacity={0.45} />
                  <Stop offset="1" stopColor="#4a855c" stopOpacity={0.05} />
                </LinearGradient>
              </Defs>
              {chart.ticks.map((t) => (
                <Line key={t} x1={PAD.left} x2={width - PAD.right} y1={chart.y(t)} y2={chart.y(t)} stroke={colors.sand200} strokeWidth={1} />
              ))}
              {chart.ticks.map((t) => (
                <SvgText key={`l${t}`} x={PAD.left - 6} y={chart.y(t) + 4} fontSize={10} fill={colors.ink400} textAnchor="end" fontFamily={font.bold}>
                  {formatNumber(locale, t)}
                </SvgText>
              ))}
              <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={10} fill={colors.ink400} fontFamily={font.bold}>
                0
              </SvgText>
              <SvgText x={width - PAD.right} y={HEIGHT - 6} fontSize={10} fill={colors.ink400} textAnchor="end" fontFamily={font.bold}>
                {`${formatNumber(locale, chart.maxKm, 1)} ${dict.common.km}`}
              </SvgText>
              <Path d={chart.area} fill="url(#fill)" />
              <Path d={chart.line} stroke={colors.forest700} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
              {point && (
                <>
                  <Line x1={chart.x(point[0])} x2={chart.x(point[0])} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke={colors.ink700} strokeWidth={1} strokeDasharray="3 3" />
                  <Circle cx={chart.x(point[0])} cy={chart.y(point[1])} r={6} fill={colors.pomegranate600} stroke={colors.white} strokeWidth={2.5} />
                </>
              )}
            </Svg>
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: "row", alignItems: "baseline", gap: 10, minHeight: 26, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start", borderRadius: radius.pill, backgroundColor: colors.sand100 },
  readValue: { fontFamily: font.display, fontSize: 17, color: colors.forest800 },
  readKm: { fontFamily: font.bold, fontSize: 13, color: colors.ink500 },
});
