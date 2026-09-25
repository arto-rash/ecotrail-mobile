import { Platform } from "react-native";

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function googleDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function appleMapsUrl(lat: number, lng: number, label?: string, directions = false): string {
  const q = label ? `&q=${encodeURIComponent(label)}` : "";
  return directions ? `https://maps.apple.com/?daddr=${lat},${lng}${q}` : `https://maps.apple.com/?ll=${lat},${lng}${q}`;
}

export function osmUrl(lat: number, lng: number, zoom = 14): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

export const isIOS = Platform.OS === "ios";
