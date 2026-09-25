import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react-native";
import { colors } from "@/theme";
import { useI18n } from "@/i18n";
import { api, ApiError, query } from "@/lib/api";
import { haptic } from "@/lib/haptics";
import { FormScreen } from "@/components/form-screen";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { StarRatingInput } from "@/components/ui/stars";
import { EmptyState } from "@/components/ui/states";
import { Txt } from "@/components/ui/text";

const QUERY_KEY = { trails: "trail", places: "place", guides: "guide" } as const;

export default function WriteReview() {
  const { kind, slug } = useLocalSearchParams<{ kind: "trails" | "places" | "guides"; slug: string }>();
  const { dict, locale, m } = useI18n();
  const r = dict.reviews;
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [general, setGeneral] = useState<string | null>(null);

  async function submit() {
    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.author_name = dict.submit.errYourName;
    if (!rating) local.rating = m.review.ratingRequired;
    if (body.trim().length < 10) local.body = m.review.bodyShort;
    setErrors(local);
    if (Object.keys(local).length) {
      haptic.error();
      return;
    }
    setStatus("sending");
    setGeneral(null);
    try {
      await api(`${kind}/${encodeURIComponent(slug)}/reviews${query({ lang: locale })}`, {
        method: "POST",
        body: JSON.stringify({ author_name: name.trim(), rating, body: body.trim() }),
      });
      haptic.success();
      setStatus("done");
      qc.invalidateQueries({ queryKey: [QUERY_KEY[kind]] });
    } catch (err) {
      setStatus("idle");
      haptic.error();
      if (err instanceof ApiError && err.status === 422) setErrors(err.fieldErrors);
      else setGeneral(err instanceof ApiError && err.status === 429 ? r.tooMany : r.error);
    }
  }

  if (status === "done") {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.sand50 }}>
        <EmptyState icon={Check} title={r.thanks} action={<Button onPress={() => router.back()}>{dict.common.back}</Button>} />
      </View>
    );
  }

  return (
    <FormScreen
      footer={
        <Button full style={{ flex: 1 }} loading={status === "sending"} onPress={submit}>
          {r.submit}
        </Button>
      }
    >
      <View style={{ gap: 10 }}>
        <Txt variant="label">{r.rating}</Txt>
        <StarRatingInput value={rating} onChange={(v) => { setRating(v); setErrors((e) => ({ ...e, rating: "" })); }} />
        {errors.rating && (
          <Txt variant="small" color={colors.pomegranate600}>
            {errors.rating}
          </Txt>
        )}
      </View>
      <Field label={r.name} value={name} onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, author_name: "" })); }} error={errors.author_name} autoComplete="name" textContentType="name" maxLength={80} returnKeyType="next" />
      <Field label={r.body} value={body} onChangeText={(v) => { setBody(v); setErrors((e) => ({ ...e, body: "" })); }} error={errors.body} placeholder={r.bodyHint} multiline maxLength={2000} />
      {general && (
        <Txt variant="small" color={colors.pomegranate600}>
          {general}
        </Txt>
      )}
    </FormScreen>
  );
}
