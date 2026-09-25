import { forwardRef, useState, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, font, radius } from "@/theme";
import { Txt } from "./text";

type Props = TextInputProps & { label?: string; hint?: string; error?: string; right?: ReactNode };

export const Field = forwardRef<TextInput, Props>(function Field({ label, hint, error, right, style, multiline, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label && <Txt variant="label">{label}</Txt>}
      <View style={[styles.box, multiline && styles.multi, focused && styles.focused, !!error && styles.error]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.ink400}
          selectionColor={colors.forest600}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, multiline && { minHeight: 110, paddingTop: 12 }, style]}
        />
        {right}
      </View>
      {error ? (
        <Txt variant="small" color={colors.pomegranate600}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="small" color={colors.ink500}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sand200,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
  },
  multi: { alignItems: "flex-start" },
  focused: { borderColor: colors.forest600, borderWidth: 1.5 },
  error: { borderColor: colors.pomegranate500 },
  input: { flex: 1, fontFamily: font.semibold, fontSize: 15, color: colors.ink900, paddingVertical: 12 },
});
