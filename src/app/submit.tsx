import { useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import { ArrowLeft, ArrowRight, ImagePlus, LocateFixed, MapPin, PartyPopper, Plus, X } from "lucide-react-native";
import { colors, DIFFICULTY_STYLE, font, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { api, ApiError, query } from "@/lib/api";
import { DIFFICULTIES } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useOptions } from "@/lib/queries";
import type { Difficulty } from "@/lib/types";
import { FormScreen } from "@/components/form-screen";
import { MapView } from "@/components/map/map-view";
import type { MapHandle } from "@/components/map/types";
import { Bouncy } from "@/components/ui/bouncy";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/states";
import { Txt } from "@/components/ui/text";

type Photo = { uri: string; name: string; type: string; file?: File };
type Errors = Record<string, string>;

const STEP_FIELDS: Record<number, string[]> = {
  0: ["name", "village", "description", "difficulty", "route_type", "features"],
  1: ["lat", "lng", "distance_km", "duration_minutes", "ascent_m", "max_ele_m", "waypoints"],
  2: ["photos", "submitter_name", "submitter_email"],
};

export default function SubmitTrail() {
  const { dict, locale, m } = useI18n();
  const t = dict.submit;
  const options = useOptions();
  const map = useRef<MapHandle>(null);
  const [step, setStepState] = useState(0);
  // Slide steps in only after the first move, so the opening step appears immediately.
  const [moved, setMoved] = useState(false);
  const setStep = (n: number) => {
    setMoved(true);
    setStepState(n);
  };
  const enter = moved ? FadeInRight.duration(250) : undefined;
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [general, setGeneral] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [routeType, setRouteType] = useState("out_and_back");
  const [features, setFeatures] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [ascent, setAscent] = useState("");
  const [highest, setHighest] = useState("");
  const [waypoints, setWaypoints] = useState<string[]>([""]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitter, setSubmitter] = useState("");
  const [email, setEmail] = useState("");

  const durationMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const num = (v: string) => Number(v.replace(",", "."));

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 0) {
      if (name.trim().length < 3) e.name = t.errName;
      if (description.trim().length < 30) e.description = t.errDescription;
      if (!difficulty) e.difficulty = t.errDifficulty;
    }
    if (s === 1) {
      if (!location) e.lat = t.errTrailhead;
      if (!(num(distance) > 0)) e.distance_km = t.errDistance;
      if (durationMinutes < 10) e.duration_minutes = t.errTime;
    }
    if (s === 2) {
      if (!submitter.trim()) e.submitter_name = t.errYourName;
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.submitter_email = t.errEmail;
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return haptic.error();
    haptic.tap();
    setStep(step + 1);
  }

  function setPin(lat: number, lng: number) {
    const p = { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
    setLocation(p);
    map.current?.send({ type: "pin", ...p });
    setErrors((e) => ({ ...e, lat: "" }));
    haptic.select();
  }

  async function useMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrors((e) => ({ ...e, lat: m.map.locationDenied }));
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setPin(pos.coords.latitude, pos.coords.longitude);
    map.current?.send({ type: "fly", lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 13 });
  }

  async function pickPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 10 - photos.length, quality: 0.8 });
    if (res.canceled) return;
    const picked = res.assets.map((a, i) => ({
      uri: a.uri,
      name: a.fileName ?? `photo-${Date.now()}-${i}.jpg`,
      type: a.mimeType ?? "image/jpeg",
      file: (a as { file?: File }).file,
    }));
    setPhotos((p) => [...p, ...picked].slice(0, 10));
  }

  async function submit() {
    const e = validate(2);
    setErrors(e);
    if (Object.keys(e).length) return haptic.error();

    const fd = new FormData();
    fd.append("name", name.trim());
    if (village.trim()) fd.append("village", village.trim());
    fd.append("description", description.trim());
    fd.append("difficulty", difficulty);
    fd.append("route_type", routeType);
    features.forEach((f) => fd.append("features[]", f));
    fd.append("lat", String(location!.lat));
    fd.append("lng", String(location!.lng));
    fd.append("distance_km", String(num(distance)));
    fd.append("duration_minutes", String(durationMinutes));
    if (ascent) fd.append("ascent_m", String(Math.round(num(ascent))));
    if (highest) fd.append("max_ele_m", String(Math.round(num(highest))));
    waypoints.map((w) => w.trim()).filter(Boolean).forEach((w) => fd.append("waypoints[]", w));
    photos.forEach((p) => {
      if (Platform.OS === "web" && p.file) fd.append("photos[]", p.file);
      else fd.append("photos[]", { uri: p.uri, name: p.name, type: p.type } as unknown as Blob);
    });
    fd.append("submitter_name", submitter.trim());
    fd.append("submitter_email", email.trim());

    setSending(true);
    setGeneral(null);
    try {
      await api(`trails${query({ lang: locale })}`, { method: "POST", body: fd });
      haptic.success();
      setDone(true);
    } catch (err) {
      haptic.error();
      if (err instanceof ApiError && err.status === 422) {
        const mapped = err.fieldErrors;
        setErrors(mapped);
        const first = [0, 1, 2].find((s) => STEP_FIELDS[s].some((k) => mapped[k]));
        if (first !== undefined) setStep(first);
      } else setGeneral(err instanceof ApiError && err.status === 429 ? t.errTooMany : t.errGeneric);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.sand50 }}>
        <EmptyState
          icon={PartyPopper}
          title={t.doneTitle}
          text={fill(t.doneText, { name: name.trim(), email: email.trim() })}
          action={
            <View style={{ gap: 10, alignSelf: "stretch", paddingHorizontal: 20 }}>
              <Button full onPress={() => router.back()}>
                {t.exploreTrails}
              </Button>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <FormScreen
      footer={
        <>
          {step > 0 && (
            <Button variant="outline" icon={ArrowLeft} onPress={() => setStep(step - 1)}>
              {dict.common.back}
            </Button>
          )}
          {step < 2 ? (
            <Button iconRight={ArrowRight} onPress={next} style={{ flex: 1 }}>
              {dict.common.next}
            </Button>
          ) : (
            <Button loading={sending} onPress={submit} style={{ flex: 1 }}>
              {t.submitButton}
            </Button>
          )}
        </>
      }
    >
      <View style={{ gap: 8 }}>
        <Txt variant="title">{t.title}</Txt>
        <Txt variant="body" color={colors.ink500}>
          {t.intro}
        </Txt>
      </View>

      {/* Progress */}
      <View style={{ gap: 8 }}>
        <View style={styles.progress}>
          {t.steps.map((label, i) => (
            <View key={label} style={[styles.bar, i <= step && styles.barOn]} />
          ))}
        </View>
        <Txt variant="label" color={colors.forest700}>
          {fill(m.submit.step, { step: step + 1, total: 3 })} · {t.steps[step]}
        </Txt>
      </View>

      {step === 0 && (
        <Animated.View key="s0" entering={enter} style={styles.step}>
          <Field label={t.name} placeholder={t.namePlaceholder} value={name} onChangeText={setName} error={errors.name} maxLength={120} />
          <Field label={t.village} placeholder={t.villagePlaceholder} value={village} onChangeText={setVillage} error={errors.village} />
          <Field label={t.description} hint={t.descriptionHint} value={description} onChangeText={setDescription} error={errors.description} multiline maxLength={5000} />
          <View style={{ gap: 8 }}>
            <Txt variant="label">{t.difficulty}</Txt>
            <View style={styles.diffGrid}>
              {DIFFICULTIES.map((d) => {
                const on = difficulty === d;
                const s = DIFFICULTY_STYLE[d];
                return (
                  <Bouncy key={d} onPress={() => { haptic.select(); setDifficulty(d); }} scaleTo={0.97} style={[styles.diff, on && { backgroundColor: s.bg, borderColor: s.dot }]}>
                    <View style={[styles.diffDot, { backgroundColor: s.dot }]} />
                    <View style={{ flex: 1 }}>
                      <Txt style={[styles.diffTitle, on && { color: s.fg }]}>{dict.difficulty[d]}</Txt>
                      <Txt variant="micro" color={colors.ink500} numberOfLines={2}>
                        {dict.difficultyBlurb[d]}
                      </Txt>
                    </View>
                  </Bouncy>
                );
              })}
            </View>
            {errors.difficulty && (
              <Txt variant="small" color={colors.pomegranate600}>
                {errors.difficulty}
              </Txt>
            )}
          </View>
          <View style={{ gap: 8 }}>
            <Txt variant="label">{t.routeType}</Txt>
            <Segmented
              value={routeType}
              onChange={setRouteType}
              options={(options.data?.route_types ?? Object.entries(dict.routeType).map(([value, label]) => ({ value, label }))).map((r) => ({ value: r.value, label: dict.routeType[r.value as keyof typeof dict.routeType] ?? r.label }))}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Txt variant="label">{t.features}</Txt>
            <Txt variant="small" color={colors.ink500}>
              {t.featuresHint}
            </Txt>
            <View style={styles.wrap}>
              {(options.data?.features ?? []).map((f) => (
                <Chip key={f.value} label={dict.feature[f.value as keyof typeof dict.feature] ?? f.label} selected={features.includes(f.value)} onPress={() => setFeatures((l) => (l.includes(f.value) ? l.filter((x) => x !== f.value) : [...l, f.value]))} />
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {step === 1 && (
        <Animated.View key="s1" entering={enter} style={styles.step}>
          <View style={{ gap: 8 }}>
            <Txt variant="label">{t.trailhead}</Txt>
            <Txt variant="small" color={colors.ink500}>
              {m.submit.tapMap}
            </Txt>
            <View style={[styles.map, !!errors.lat && { borderColor: colors.pomegranate500 }]}>
              <MapView
                ref={map}
                style={StyleSheet.absoluteFill}
                onMessage={(msg) => {
                  if (msg.type === "press" || msg.type === "longpress") setPin(msg.lat, msg.lng);
                  if (msg.type === "ready" && location) map.current?.send({ type: "pin", ...location });
                }}
              />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Chip icon={LocateFixed} label={m.submit.useMyLocation} onPress={useMyLocation} />
              {location && (
                <Animated.View entering={FadeIn} style={styles.pinned}>
                  <MapPin size={14} color={colors.forest700} />
                  <Txt variant="small" color={colors.forest800}>
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </Txt>
                </Animated.View>
              )}
            </View>
            {errors.lat && (
              <Txt variant="small" color={colors.pomegranate600}>
                {errors.lat || errors.lng}
              </Txt>
            )}
          </View>
          <Field label={t.distance} value={distance} onChangeText={setDistance} keyboardType="decimal-pad" error={errors.distance_km} placeholder="8.5" />
          <View style={{ gap: 8 }}>
            <Txt variant="label">{t.time}</Txt>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field placeholder={t.hours} value={hours} onChangeText={setHours} keyboardType="number-pad" maxLength={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Field placeholder={t.minutes} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={2} />
              </View>
            </View>
            {errors.duration_minutes && (
              <Txt variant="small" color={colors.pomegranate600}>
                {errors.duration_minutes}
              </Txt>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label={t.ascent} value={ascent} onChangeText={setAscent} keyboardType="number-pad" error={errors.ascent_m} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t.highest} value={highest} onChangeText={setHighest} keyboardType="number-pad" error={errors.max_ele_m} />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Txt variant="label">{t.waypoints}</Txt>
            <Txt variant="small" color={colors.ink500}>
              {t.waypointsHint}
            </Txt>
            {waypoints.map((w, i) => (
              <Field
                key={i}
                value={w}
                placeholder={i === 0 ? t.waypointFirst : t.waypointNext}
                onChangeText={(v) => setWaypoints((l) => l.map((x, j) => (j === i ? v : x)))}
                right={
                  waypoints.length > 1 ? (
                    <Pressable onPress={() => setWaypoints((l) => l.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel={t.removeWaypoint}>
                      <X size={18} color={colors.ink400} />
                    </Pressable>
                  ) : undefined
                }
              />
            ))}
            {waypoints.length < 30 && (
              <Button variant="ghost" size="sm" icon={Plus} onPress={() => setWaypoints((l) => [...l, ""])} style={{ alignSelf: "flex-start" }}>
                {t.addWaypoint}
              </Button>
            )}
          </View>
        </Animated.View>
      )}

      {step === 2 && (
        <Animated.View key="s2" entering={enter} style={styles.step}>
          <View style={{ gap: 8 }}>
            <Txt variant="label">{t.photos}</Txt>
            <Txt variant="small" color={colors.ink500}>
              {t.photosHint}
            </Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {photos.map((p, i) => (
                <View key={p.uri} style={styles.photo}>
                  <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {i === 0 && (
                    <View style={styles.cover}>
                      <Txt variant="micro" color={colors.sand50}>
                        {t.cover}
                      </Txt>
                    </View>
                  )}
                  <Pressable onPress={() => setPhotos((l) => l.filter((x) => x.uri !== p.uri))} style={styles.remove} accessibilityLabel={t.removePhoto} hitSlop={6}>
                    <X size={14} color={colors.white} strokeWidth={2.8} />
                  </Pressable>
                </View>
              ))}
              {photos.length < 10 && (
                <Bouncy onPress={pickPhotos} style={styles.addPhoto} scaleTo={0.95}>
                  <ImagePlus size={24} color={colors.forest700} />
                  <Txt variant="micro" color={colors.forest700}>
                    {t.addPhotos}
                  </Txt>
                </Bouncy>
              )}
            </ScrollView>
            {errors.photos && (
              <Txt variant="small" color={colors.pomegranate600}>
                {errors.photos}
              </Txt>
            )}
          </View>
          <Field label={t.yourName} value={submitter} onChangeText={setSubmitter} error={errors.submitter_name} autoComplete="name" textContentType="name" />
          <Field label={t.email} hint={t.emailHint} value={email} onChangeText={setEmail} error={errors.submitter_email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          {general && (
            <Txt variant="small" color={colors.pomegranate600}>
              {general}
            </Txt>
          )}
        </Animated.View>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  step: { gap: 20 },
  progress: { flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.sand200 },
  barOn: { backgroundColor: colors.forest600 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  diffGrid: { gap: 8 },
  diff: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.sand200, backgroundColor: colors.white },
  diffDot: { width: 12, height: 12, borderRadius: 6 },
  diffTitle: { fontFamily: font.heavy, fontSize: 15, color: colors.ink900 },
  map: { height: 260, borderRadius: radius.card, overflow: "hidden", borderWidth: 1.5, borderColor: colors.sand200 },
  pinned: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 32, borderRadius: radius.pill, backgroundColor: colors.moss100 },
  photo: { width: 110, height: 110, borderRadius: 16, overflow: "hidden", backgroundColor: colors.sand200 },
  cover: { position: "absolute", left: 6, bottom: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: "rgba(14,34,23,0.75)" },
  remove: { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(14,34,23,0.7)", alignItems: "center", justifyContent: "center" },
  addPhoto: { width: 110, height: 110, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.forest600, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.moss100, paddingHorizontal: 8 },
});

