import { createElement, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "@/theme";
import { AZ_BOUNDS, mapHtml } from "./map-html";
import type { MapHandle, MapOutMessage, MapViewProps } from "./types";

/** Web build: the same map page in an iframe, bridged with window.postMessage. */
export const MapView = forwardRef<MapHandle, MapViewProps>(function MapView({ interactive = true, bounds = AZ_BOUNDS, style, onMessage }, ref) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(true);
  const handler = useRef(onMessage);
  handler.current = onMessage;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => mapHtml({ interactive, bounds }), []);

  useImperativeHandle(ref, () => ({
    send: (msg) => frame.current?.contentWindow?.postMessage({ __ecotrail_in: true, payload: JSON.stringify(msg) }, "*"),
  }));

  useEffect(() => {
    const listen = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data?.__ecotrail) return;
      try {
        const msg = JSON.parse(e.data.payload) as MapOutMessage;
        if (msg.type === "ready") setLoading(false);
        handler.current?.(msg);
      } catch {}
    };
    window.addEventListener("message", listen);
    return () => window.removeEventListener("message", listen);
  }, []);

  return (
    <View style={[styles.wrap, style]}>
      {createElement("iframe", { ref: frame, srcDoc: html, style: { border: 0, width: "100%", height: "100%" }, title: "map" })}
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
  loading: { alignItems: "center", justifyContent: "center", backgroundColor: "#e9e4d6" },
});
