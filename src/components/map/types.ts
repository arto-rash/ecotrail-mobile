import type { StyleProp, ViewStyle } from "react-native";

export type MapInMessage =
  | { type: "data"; trails?: unknown; places?: unknown }
  | { type: "visibility"; trails: boolean; places: boolean; placeTypes?: string[] }
  | { type: "active"; slug: string | null }
  | { type: "fit"; bbox: [number, number, number, number]; padding?: number | { top: number; bottom: number; left: number; right: number }; animate?: boolean; maxZoom?: number }
  | { type: "fly"; lat: number; lng: number; zoom?: number }
  | { type: "padding"; bottom: number }
  | { type: "pin"; lat: number | null; lng: number | null }
  | { type: "me"; lat: number | null; lng: number | null };

export type MapOutMessage =
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "select"; kind: "trail" | "place"; slug: string }
  | { type: "press"; lat: number; lng: number }
  | { type: "longpress"; lat: number; lng: number }
  | { type: "bounds"; bbox: [number, number, number, number]; zoom: number };

export type MapHandle = { send: (msg: MapInMessage) => void };

export type MapViewProps = {
  interactive?: boolean;
  bounds?: [number, number, number, number];
  style?: StyleProp<ViewStyle>;
  onMessage?: (msg: MapOutMessage) => void;
};
