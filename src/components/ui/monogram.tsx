import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { colors, font } from "@/theme";
import { imageUrl } from "@/lib/api";
import { Txt } from "./text";

function initials(name: string): string {
  return name
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase())
    .join("");
}

/** Guide photo, or initials on the forest gradient (the website's monogram). */
export function Avatar({ name, photo, size = 56, rounded = size / 2 }: { name: string; photo?: string | null; size?: number; rounded?: number }) {
  const uri = imageUrl(photo);
  const box = { width: size, height: size, borderRadius: rounded };
  if (uri) return <Image source={{ uri }} style={[box, styles.photo]} contentFit="cover" transition={200} />;
  return (
    <LinearGradient colors={[colors.forest600, colors.forest900]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[box, styles.mono]}>
      <View>
        <Txt style={{ fontFamily: font.display, fontSize: size * 0.38, color: colors.sand50, letterSpacing: -0.5 }}>{initials(name)}</Txt>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: colors.sand200 },
  mono: { alignItems: "center", justifyContent: "center" },
});
