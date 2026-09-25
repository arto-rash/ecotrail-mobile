import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

const RING = "M300 95c62 4 118 30 150 78s44 92 30 150-54 104-112 124-121 16-170-14-84-78-92-136 12-112 52-151 80-55 142-51Z";

/** Decorative contour lines — EcoTrail's signature motif, same geometry as the website. */
export function Topo({ color, size = 600, style, opacity = 1 }: { color: string; size?: number; style?: StyleProp<ViewStyle>; opacity?: number }) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size, opacity }, style]}>
      <Svg viewBox="0 0 600 600" width="100%" height="100%" fill="none">
        {Array.from({ length: 11 }, (_, i) => {
          const s = 1 + i * 0.16;
          return (
            <Path
              key={i}
              d={RING}
              transform={`translate(${300 - 300 * s} ${300 - 300 * s}) scale(${s}) rotate(${i * 7} 300 300)`}
              stroke={color}
              strokeWidth={1.4 / s}
            />
          );
        })}
      </Svg>
    </View>
  );
}

/** Topo lines cropped into the corner of a container. */
export function TopoCorner({ color, size = 520, top = -180, right = -200 }: { color: string; size?: number; top?: number; right?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Topo color={color} size={size} style={{ position: "absolute", top, right }} />
    </View>
  );
}
