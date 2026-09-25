import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, font } from "@/theme";
import { Txt } from "./ui/text";

/** The website's mark: a forest disc with a pomegranate sun over a mountain line. */
export function LogoMark({ size = 32, color = colors.forest800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={16} fill={color} />
      <Circle cx={21.5} cy={11} r={3} fill={colors.pomegranate500} />
      <Path d="M4.5 23.5 12 13l4.2 5.6L19 15l8.5 8.5" fill="none" stroke={colors.sand50} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Mark + wordmark + tagline, as in the website header. `light` is for dark backgrounds. */
export function Logo({ light = false, tagline }: { light?: boolean; tagline?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityRole="header" accessibilityLabel="EcoTrail">
      <LogoMark size={34} color={light ? colors.forest700 : colors.forest800} />
      <View>
        <Txt style={{ fontFamily: font.display, fontSize: 22, lineHeight: 24, letterSpacing: -0.4, color: light ? colors.sand50 : colors.forest900 }}>EcoTrail</Txt>
        {tagline && (
          <Txt style={{ fontFamily: font.bold, fontSize: 9.5, lineHeight: 12, letterSpacing: 2.1, textTransform: "uppercase", color: light ? "rgba(235,226,208,0.8)" : colors.ink500 }}>
            {tagline}
          </Txt>
        )}
      </View>
    </View>
  );
}
