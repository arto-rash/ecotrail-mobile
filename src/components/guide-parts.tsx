import { useState } from "react";
import { LayoutAnimation, Linking, Platform, StyleSheet, UIManager, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { AtSign, CalendarDays, ChevronDown, Clock, Globe, Mail, MapPin, MessageCircle, Phone, Send, UsersRound, type LucideIcon } from "lucide-react-native";
import { colors, font, radius } from "@/theme";
import { fill, useI18n } from "@/i18n";
import { api, query } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import type { ContactChannel, GuideContact, GuideTour } from "@/lib/types";
import { DifficultyBadge } from "./ui/badges";
import { Bouncy } from "./ui/bouncy";
import { Button } from "./ui/button";
import { Chip } from "./ui/chip";
import { Txt } from "./ui/text";

if (Platform.OS === "android") UIManager.setLayoutAnimationEnabledExperimental?.(true);

/** Contact details stay hidden until the visitor asks; one tap reveals every channel. */
export function ContactReveal({ slug, channels }: { slug: string; channels: ContactChannel[] }) {
  const { dict, locale } = useI18n();
  const g = dict.guides;
  const [contact, setContact] = useState<GuideContact | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function reveal() {
    setState("loading");
    try {
      const res = await api<{ data: GuideContact }>(`guides/${encodeURIComponent(slug)}/contact${query({ lang: locale })}`, { method: "POST" });
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setContact(res.data);
      setState("idle");
      haptic.success();
    } catch {
      setState("error");
      haptic.error();
    }
  }

  if (!channels.length) return null;

  if (!contact) {
    return (
      <View style={{ gap: 8 }}>
        <Button icon={Phone} loading={state === "loading"} onPress={reveal} full size="lg">
          {g.showContact}
        </Button>
        {state === "error" && (
          <Txt variant="small" color={colors.pomegranate600}>
            {g.contactError}
          </Txt>
        )}
      </View>
    );
  }

  const rows = [
    contact.phone && { icon: Phone, label: g.call, value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}` },
    contact.whatsapp_url && { icon: MessageCircle, label: g.whatsappLabel, value: contact.whatsapp, href: contact.whatsapp_url },
    contact.email && { icon: Mail, label: g.emailLabel, value: contact.email, href: `mailto:${contact.email}` },
    contact.website && { icon: Globe, label: g.websiteLabel, value: contact.website.replace(/^https?:\/\//, ""), href: contact.website },
    contact.instagram_url && { icon: AtSign, label: g.instagramLabel, value: contact.instagram, href: contact.instagram_url },
    contact.telegram_url && { icon: Send, label: g.telegramLabel, value: contact.telegram, href: contact.telegram_url },
  ].filter(Boolean) as { icon: LucideIcon; label: string; value: string | null; href: string }[];

  return (
    <Animated.View entering={FadeIn.duration(250)} style={{ gap: 10 }}>
      <View style={styles.contactList}>
        {rows.map(({ icon: Icon, label, value, href }, i) => (
          <Bouncy key={label} scaleTo={0.98} onPress={() => Linking.openURL(href)} style={[styles.contactRow, i > 0 && styles.contactDivider]} accessibilityRole="link">
            <View style={styles.contactIcon}>
              <Icon size={17} color={colors.forest700} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="eyebrow" color={colors.ink500} style={{ letterSpacing: 1.2, fontSize: 10 }}>
                {label}
              </Txt>
              <Txt variant="bodyStrong" numberOfLines={1}>
                {value}
              </Txt>
            </View>
          </Bouncy>
        ))}
      </View>
      <Txt variant="small" color={colors.ink500}>
        {contact.is_sample ? g.contactSampleNote : g.contactHint}
      </Txt>
    </Animated.View>
  );
}

export function TourCard({ tour }: { tour: GuideTour }) {
  const { dict, locale } = useI18n();
  const c = dict.common;
  const t = dict.tours;
  const [open, setOpen] = useState(false);
  const unit = tour.duration_unit === "days" ? (tour.duration_value === 1 ? c.dayUnit : c.daysUnit) : tour.duration_value === 1 ? c.hourUnit : c.hoursUnit;
  const hasDetails = !!(tour.description || tour.includes.length || tour.meeting_point || tour.trails.length);

  return (
    <View style={styles.tour}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <DifficultyBadge difficulty={tour.difficulty} />
          <Txt variant="cardTitle">{tour.title}</Txt>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          {tour.price_azn != null ? (
            <>
              <Txt style={styles.price}>{formatNumber(locale, tour.price_azn)} ₼</Txt>
              <Txt variant="micro" color={colors.ink500}>
                {tour.price_unit?.label}
              </Txt>
            </>
          ) : (
            <Txt variant="small" color={colors.ink500}>
              {dict.guides.priceOnRequest}
            </Txt>
          )}
        </View>
      </View>

      {tour.summary && (
        <Txt variant="body" color={colors.ink700}>
          {tour.summary}
        </Txt>
      )}

      <View style={styles.facts}>
        <Fact icon={Clock} text={`${formatNumber(locale, tour.duration_value)} ${unit}`} />
        {tour.group_size_max != null && <Fact icon={UsersRound} text={fill(t.groupSize, { count: tour.group_size_max })} />}
        {tour.months.length > 0 && <Fact icon={CalendarDays} text={tour.months.length === 12 ? "12/12" : tour.months.map((mo) => c.monthsShort[mo - 1]).join(", ")} />}
      </View>

      {open && (
        <Animated.View entering={FadeIn.duration(220)} style={{ gap: 14 }}>
          {tour.description && (
            <Txt variant="body" color={colors.ink700}>
              {tour.description}
            </Txt>
          )}
          {tour.includes.length > 0 && (
            <View style={{ gap: 6 }}>
              <Txt variant="label">{t.includes}</Txt>
              {tour.includes.map((item) => (
                <View key={item} style={{ flexDirection: "row", gap: 8 }}>
                  <Txt color={colors.forest600} style={{ fontFamily: font.heavy }}>
                    ✓
                  </Txt>
                  <Txt variant="body" color={colors.ink700} style={{ flex: 1 }}>
                    {item}
                  </Txt>
                </View>
              ))}
            </View>
          )}
          {tour.meeting_point && (
            <View style={{ gap: 4 }}>
              <Txt variant="label">{t.meetingPoint}</Txt>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                <MapPin size={15} color={colors.forest600} />
                <Txt variant="body" color={colors.ink700} style={{ flex: 1 }}>
                  {tour.meeting_point}
                </Txt>
              </View>
            </View>
          )}
          {tour.trails.length > 0 && (
            <View style={{ gap: 8 }}>
              <Txt variant="label">{t.trails}</Txt>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {tour.trails.map((tr) => (
                  <Chip key={tr.slug} label={tr.name} onPress={() => router.push(`/trail/${tr.slug}`)} />
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {hasDetails && (
        <Bouncy
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setOpen((o) => !o);
          }}
          style={styles.toggle}
          scaleTo={0.97}
        >
          <Txt style={styles.toggleText}>{open ? t.hideDetails : t.details}</Txt>
          <ChevronDown size={16} color={colors.forest700} strokeWidth={2.5} style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }} />
        </Bouncy>
      )}
    </View>
  );
}

function Fact({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Icon size={14} color={colors.ink500} strokeWidth={2.2} />
      <Txt style={{ fontFamily: font.bold, fontSize: 13, color: colors.ink700 }}>{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  contactList: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.sand200, backgroundColor: colors.white, overflow: "hidden" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  contactDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.sand300 },
  contactIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.moss100, alignItems: "center", justifyContent: "center" },
  tour: { padding: 18, gap: 12, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.sand200 },
  price: { fontFamily: font.display, fontSize: 22, color: colors.ink900 },
  facts: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4 },
  toggleText: { fontFamily: font.bold, fontSize: 14, color: colors.forest700 },
});
