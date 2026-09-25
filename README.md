# EcoTrail — mobile

The EcoTrail app for iOS and Android: mapped hiking trails, waterfalls, lakes and peaks across Azerbaijan, with local guides. Built with Expo (SDK 57) and Expo Router, talking to the same Laravel API as the [website](https://github.com/arto-rash/ecotrail-frontend).

## Run it

```bash
npm install
npx expo start          # scan the QR code with Expo Go, or press i / a for a simulator
```

Everything runs in Expo Go — the map is MapLibre inside a WebView, so no native map SDK or API key is needed.

### Environment

Copy `.env.example` to `.env` to point at another API:

| Variable | Default |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | `https://ecotrail-api.135-225-57-4.sslip.io/api` |
| `EXPO_PUBLIC_WEB_URL` | `https://ecotrail-frontend.vercel.app` (catalogue photos, share links) |

For a local backend on a device, use your machine's LAN IP (e.g. `http://192.168.1.20:8000/api`).

## What's inside

- **Home** — hero search, live stats, featured trails, the 14 economic regions as a tappable map, places, eco-challenges, guides.
- **Explore** — trails and places with search, region / duration / difficulty / feature / type filters and sorting, infinite scroll.
- **Map** — every route and place on OpenFreeMap tiles, layer chips, "near me", a peek card with directions.
- **Trail / place pages** — stats, route map, finger-scrub elevation profile, GPX export via the share sheet, directions in Google or Apple Maps, reviews with half-star ratings, sources.
- **Guides** — filters, profiles, tours, and contact details that are only fetched when you tap "Show contact".
- **Forms** — write a review, share a trail (3 steps, map pin, photos), apply as a partner guide.
- Azerbaijani and English, following the device language; switch under **More**.

## Structure

```
src/
  app/          Expo Router screens: (tabs), trail/[slug], place/[slug], guide/[slug], region/[slug], modals
  components/   UI kit (ui/), cards, map (WebView bridge), detail parts, tab bar
  i18n/         az.json + en.json shared with the website, plus mobile-only strings
  lib/          API client, React Query hooks, formatting, GPX, haptics
  theme/        colours, type, radii and shadows — the website's tokens
```

## Checks

```bash
npm run typecheck
npm run lint
npx expo-doctor
```

## Builds

EAS profiles live in `eas.json` (`development`, `preview`, `production`):

```bash
npx eas-cli@latest build --profile preview --platform android
```
