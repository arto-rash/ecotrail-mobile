import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import { colors, font, radius } from "@/theme";
import { haptic } from "@/lib/haptics";
import { Bouncy } from "./bouncy";
import { Chip } from "./chip";
import { Sheet } from "./sheet";
import { Txt } from "./text";

export type SelectOption = { value: string; label: string; dot?: string; hint?: string };

/** A list of options inside a sheet; the app's own picker instead of the platform one. */
export function OptionList({ options, value, onChange }: { options: SelectOption[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ gap: 2 }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Bouncy
            key={o.value || "__all"}
            scaleTo={0.98}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              haptic.select();
              onChange(o.value);
            }}
            style={[styles.option, selected && styles.optionSelected]}
          >
            {o.dot && <View style={[styles.dot, { backgroundColor: o.dot }]} />}
            <View style={{ flex: 1 }}>
              <Txt style={[styles.optionLabel, selected && { color: colors.forest800 }]}>{o.label}</Txt>
              {o.hint && (
                <Txt variant="small" color={colors.ink500}>
                  {o.hint}
                </Txt>
              )}
            </View>
            {selected && <Check size={18} color={colors.forest700} strokeWidth={2.6} />}
          </Bouncy>
        );
      })}
    </View>
  );
}

/** A chip that opens an option sheet. */
export function SelectChip({ label, title, options, value, onChange }: { label: string; title: string; options: SelectOption[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  // The first option is the default ("all regions", "most popular"): the chip only lights up when changed.
  const changed = !!current && current.value !== options[0]?.value;
  return (
    <>
      <Chip label={changed ? current.label : current && current.value ? current.label : label} dot={changed ? current?.dot : undefined} selected={changed} dropdown onPress={() => setOpen(true)} />
      <Sheet open={open} onClose={() => setOpen(false)} title={title} scroll>
        <OptionList
          options={options}
          value={value}
          onChange={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 50, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md },
  optionSelected: { backgroundColor: colors.moss100 },
  optionLabel: { fontFamily: font.bold, fontSize: 15, color: colors.ink900 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
