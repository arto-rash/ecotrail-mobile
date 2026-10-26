import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, type as typeScale } from "@/theme";

type Variant = keyof typeof typeScale;

type Props = TextProps & { variant?: Variant; color?: string; align?: TextStyle["textAlign"] };

/** The app's text: Geologica throughout, with the sharp ExtraBold cut for headings. */
export function Txt({ variant = "body", color = colors.ink900, align, style, ...rest }: Props) {
  return <Text {...rest} style={[typeScale[variant], { color, textAlign: align }, style]} />;
}

/** Inline span inside a Txt: inherits the parent's size and colour, overrides only what's given. */
export function Span(props: TextProps) {
  return <Text {...props} />;
}
