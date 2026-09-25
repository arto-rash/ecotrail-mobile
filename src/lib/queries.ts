import { QueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { api, ApiError, query } from "./api";
import type {
  Guide,
  GuideDetail,
  MapData,
  Options,
  Paginated,
  Place,
  PlaceDetail,
  Region,
  Stats,
  Trail,
  TrailDetail,
} from "./types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

export type TrailFilters = {
  q?: string;
  region?: string;
  difficulty?: string[];
  feature?: string[];
  max_duration?: string;
  sort?: string;
  featured?: boolean;
};

export type PlaceFilters = {
  q?: string;
  region?: string;
  type?: string[];
  sort?: string;
  featured?: boolean;
};

export type GuideFilters = { region?: string; language?: string; kind?: string };

const PAGE = 20;

function useLang() {
  return useI18n().locale;
}

export function useTrails(filters: TrailFilters) {
  const lang = useLang();
  return useInfiniteQuery({
    queryKey: ["trails", lang, filters],
    queryFn: ({ pageParam }) =>
      api<Paginated<Trail>>(`trails${query({ ...filters, lang, per_page: PAGE, page: pageParam })}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useFeaturedTrails(limit = 8, region?: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["trails-list", lang, limit, region],
    queryFn: () =>
      api<Paginated<Trail>>(`trails${query({ lang, per_page: limit, region, featured: region ? undefined : true, sort: "popular" })}`).then((r) => r.data),
  });
}

export function usePlaces(filters: PlaceFilters) {
  const lang = useLang();
  return useInfiniteQuery({
    queryKey: ["places", lang, filters],
    queryFn: ({ pageParam }) =>
      api<Paginated<Place>>(`places${query({ ...filters, lang, per_page: PAGE, page: pageParam })}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined),
  });
}

export function useFeaturedPlaces(limit = 8, region?: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["places-list", lang, limit, region],
    queryFn: () =>
      api<Paginated<Place>>(`places${query({ lang, per_page: limit, region, featured: region ? undefined : true })}`).then((r) => r.data),
  });
}

export function useTrail(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["trail", lang, slug],
    queryFn: () => api<{ data: TrailDetail }>(`trails/${slug}${query({ lang })}`).then((r) => r.data),
  });
}

export function useNearbyTrails(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["trail-nearby", lang, slug],
    queryFn: () => api<{ data: Trail[] }>(`trails/${slug}/nearby${query({ lang })}`).then((r) => r.data),
  });
}

export function usePlace(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["place", lang, slug],
    queryFn: () => api<{ data: PlaceDetail }>(`places/${slug}${query({ lang })}`).then((r) => r.data),
  });
}

export function useNearbyPlaces(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["place-nearby", lang, slug],
    queryFn: () => api<{ data: Place[] }>(`places/${slug}/nearby${query({ lang })}`).then((r) => r.data),
  });
}

export function useGuides(filters: GuideFilters = {}) {
  const lang = useLang();
  return useQuery({
    queryKey: ["guides", lang, filters],
    queryFn: () => api<{ data: Guide[] }>(`guides${query({ ...filters, lang })}`).then((r) => r.data),
  });
}

export function useGuide(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ["guide", lang, slug],
    queryFn: () => api<{ data: GuideDetail }>(`guides/${slug}${query({ lang })}`).then((r) => r.data),
  });
}

export function useRegions() {
  const lang = useLang();
  return useQuery({
    queryKey: ["regions", lang],
    queryFn: () => api<{ data: Region[] }>(`regions${query({ lang })}`).then((r) => r.data),
    staleTime: 60 * 60_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api<{ data: Stats }>("stats").then((r) => r.data),
  });
}

export function useOptions() {
  const lang = useLang();
  return useQuery({
    queryKey: ["options", lang],
    queryFn: () => api<{ data: Options }>(`options${query({ lang })}`).then((r) => r.data),
    staleTime: 60 * 60_000,
  });
}

export function useMapData() {
  const lang = useLang();
  return useQuery({
    queryKey: ["map", lang],
    queryFn: () => api<MapData>(`map${query({ lang })}`),
    staleTime: 30 * 60_000,
  });
}
