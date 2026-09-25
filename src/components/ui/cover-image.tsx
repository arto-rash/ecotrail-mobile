import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Castle, Droplets, Mountain, MountainSnow, Route, Trees, Waves, type LucideIcon } from "lucide-react-native";
import { colors } from "@/theme";
import { imageUrl } from "@/lib/api";
import { Topo } from "./topo";

const ICONS: Record<string, LucideIcon> = {
  waterfall: Droplets,
  lake: Waves,
  peak: MountainSnow,
  village: Mountain,
  historic: Castle,
  park: Trees,
  trail: Route,
};

const BLURHASH = "L7F$C,~q00RP_3M{WBt700IU%MRj";

type Props = {
  src: string | null | undefined;
  kind?: string;
  style?: StyleProp<ViewStyle>;
  /** Darkens the bottom so text on top stays readable. */
  scrim?: boolean;
  /** Darkens the top too, for headers with buttons over the photo. */
  topScrim?: boolean;
  priority?: "low" | "normal" | "high";
};

/** A photo, or the topo placeholder with a type icon when there isn't one. */
export function CoverImage({ src, kind = "trail", style, scrim, topScrim, priority }: Props) {
  const uri = imageUrl(src);
  const Icon = ICONS[kind] ?? Route;

  return (
    <View style={[styles.wrap, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          placeholder={{ blurhash: BLURHASH }}
          priority={priority}
          cachePolicy="memory-disk"
          recyclingKey={uri}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Topo color={colors.forest600} size={420} style={styles.topo} />
          <Icon size={34} color={colors.moss200} strokeWidth={1.6} />
        </View>
      )}
      {topScrim && (
        <LinearGradient colors={["rgba(14,34,23,0.55)", "rgba(14,34,23,0)"]} style={[StyleSheet.absoluteFill, { bottom: "55%" }]} pointerEvents="none" />
      )}
      {scrim && (
        <LinearGradient colors={["rgba(14,34,23,0)", "rgba(14,34,23,0.35)", "rgba(14,34,23,0.9)"]} locations={[0.35, 0.6, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: colors.forest800 },
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.forest800 },
  topo: { position: "absolute", top: -120, left: -100 },
});
