import { View } from "react-native";
import { router, Stack } from "expo-router";
import { Compass } from "lucide-react-native";
import { colors } from "@/theme";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function NotFound() {
  const { dict } = useI18n();
  const e = dict.errors;
  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.sand50 }}>
      <Stack.Screen options={{ title: e.notFoundEyebrow }} />
      <EmptyState icon={Compass} title={e.notFoundTitle} text={e.notFoundText} action={<Button onPress={() => router.replace("/")}>{e.backToTrails}</Button>} />
    </View>
  );
}
