import { Linking, Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_URL } from "./api";

/** Downloads the trail's GPX and opens the share sheet, so it can go to Organic Maps, OsmAnd, Files… */
export async function shareGpx(slug: string, name: string): Promise<void> {
  const url = `${API_URL}/trails/${encodeURIComponent(slug)}/gpx`;
  if (Platform.OS === "web") {
    await Linking.openURL(url);
    return;
  }
  const safeName = `${name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || slug}.gpx`;
  const target = new File(Paths.cache, safeName);
  if (target.exists) target.delete();
  const file = await File.downloadFileAsync(url, target);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: "application/gpx+xml", UTI: "com.topografix.gpx", dialogTitle: name });
  } else {
    await Linking.openURL(url);
  }
}
