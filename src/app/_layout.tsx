import { useEffect } from "react";
import { Platform, Pressable } from "react-native";
import { router, Stack } from "expo-router";
import { X } from "lucide-react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Fraunces_600SemiBold, Fraunces_600SemiBold_Italic, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { LocaleProvider, useI18n } from "@/i18n";
import { queryClient } from "@/lib/queries";
import { colors, font } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

function CloseButton() {
  const { m } = useI18n();
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={m.common.close}
      style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.sand100, alignItems: "center", justifyContent: "center" }}
    >
      <X size={18} color={colors.ink700} strokeWidth={2.4} />
    </Pressable>
  );
}

const modal = { presentation: "modal" as const, headerRight: () => <CloseButton /> };

function RootStack() {
  const { ready, dict, m } = useI18n();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_700Bold,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const loaded = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.sand50 },
        headerStyle: { backgroundColor: colors.sand50 },
        headerShadowVisible: false,
        headerTintColor: colors.forest800,
        headerTitleStyle: { fontFamily: font.display, fontSize: 18, color: colors.ink900 },
        headerBackButtonDisplayMode: "minimal",
        animation: Platform.OS === "android" ? "fade_from_bottom" : "default",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trail/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="place/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="guide/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="region/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="challenges" options={{ title: dict.nav.challenges }} />
      <Stack.Screen name="sources" options={{ title: dict.sources.title }} />
      <Stack.Screen name="review/[kind]/[slug]" options={{ ...modal, title: dict.reviews.write }} />
      <Stack.Screen name="submit" options={{ ...modal, title: dict.submit.eyebrow }} />
      <Stack.Screen name="apply" options={{ ...modal, title: m.guides.applyShort }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.sand50 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LocaleProvider>
            <StatusBar style="dark" />
            <RootStack />
          </LocaleProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
