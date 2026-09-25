import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { colors } from "@/theme";
import { AZ_BOUNDS, mapHtml } from "./map-html";
import type { MapHandle, MapOutMessage, MapViewProps } from "./types";

/** MapLibre in a WebView — works in Expo Go and looks exactly like the website's map. */
export const MapView = forwardRef<MapHandle, MapViewProps>(function MapView({ interactive = true, bounds = AZ_BOUNDS, style, onMessage }, ref) {
  const web = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  // The HTML is built once; later changes go through messages so the map never reloads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const source = useMemo(() => ({ html: mapHtml({ interactive, bounds }), baseUrl: "https://ecotrail.app/" }), []);

  useImperativeHandle(ref, () => ({
    send: (msg) => web.current?.injectJavaScript(`window.__recv && window.__recv(${JSON.stringify(JSON.stringify(msg))});true;`),
  }));

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={web}
        source={source}
        originWhitelist={["*"]}
        style={styles.web}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        allowsLinkPreview={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data) as MapOutMessage;
            if (msg.type === "ready") setLoading(false);
            onMessage?.(msg);
          } catch {}
        }}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loading]} pointerEvents="none">
          <ActivityIndicator color={colors.forest700} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: "#e9e4d6" },
  web: { flex: 1, backgroundColor: "transparent" },
  loading: { alignItems: "center", justifyContent: "center", backgroundColor: "#e9e4d6" },
});
