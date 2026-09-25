import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { colors } from "@/theme";
import { useI18n } from "@/i18n";
import { api, ApiError, query } from "@/lib/api";
import { haptic } from "@/lib/haptics";
import { useOptions, useRegions } from "@/lib/queries";
import { FormScreen } from "@/components/form-screen";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/states";
import { Txt } from "@/components/ui/text";

// Same fields as the website's form, so an application maps onto a guide profile 1:1.
const EMPTY = {
  name: "", kind: "guide" as "guide" | "agency", email: "", phone: "", whatsapp: "", website: "", instagram: "",
  regions: [] as string[], languages: [] as string[], specialties: [] as string[],
  experience_years: "", certifications: "", message: "",
};

type ListKey = "regions" | "languages" | "specialties";

export default function Apply() {
  const { dict, locale } = useI18n();
  const g = dict.guides;
  const regions = useRegions();
  const options = useOptions();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [general, setGeneral] = useState<string | null>(null);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key: ListKey, value: string) => setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));

  async function submit() {
    setStatus("sending");
    setErrors({});
    setGeneral(null);
    try {
      await api(`guide-applications${query({ lang: locale })}`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          website: form.website || null,
          instagram: form.instagram || null,
          certifications: form.certifications || null,
          experience_years: form.experience_years === "" ? null : Number(form.experience_years),
        }),
      });
      haptic.success();
      setStatus("done");
    } catch (err) {
      haptic.error();
      setStatus("idle");
      if (err instanceof ApiError && err.status === 422) setErrors(err.fieldErrors);
      setGeneral(g.error);
    }
  }

  if (status === "done") {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.sand50 }}>
        <EmptyState icon={Check} title={g.thanks} action={<Button onPress={() => router.back()}>{dict.common.back}</Button>} />
      </View>
    );
  }

  const chips = (key: ListKey, items: { value: string; label: string }[]) => (
    <View style={styles.wrap}>
      {items.map((i) => (
        <Chip key={i.value} label={i.label} selected={form[key].includes(i.value)} onPress={() => toggle(key, i.value)} />
      ))}
    </View>
  );

  const field = (key: "name" | "email" | "phone" | "whatsapp" | "website" | "instagram" | "experience_years", label: string, props: React.ComponentProps<typeof TextInput> = {}) => (
    <Field label={label} value={form[key]} onChangeText={(v) => set(key, v)} error={errors[key]} {...props} />
  );

  return (
    <FormScreen
      footer={
        <Button style={{ flex: 1 }} loading={status === "sending"} onPress={submit}>
          {g.submit}
        </Button>
      }
    >
      <View style={{ gap: 8 }}>
        <Txt variant="title">{g.applyTitle}</Txt>
        <Txt variant="body" color={colors.ink500}>
          {g.applyIntro}
        </Txt>
      </View>

      <View style={{ gap: 8 }}>
        <Txt variant="label">{g.kind}</Txt>
        <Segmented value={form.kind} onChange={(v) => set("kind", v)} options={[{ value: "guide", label: g.kindGuide }, { value: "agency", label: g.kindAgency }]} />
      </View>

      {field("name", g.name, { autoComplete: "name" })}
      {field("email", g.email, { keyboardType: "email-address", autoCapitalize: "none", autoComplete: "email" })}
      {field("phone", g.phone, { keyboardType: "phone-pad", autoComplete: "tel" })}
      {field("whatsapp", g.whatsapp, { keyboardType: "phone-pad" })}
      {field("website", g.website, { keyboardType: "url", autoCapitalize: "none", placeholder: "https://" })}
      {field("instagram", g.instagram, { autoCapitalize: "none", placeholder: "@" })}
      {field("experience_years", g.experienceYears, { keyboardType: "number-pad", maxLength: 2 })}

      <View style={{ gap: 8 }}>
        <Txt variant="label">{g.regions}</Txt>
        {chips("regions", (regions.data ?? []).filter((r) => r.hiking_advised).map((r) => ({ value: r.slug, label: r.name })))}
        {errors.regions && <Txt variant="small" color={colors.pomegranate600}>{errors.regions}</Txt>}
      </View>
      <View style={{ gap: 8 }}>
        <Txt variant="label">{g.languages}</Txt>
        {chips("languages", options.data?.guide_languages ?? [])}
        {errors.languages && <Txt variant="small" color={colors.pomegranate600}>{errors.languages}</Txt>}
      </View>
      <View style={{ gap: 8 }}>
        <Txt variant="label">{g.specialtiesLabel}</Txt>
        {chips("specialties", options.data?.guide_specialties ?? [])}
        {errors.specialties && <Txt variant="small" color={colors.pomegranate600}>{errors.specialties}</Txt>}
      </View>

      <Field label={g.certificationsLabel} placeholder={g.certificationsPlaceholder} value={form.certifications} onChangeText={(v) => set("certifications", v)} error={errors.certifications} multiline />
      <Field label={g.message} placeholder={g.messageHint} value={form.message} onChangeText={(v) => set("message", v)} error={errors.message} multiline />

      {general && !Object.keys(errors).length && (
        <Txt variant="small" color={colors.pomegranate600}>
          {general}
        </Txt>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
